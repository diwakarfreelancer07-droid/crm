import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { emitToUser } from '@/lib/socket-io';

// ─── Constants ───────────────────────────────────────────────────────────────

const TERMINAL_STATUSES = new Set(['completed', 'no-answer', 'busy', 'failed']);
const MISSED_STATUSES = new Set(['no-answer', 'busy', 'failed']);
const RINGING_STATUSES = new Set(['ringing', 'initiated', 'queued']);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Normalize any phone string to E.164 (assumes India +91). */
function toE164(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
    if (digits.startsWith('0') && digits.length === 11) return `+91${digits.slice(1)}`;
    if (digits.length === 10) return `+91${digits}`;
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

/**
 * Find the employee User whose AgentProfile or CounselorProfile phone matches.
 * Also checks EmployeeProfile for completeness.
 */
async function findEmployeeByPhone(phone: string) {
    const variants = [phone, phone.replace('+91', ''), phone.slice(-10)];

    // Try AgentProfile first
    const agentProfile = await prisma.agentProfile.findFirst({
        where: { phone: { in: variants } },
        include: { user: { select: { id: true, name: true } } },
    });
    if (agentProfile) return agentProfile.user;

    // Try CounselorProfile
    const counselorProfile = await prisma.counselorProfile.findFirst({
        where: { phone: { in: variants } },
        include: { user: { select: { id: true, name: true } } },
    });
    if (counselorProfile) return counselorProfile.user;

    // Fallback to EmployeeProfile
    const employeeProfile = await prisma.employeeProfile.findFirst({
        where: { phone: { in: variants } },
        include: { user: { select: { id: true, name: true } } },
    });
    return employeeProfile?.user ?? null;
}

// ─── Scenario Handlers ────────────────────────────────────────────────────────

async function handleIncomingCall(params: Record<string, string>) {
    const { CallSid, From, To, Status, Direction } = params;

    const callerPhone = toE164(From || '');
    const employeePhone = toE164(To || '');

    const [employee, { lead, student }] = await Promise.all([
        findEmployeeByPhone(employeePhone),
        findContact(callerPhone),
    ]);

    const employeeId = employee?.id ?? null;
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

    // Emit real-time notification to the agent/counselor
    if (employeeId) {
        emitToUser(employeeId, 'call:incoming', {
            callSid: CallSid,
            callerPhone: toE164(From || ''),
            callerName: lead?.name || student?.name || null,
            leadId,
            studentId,
            direction: (Direction || 'inbound').toLowerCase(),
        });
    }
}

async function handleCallConnected(params: Record<string, string>) {
    const { CallSid, From, To, Direction } = params;

    const direction = (Direction || 'outbound').toLowerCase();
    const employeePhone = direction === 'outbound' ? toE164(From || '') : toE164(To || '');
    const employee = await findEmployeeByPhone(employeePhone);
    const employeeId = employee?.id ?? null;

    await prisma.callLog.upsert({
        where: { exotelCallSid: CallSid },
        create: {
            exotelCallSid: CallSid,
            callerId: toE164(From || ''),
            toNumber: toE164(To || ''),
            direction,
            status: 'in-progress',
            employeeId,
        },
        update: { status: 'in-progress' },
    });

    if (employeeId) {
        emitToUser(employeeId, 'call:connected', {
            callSid: CallSid,
            direction,
        });
    }
}

async function handleCompletedCall(params: Record<string, string>) {
    const {
        CallSid, From, To, Direction,
        DialCallDuration, StartTime, EndTime, RecordingUrl,
    } = params;

    const direction = (Direction || 'outbound').toLowerCase();
    const employeePhone = direction === 'outbound' ? toE164(From || '') : toE164(To || '');
    const customerPhone = direction === 'outbound' ? toE164(To || '') : toE164(From || '');
    const duration = DialCallDuration ? parseInt(DialCallDuration, 10) : null;

    const [employee, { lead, student }] = await Promise.all([
        findEmployeeByPhone(employeePhone),
        findContact(customerPhone),
    ]);

    const employeeId = employee?.id ?? null;
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

    // Emit call:ended to the agent/counselor
    if (employeeId) {
        emitToUser(employeeId, 'call:ended', {
            callSid: CallSid,
            status: 'completed',
            duration,
            recordingUrl: RecordingUrl || null,
            leadId,
            studentId,
            leadName: lead?.name || null,
        });
    }
}

async function handleMissedCall(params: Record<string, string>) {
    const { CallSid, From, To, Direction, Status, StartTime, EndTime } = params;

    const direction = (Direction || 'outbound').toLowerCase();
    const status = (Status || 'no-answer').toLowerCase();
    const employeePhone = direction === 'outbound' ? toE164(From || '') : toE164(To || '');
    const customerPhone = direction === 'outbound' ? toE164(To || '') : toE164(From || '');

    const [employee, { lead, student }] = await Promise.all([
        findEmployeeByPhone(employeePhone),
        findContact(customerPhone),
    ]);

    const employeeId = employee?.id ?? null;
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
                    meta: { callSid: CallSid, direction, status, missed: true },
                },
            });

            await prisma.callLog.update({
                where: { id: callLog.id },
                data: { leadActivityId: activity.id },
            });
        }
    }

    // Emit call:ended (missed)
    if (employeeId) {
        emitToUser(employeeId, 'call:ended', {
            callSid: CallSid,
            status,
            missed: true,
            leadId,
            studentId,
        });
    }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

function normaliseParams(raw: Record<string, string>): Record<string, string> {
    const p = { ...raw };
    if (!p.From && p.CallFrom) p.From = p.CallFrom;
    if (!p.To && p.CallTo) p.To = p.CallTo;
    if (!p.Status && p.CallType) {
        p.Status = p.CallType === 'incomplete' ? 'no-answer'
            : p.CallType === 'completed' ? 'completed'
                : p.CallType;
    }
    if (!p.Status && p.DialCallStatus) p.Status = p.DialCallStatus;
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
    } else if (status === 'in-progress' || status === 'answered') {
        await handleCallConnected(params);
    } else if (RINGING_STATUSES.has(status)) {
        if (direction === 'incoming' || direction === 'inbound' || RINGING_STATUSES.has(status)) {
            await handleIncomingCall(params);
        }
    }
}

function checkSecret(req: NextRequest): boolean {
    const secret = req.nextUrl.searchParams.get('secret');
    const webhookSecret = process.env.EXOTEL_WEBHOOK_SECRET;
    return !webhookSecret || secret === webhookSecret;
}

// ── GET ──
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

// ── POST ──
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
