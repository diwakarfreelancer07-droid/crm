import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { employeeId, targetType, targetId } = await req.json();

        if (!employeeId || !targetType || !targetId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // --- Fetch employee phone ---
        const employeeProfile = await prisma.employeeProfile.findUnique({
            where: { userId: employeeId },
            select: { phone: true },
        });

        if (!employeeProfile?.phone) {
            return NextResponse.json({ error: 'Employee phone not configured' }, { status: 404 });
        }

        // --- Fetch target phone ---
        let targetPhone: string | null = null;

        if (targetType === 'lead') {
            const lead = await prisma.lead.findUnique({
                where: { id: targetId },
                select: { phone: true },
            });
            targetPhone = lead?.phone ?? null;
        } else if (targetType === 'student') {
            const student = await prisma.student.findUnique({
                where: { id: targetId },
                select: { phone: true },
            });
            targetPhone = student?.phone ?? null;
        }

        if (!targetPhone) {
            return NextResponse.json({ error: 'Target phone not found' }, { status: 404 });
        }

        // --- Exotel config ---
        const apiKey = process.env.EXOTEL_API_KEY;
        const apiToken = process.env.EXOTEL_API_TOKEN;
        const sid = process.env.EXOTEL_SID;
        const virtualNumber = process.env.EXOTEL_VIRTUAL_NUMBER;
        const webhookBase = process.env.NEXT_PUBLIC_APP_URL || '';
        const webhookSecret = process.env.EXOTEL_WEBHOOK_SECRET;

        if (!apiKey || !apiToken || !sid || !virtualNumber) {
            return NextResponse.json({ error: 'Exotel not configured' }, { status: 500 });
        }

        const statusCallback = webhookSecret
            ? `${webhookBase}/api/exotel/webhook?secret=${webhookSecret}`
            : `${webhookBase}/api/exotel/webhook`;

        // --- Call Exotel Connect API ---
        const exotelUrl = `https://api.exotel.com/v1/Accounts/${sid}/Calls/connect.json`;

        const body = new URLSearchParams({
            From: employeeProfile.phone,
            To: targetPhone,
            CallerId: virtualNumber,
            StatusCallback: statusCallback,
        });

        const credentials = Buffer.from(`${apiKey}:${apiToken}`).toString('base64');

        const exotelRes = await fetch(exotelUrl, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        });

        if (!exotelRes.ok) {
            const errText = await exotelRes.text();
            console.error('[Exotel Click-to-Call] Exotel error:', errText);
            return NextResponse.json({ error: 'Exotel API error', detail: errText }, { status: 502 });
        }

        const exotelData: any = await exotelRes.json();
        const callSid = exotelData?.Call?.Sid ?? exotelData?.Sid ?? null;

        return NextResponse.json({ callSid }, { status: 200 });
    } catch (error) {
        console.error('[Exotel Click-to-Call] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
