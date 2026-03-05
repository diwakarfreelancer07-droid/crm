/**
 * POST /api/exotel/create-account
 * Admin creates an Exotel user (SIP agent) for a given agent or counselor.
 * Stores the returned Exotel SID back on the profile.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createExotelUser } from '@/lib/exotel';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId, role } = await req.json();

        if (!userId || !role) {
            return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
        }

        if (role !== 'AGENT' && role !== 'COUNSELOR') {
            return NextResponse.json({ error: 'role must be AGENT or COUNSELOR' }, { status: 400 });
        }

        // 1. Fetch the user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                agentProfile: true,
                counselorProfile: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 2. Check if already linked
        const existingSid =
            role === 'AGENT'
                ? user.agentProfile?.exotelAgentId
                : user.counselorProfile?.exotelAgentId;

        if (existingSid) {
            return NextResponse.json(
                { message: 'Already linked', exotelAgentId: existingSid },
                { status: 200 }
            );
        }

        // 3. Get phone from profile
        const phone =
            role === 'AGENT'
                ? user.agentProfile?.phone
                : user.counselorProfile?.phone;

        if (!phone) {
            return NextResponse.json(
                { error: 'User profile has no phone number. Please add a phone number first.' },
                { status: 400 }
            );
        }

        // 4. Create user in Exotel
        const nameParts = (user.name || '').split(' ');
        const firstName = nameParts[0] || 'Agent';
        const lastName = nameParts.slice(1).join(' ') || 'User';

        const exotelUser = await createExotelUser({
            firstName,
            lastName,
            email: user.email,
            phone,
        });

        const exotelAgentId = exotelUser.sid;

        // 5. Store the SID on the appropriate profile
        if (role === 'AGENT') {
            await prisma.agentProfile.update({
                where: { userId },
                data: { exotelAgentId },
            });
        } else {
            await prisma.counselorProfile.update({
                where: { userId },
                data: { exotelAgentId },
            });
        }

        return NextResponse.json({ exotelAgentId }, { status: 201 });
    } catch (error: any) {
        console.error('[Exotel Create Account]', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create Exotel account' },
            { status: 500 }
        );
    }
}
