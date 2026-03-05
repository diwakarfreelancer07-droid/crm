/**
 * POST /api/exotel/call
 * Initiates an outbound Exotel click-to-call.
 * Uses the caller's exotelAgentId (or phone) as From.
 * Creates an initial CallLog entry immediately.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { makeOutboundCall } from '@/lib/exotel';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id as string;
        const role = session.user.role as string;

        const { targetType, targetId, targetPhone: manualPhone } = await req.json();

        // 1. Resolve caller phone from profile
        let callerPhone: string | null = null;

        if (role === 'AGENT') {
            const p = await prisma.agentProfile.findUnique({ where: { userId }, select: { phone: true } });
            callerPhone = p?.phone ?? null;
        } else if (role === 'COUNSELOR') {
            const p = await prisma.counselorProfile.findUnique({ where: { userId }, select: { phone: true } });
            callerPhone = p?.phone ?? null;
        } else if (role === 'ADMIN') {
            const p = await prisma.employeeProfile.findUnique({ where: { userId }, select: { phone: true } });
            callerPhone = p?.phone ?? null;
        }

        if (!callerPhone) {
            return NextResponse.json(
                { error: 'Caller phone not configured on your profile.' },
                { status: 400 }
            );
        }

        // 2. Resolve target phone
        let targetPhone: string | null = manualPhone ?? null;
        let leadId: string | null = null;
        let studentId: string | null = null;

        if (!targetPhone && targetId && targetType) {
            if (targetType === 'lead') {
                const lead = await prisma.lead.findUnique({ where: { id: targetId }, select: { phone: true } });
                targetPhone = lead?.phone ?? null;
                leadId = targetId;
            } else if (targetType === 'student') {
                const student = await prisma.student.findUnique({ where: { id: targetId }, select: { phone: true } });
                targetPhone = student?.phone ?? null;
                studentId = targetId;
            }
        }

        if (!targetPhone) {
            return NextResponse.json({ error: 'Target phone number not found.' }, { status: 400 });
        }

        // 3. Check Exotel config
        if (!process.env.EXOTEL_SID || !process.env.EXOTEL_API_KEY) {
            return NextResponse.json({ error: 'Exotel not configured on the server.' }, { status: 500 });
        }

        const webhookBase = process.env.NEXT_PUBLIC_APP_URL || '';
        const secret = process.env.EXOTEL_WEBHOOK_SECRET;
        const statusCallbackUrl = secret
            ? `${webhookBase}/api/exotel/webhook?secret=${secret}`
            : `${webhookBase}/api/exotel/webhook`;

        // 4. Initiate the call
        const { callSid } = await makeOutboundCall({
            from: callerPhone,
            to: targetPhone,
            statusCallbackUrl,
        });

        // 5. Create initial CallLog
        await prisma.callLog.create({
            data: {
                exotelCallSid: callSid,
                callerId: callerPhone,
                toNumber: targetPhone,
                direction: 'outbound',
                status: 'ringing',
                employeeId: userId,
                leadId,
                studentId,
            },
        });

        return NextResponse.json({ callSid }, { status: 200 });
    } catch (error: any) {
        console.error('[Exotel Call]', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
