import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ─── Constants ───────────────────────────────────────────────────────────────

const TERMINAL_STATUSES = new Set(['completed', 'no-answer', 'busy', 'failed']);
const MISSED_STATUSES = new Set(['no-answer', 'busy', 'failed']);
const RINGING_STATUSES = new Set(['ringing', 'initiated', 'queued']);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Normalize any phone string to E.164 (assumes India +91). */
function toE164(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;        // 917867010056  → +917867010056
    if (digits.startsWith('0') && digits.length === 11) return `+91${digits.slice(1)}`; // 07867010056 → +917867010056
    if (digits.length === 10) return `+91${digits}`;       // 7867010056    → +917867010056
    return `+${digits}`;
}

/** Format seconds as "Xm Ys". */
function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

/** Find a lead or student that matches any variant of a phone number. */
async function findContact(phone: string) {
    const variants = [phone, phone.replace('+91', ''), phone.slice(-10)];
    const [lead, student] = await Promise.all([
        prisma.lead.findFirst({
            where: { phone: { in: variants } },
            select: { id: true, name: true },
        }),
        prisma.student.findFirst({
            where: { phone: { in: variants } },
            select: { id: true, name: true },
        }),
    ]);
    return { lead, student };
}

/** Find the employee User whose EmployeeProfile.phone matches a number. */
async function findEmployee(phone: string) {
    const variants = [phone, phone.replace('+91', ''), phone.slice(-10)];
    return prisma.employeeProfile.findFirst({
        where: { phone: { in: variants } },
        include: { user: { select: { id: true, name: true } } },
    });
}

// ─── Scenario Handlers ────────────────────────────────────────────────────────

/**
 * INCOMING CALL
 * Fired when Exotel starts ringing (Status = ringing / initiated / queued / in-progress).
 * We create/update the CallLog immediately so the CRM knows a call is happening.
 */
async function handleIncomingCall(params: Record<string, string>) {
    const { CallSid, From, To, Status, Direction } = params;

    // For inbound: caller = From, employee's number = To
    const callerPhone = toE164(From || '');
    const employeePhone = toE164(To || '');

    const [employeeProfile, { lead, student }] = await Promise.all([
        findEmployee(employeePhone),
        findContact(callerPhone),
    ]);

    const employeeId = employeeProfile?.user?.id ?? null;
    const leadId = lead?.id ?? null;
    const studentId = student?.id ?? null;

    await prisma.callLog.upsert({
        where: { exotelCallSid: CallSid },
        create: {
            exotelCallSid: CallSid,
            callerId: toE164(From || ''),
            toNumber: toE164(To || ''),
            direction: (Direction || 'inbound').toLowerCase(),
            status: (Status || 'ringing').toLowerCase(),
            employeeId,
            leadId,
            studentId,
        },
        update: {
            status: (Status || 'ringing').toLowerCase(),
        },
    });
}

/**
 * COMPLETED CALL
 * Fired when Status = "completed" (someone answered and the call ended normally).
 * Updates CallLog with duration + recording, then creates a LeadActivity.
 */
async function handleCompletedCall(params: Record<string, string>) {
    const {
        CallSid, From, To, Direction,
        DialCallDuration, StartTime, EndTime, RecordingUrl,
    } = params;

    const direction = (Direction || 'outbound').toLowerCase();
    const employeePhone = direction === 'outbound' ? toE164(From || '') : toE164(To || '');
    const customerPhone = direction === 'outbound' ? toE164(To || '') : toE164(From || '');
    const duration = DialCallDuration ? parseInt(DialCallDuration, 10) : null;

    const [employeeProfile, { lead, student }] = await Promise.all([
        findEmployee(employeePhone),
        findContact(customerPhone),
    ]);

    const employeeId = employeeProfile?.user?.id ?? null;
    const leadId = lead?.id ?? null;
    const studentId = student?.id ?? null;

    // Check if we already created a LeadActivity for this call
    const existing = await prisma.callLog.findUnique({
        where: { exotelCallSid: CallSid },
        select: { id: true, leadActivityId: true },
    });

    const callLog = await prisma.callLog.upsert({
        where: { exotelCallSid: CallSid },
        create: {
            exotelCallSid: CallSid,
            callerId: toE164(From || ''),
            toNumber: toE164(To || ''),
            direction,
            status: 'completed',
            duration: isNaN(duration as number) ? null : duration,
            recordingUrl: RecordingUrl || null,
            startedAt: StartTime ? new Date(StartTime) : null,
            endedAt: EndTime ? new Date(EndTime) : null,
            employeeId,
            leadId,
            studentId,
        },
        update: {
            status: 'completed',
            duration: isNaN(duration as number) ? undefined : duration ?? undefined,
            recordingUrl: RecordingUrl || undefined,
            endedAt: EndTime ? new Date(EndTime) : undefined,
        },
    });

    // Create LeadActivity only once (for leads)
    if (leadId && !existing?.leadActivityId) {
        const contactName = lead?.name ?? 'Unknown';
        const durationStr = duration ? formatDuration(duration) : 'N/A';
        const directionStr = direction === 'inbound' ? 'Inbound' : 'Outbound';
        const content = `${directionStr} call with ${contactName} — ${durationStr} — Completed`;

        let activityUserId = employeeId;
        if (!activityUserId) {
            const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
            activityUserId = admin?.id ?? null;
        }

        if (activityUserId) {
            const activity = await prisma.leadActivity.create({
                data: {
                    leadId,
                    userId: activityUserId,
                    type: 'CALL',
                    content,
                    meta: {
                        callSid: CallSid,
                        duration,
                        recordingUrl: RecordingUrl || null,
                        direction,
                        status: 'completed',
                    },
                },
            });

            await prisma.callLog.update({
                where: { id: callLog.id },
                data: { leadActivityId: activity.id },
            });
        }
    }
}

/**
 * MISSED CALL
 * Fired when Status = "no-answer" | "busy" | "failed".
 * Updates CallLog and creates a "Missed Call" LeadActivity.
 */
async function handleMissedCall(params: Record<string, string>) {
    const { CallSid, From, To, Direction, Status, StartTime, EndTime } = params;

    const direction = (Direction || 'outbound').toLowerCase();
    const status = (Status || 'no-answer').toLowerCase();
    const employeePhone = direction === 'outbound' ? toE164(From || '') : toE164(To || '');
    const customerPhone = direction === 'outbound' ? toE164(To || '') : toE164(From || '');

    const [employeeProfile, { lead, student }] = await Promise.all([
        findEmployee(employeePhone),
        findContact(customerPhone),
    ]);

    const employeeId = employeeProfile?.user?.id ?? null;
    const leadId = lead?.id ?? null;
    const studentId = student?.id ?? null;

    const existing = await prisma.callLog.findUnique({
        where: { exotelCallSid: CallSid },
        select: { id: true, leadActivityId: true },
    });

    const callLog = await prisma.callLog.upsert({
        where: { exotelCallSid: CallSid },
        create: {
            exotelCallSid: CallSid,
            callerId: toE164(From || ''),
            toNumber: toE164(To || ''),
            direction,
            status,
            startedAt: StartTime ? new Date(StartTime) : null,
            endedAt: EndTime ? new Date(EndTime) : null,
            employeeId,
            leadId,
            studentId,
        },
        update: {
            status,
            endedAt: EndTime ? new Date(EndTime) : undefined,
        },
    });

    // Create LeadActivity only once
    if (leadId && !existing?.leadActivityId) {
        const contactName = lead?.name ?? 'Unknown';
        const directionLabel = direction === 'inbound' ? 'Incoming' : 'Outgoing';
        const statusLabel = status === 'no-answer' ? 'No Answer'
            : status === 'busy' ? 'Busy'
                : 'Failed';
        const content = `${directionLabel} missed call with ${contactName} — ${statusLabel}`;

        let activityUserId = employeeId;
        if (!activityUserId) {
            const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
            activityUserId = admin?.id ?? null;
        }

        if (activityUserId) {
            const activity = await prisma.leadActivity.create({
                data: {
                    leadId,
                    userId: activityUserId,
                    type: 'CALL',
                    content,
                    meta: {
                        callSid: CallSid,
                        direction,
                        status,
                        missed: true,
                    },
                },
            });

            await prisma.callLog.update({
                where: { id: callLog.id },
                data: { leadActivityId: activity.id },
            });
        }
    }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

/**
 * Normalise Exotel's param field names.
 * Exotel uses CallFrom/CallTo in some flows and From/To in others.
 */
function normaliseParams(raw: Record<string, string>): Record<string, string> {
    const p = { ...raw };
    // Unify phone fields
    if (!p.From && p.CallFrom) p.From = p.CallFrom;
    if (!p.To && p.CallTo) p.To = p.CallTo;
    // Unify status fields
    // CallType=incomplete means the call was not answered (missed)
    if (!p.Status && p.CallType) {
        p.Status = p.CallType === 'incomplete' ? 'no-answer'
            : p.CallType === 'completed' ? 'completed'
                : p.CallType;
    }
    if (!p.Status && p.DialCallStatus) p.Status = p.DialCallStatus;
    // Direction
    if (!p.Direction) p.Direction = 'incoming';
    return p;
}

async function processWebhook(raw: Record<string, string>) {
    const params = normaliseParams(raw);
    const status = (params.Status || '').toLowerCase();
    const direction = (params.Direction || '').toLowerCase();

    if (!params.CallSid) return;

    if (TERMINAL_STATUSES.has(status)) {
        if (MISSED_STATUSES.has(status)) {
            await handleMissedCall(params);
        } else {
            await handleCompletedCall(params);
        }
    } else if (RINGING_STATUSES.has(status) || status === 'in-progress') {
        if (direction === 'incoming' || direction === 'inbound' || RINGING_STATUSES.has(status)) {
            await handleIncomingCall(params);
        }
    }
    // "incomplete" already mapped to "no-answer" above; other unknowns ignored safely
}

function checkSecret(req: NextRequest): boolean {
    const secret = req.nextUrl.searchParams.get('secret');
    const webhookSecret = process.env.EXOTEL_WEBHOOK_SECRET;
    return !webhookSecret || secret === webhookSecret;
}

// ── GET ── (Exotel StatusCallback / Passthru sends GET with query params)
export async function GET(req: NextRequest) {
    try {
        if (!checkSecret(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params: Record<string, string> = {};
        req.nextUrl.searchParams.forEach((v, k) => { params[k] = v; });

        await processWebhook(params);
        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
        console.error('[Exotel Webhook GET] Error:', error);
        return NextResponse.json({ ok: true }, { status: 200 });
    }
}

// ── POST ── (Exotel Connect API / some flow nodes send POST form-urlencoded)
export async function POST(req: NextRequest) {
    try {
        if (!checkSecret(req)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params: Record<string, string> = {};
        const contentType = req.headers.get('content-type') || '';

        if (contentType.includes('application/x-www-form-urlencoded')) {
            const text = await req.text();
            new URLSearchParams(text).forEach((v, k) => { params[k] = v; });
        } else {
            // Also check query params (some Exotel POSTs include params in the URL)
            req.nextUrl.searchParams.forEach((v, k) => { params[k] = v; });
            try { Object.assign(params, await req.json()); } catch { /* ignore */ }
        }

        await processWebhook(params);
        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
        console.error('[Exotel Webhook POST] Error:', error);
        return NextResponse.json({ ok: true }, { status: 200 });
    }
}
