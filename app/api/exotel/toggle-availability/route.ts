/**
 * POST /api/exotel/toggle-availability
 * Allows an agent or counselor to toggle their Exotel availability (online/offline).
 * Updates the tel device's `available` flag in Exotel and saves to DB.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { setExotelAvailability } from '@/lib/exotel';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = session.user.role as string;
        const userId = session.user.id as string;

        if (role !== 'AGENT' && role !== 'COUNSELOR') {
            return NextResponse.json({ error: 'Only AGENT or COUNSELOR can toggle availability' }, { status: 403 });
        }

        const { available } = await req.json();
        if (typeof available !== 'boolean') {
            return NextResponse.json({ error: '`available` (boolean) is required' }, { status: 400 });
        }

        // Get the exotelAgentId from the right profile
        let exotelAgentId: string | null = null;

        if (role === 'AGENT') {
            const profile = await prisma.agentProfile.findUnique({
                where: { userId },
                select: { exotelAgentId: true },
            });
            exotelAgentId = profile?.exotelAgentId ?? null;
        } else {
            const profile = await prisma.counselorProfile.findUnique({
                where: { userId },
                select: { exotelAgentId: true },
            });
            exotelAgentId = profile?.exotelAgentId ?? null;
        }

        if (!exotelAgentId) {
            return NextResponse.json(
                { error: 'No Exotel account linked. Ask an admin to create one first.' },
                { status: 400 }
            );
        }

        // Call Exotel API to update availability
        await setExotelAvailability(exotelAgentId, available);

        // Persist in DB
        if (role === 'AGENT') {
            await prisma.agentProfile.update({
                where: { userId },
                data: { exotelAvailable: available },
            });
        } else {
            await prisma.counselorProfile.update({
                where: { userId },
                data: { exotelAvailable: available },
            });
        }

        return NextResponse.json({ available });
    } catch (error: any) {
        console.error('[Exotel Toggle Availability]', error);
        return NextResponse.json(
            { error: error.message || 'Failed to toggle availability' },
            { status: 500 }
        );
    }
}
