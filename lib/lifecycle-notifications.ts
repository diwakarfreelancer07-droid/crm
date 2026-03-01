/**
 * Lifecycle Notifications Service
 *
 * Sends in-app notifications, emails, and audit logs at every student lifecycle step:
 *   Step 1: Lead Converted → Student
 *   Step 2: Student → University Application Created
 *   Step 3: Application → Visa Process Started
 *   Step 4: Application / Visa → Deferred
 *   Step 5: Application / Visa → Enrolled
 *
 * Global rules enforced:
 *   - Only active users receive notifications (isActive: true)
 *   - Deduplication: won't create duplicate notifications within 10 min
 *   - Notification is persisted first, then email is sent (non-blocking)
 *   - Every dispatch writes an AuditLog with action NOTIFICATION_SENT
 */

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { buildLifecycleEmail } from "@/lib/email";
import { AuditLogService } from "@/lib/auditLog";
import type { NotificationType } from "@prisma/client";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface NotificationPayload {
    type: NotificationType;
    title: string;
    message: string;
    emailSubject: string;
    emailHtml: string;
    module: string;
    entityId: string;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Deduplicated notification sender.
 * Skips if the same user already has a notification with this (type, entityId)
 * created in the last 10 minutes to prevent duplicate events on rapid re-saves.
 */
async function dispatchToUsers(
    userIds: string[],
    payload: NotificationPayload,
    actorUserId: string
) {
    const uniqueIds = [...new Set(userIds.filter(Boolean))];
    if (uniqueIds.length === 0) return;

    // Fetch active users with email
    const users = await prisma.user.findMany({
        where: { id: { in: uniqueIds }, isActive: true },
        select: { id: true, email: true, name: true },
    });

    for (const user of users) {
        try {
            // ── Deduplication check ──────────────────────────────────────────
            const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
            const existing = await prisma.notification.findFirst({
                where: {
                    userId: user.id,
                    type: payload.type,
                    message: { contains: payload.entityId },
                    createdAt: { gte: tenMinAgo },
                },
            });
            if (existing) continue;

            // ── In-app Notification ──────────────────────────────────────────
            await prisma.notification.create({
                data: {
                    userId: user.id,
                    type: payload.type,
                    title: payload.title,
                    message: `${payload.message} [ref:${payload.entityId}]`,
                },
            });

            // ── Email (non-blocking, fire-and-forget) ────────────────────────
            sendEmail({
                to: user.email,
                subject: `[InterEd CRM] ${payload.emailSubject}`,
                html: payload.emailHtml,
            }).catch((err) =>
                console.error(`[Lifecycle] Email failed for ${user.email}:`, err)
            );

            // ── Audit Log ────────────────────────────────────────────────────
            await AuditLogService.log({
                userId: actorUserId,
                action: "CREATED",
                module: payload.module,
                entity: "Notification",
                entityId: payload.entityId,
                metadata: {
                    event: payload.type,
                    notifiedUserId: user.id,
                    notifiedEmail: user.email,
                },
            });
        } catch (err) {
            // Never fail the outer request because of a notification
            console.error(`[Lifecycle] Notification dispatch error for ${user.id}:`, err);
        }
    }
}

/**
 * Resolves the student's assigned agent and counselor (active only).
 * Returns userId strings for each, falling back to studentUserId for the student.
 */
async function resolveStudentRecipients(studentId: string): Promise<{
    agentId?: string;
    counselorId?: string;
    studentUserId?: string;
}> {
    const s = await prisma.student.findUnique({
        where: { id: studentId },
        select: { agentId: true, counselorId: true, studentUserId: true },
    });
    return {
        agentId: s?.agentId ?? undefined,
        counselorId: s?.counselorId ?? undefined,
        studentUserId: s?.studentUserId ?? undefined,
    };
}

// ─── STEP 1: Lead → Student ───────────────────────────────────────────────────

export async function notifyLeadConverted(
    leadId: string,
    studentId: string,
    actorUserId: string
) {
    try {
        // Fetch full data
        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            select: {
                name: true,
                assignments: {
                    select: { assignedTo: true },
                    orderBy: { assignedAt: "desc" },
                },
            },
        });
        const { agentId, counselorId } = await resolveStudentRecipients(studentId);

        if (!lead) return;

        // Collect recipients: latest assigned agent + counselor from student
        const assignedUserIds = lead.assignments.map((a) => a.assignedTo);
        const recipientIds = [
            ...assignedUserIds,
            agentId,
            counselorId,
        ].filter(Boolean) as string[];

        const message = `Lead ${lead.name} has been converted into a student.`;

        await dispatchToUsers(
            recipientIds,
            {
                type: "LEAD_CONVERTED",
                title: "Lead Converted to Student",
                message,
                emailSubject: "Lead Converted to Student",
                emailHtml: buildLifecycleEmail({
                    title: "Lead Converted to Student",
                    body: message,
                    details: [
                        { label: "Lead Name", value: lead.name },
                        { label: "Student ID", value: studentId },
                    ],
                    cta: { label: "View Student", url: `/admin/students/${studentId}` },
                }),
                module: "LEADS",
                entityId: leadId,
            },
            actorUserId
        );
    } catch (err) {
        console.error("[Lifecycle] notifyLeadConverted error:", err);
    }
}

// ─── STEP 2: Student → Application Created ────────────────────────────────────

export async function notifyApplicationCreated(
    applicationId: string,
    actorUserId: string
) {
    try {
        const app = await prisma.universityApplication.findUnique({
            where: { id: applicationId },
            include: {
                student: { select: { id: true, name: true, agentId: true, counselorId: true, studentUserId: true } },
                university: { select: { name: true } },
                course: { select: { name: true } },
            },
        });
        if (!app) return;

        const { agentId, counselorId, studentUserId } = app.student;
        const recipientIds = [agentId, counselorId, studentUserId,
            app.agentId, app.counselorId].filter(Boolean) as string[];

        const message = `An application has been created for ${app.student.name} at ${app.university.name}.`;

        await dispatchToUsers(
            recipientIds,
            {
                type: "SYSTEM",
                title: "Application Created",
                message,
                emailSubject: "University Application Created",
                emailHtml: buildLifecycleEmail({
                    title: "University Application Created",
                    body: message,
                    details: [
                        { label: "Student", value: app.student.name },
                        { label: "University", value: app.university.name },
                        { label: "Course", value: app.course?.name ?? app.courseName ?? "N/A" },
                        { label: "Intake", value: app.intake ?? "N/A" },
                    ],
                    cta: { label: "View Application", url: `/admin/applications/${applicationId}` },
                }),
                module: "APPLICATIONS",
                entityId: applicationId,
            },
            actorUserId
        );
    } catch (err) {
        console.error("[Lifecycle] notifyApplicationCreated error:", err);
    }
}

// ─── STEP 3: Application → Visa Started ──────────────────────────────────────

export async function notifyVisaStarted(
    visaApplicationId: string,
    actorUserId: string
) {
    try {
        const visa = await prisma.visaApplication.findUnique({
            where: { id: visaApplicationId },
            include: {
                student: { select: { id: true, name: true, agentId: true, counselorId: true, studentUserId: true } },
                country: { select: { name: true } },
            },
        });
        if (!visa) return;

        const { agentId, counselorId, studentUserId } = visa.student;
        const recipientIds = [agentId, counselorId, studentUserId,
            visa.agentId, visa.counselorId].filter(Boolean) as string[];

        const message = `Visa process has started for ${visa.student.name} in ${visa.country.name}.`;

        await dispatchToUsers(
            recipientIds,
            {
                type: "SYSTEM",
                title: "Visa Process Started",
                message,
                emailSubject: "Visa Process Initiated",
                emailHtml: buildLifecycleEmail({
                    title: "Visa Process Initiated",
                    body: message,
                    details: [
                        { label: "Student", value: visa.student.name },
                        { label: "Country", value: visa.country.name },
                        { label: "Visa Type", value: visa.visaType },
                        { label: "Intake", value: visa.intake ?? "N/A" },
                    ],
                    cta: { label: "View Visa Application", url: `/admin/visa-applications/${visaApplicationId}` },
                }),
                module: "VISA",
                entityId: visaApplicationId,
            },
            actorUserId
        );
    } catch (err) {
        console.error("[Lifecycle] notifyVisaStarted error:", err);
    }
}

// ─── STEP 4: Application → Deferred ──────────────────────────────────────────

export async function notifyApplicationDeferred(
    applicationId: string,
    actorUserId: string,
    deferReason?: string
) {
    try {
        const app = await prisma.universityApplication.findUnique({
            where: { id: applicationId },
            include: {
                student: { select: { id: true, name: true, agentId: true, counselorId: true, studentUserId: true } },
                university: { select: { name: true } },
            },
        });
        if (!app) return;

        const { agentId, counselorId, studentUserId } = app.student;
        const recipientIds = [agentId, counselorId, studentUserId,
            app.agentId, app.counselorId].filter(Boolean) as string[];

        const message = `The application for ${app.university.name} has been deferred.`;

        const details = [
            { label: "Student", value: app.student.name },
            { label: "University", value: app.university.name },
            { label: "Intake", value: app.intake ?? "N/A" },
        ];
        if (deferReason) details.push({ label: "Reason", value: deferReason });

        await dispatchToUsers(
            recipientIds,
            {
                type: "SYSTEM",
                title: "Application Deferred",
                message,
                emailSubject: "Application Deferred",
                emailHtml: buildLifecycleEmail({
                    title: "Application Deferred",
                    body: message,
                    details,
                    cta: { label: "View Application", url: `/admin/applications/${applicationId}` },
                }),
                module: "APPLICATIONS",
                entityId: applicationId,
            },
            actorUserId
        );
    } catch (err) {
        console.error("[Lifecycle] notifyApplicationDeferred error:", err);
    }
}

// ─── STEP 5: Application → Enrolled ──────────────────────────────────────────

export async function notifyEnrollmentConfirmed(
    applicationId: string,
    actorUserId: string
) {
    try {
        const app = await prisma.universityApplication.findUnique({
            where: { id: applicationId },
            include: {
                student: { select: { id: true, name: true, agentId: true, counselorId: true, studentUserId: true } },
                university: { select: { name: true } },
            },
        });
        if (!app) return;

        const { agentId, counselorId, studentUserId } = app.student;
        const recipientIds = [agentId, counselorId, studentUserId,
            app.agentId, app.counselorId].filter(Boolean) as string[];

        const message = `Congratulations! ${app.student.name} is enrolled at ${app.university.name}.`;

        await dispatchToUsers(
            recipientIds,
            {
                type: "SYSTEM",
                title: "Enrollment Confirmed",
                message,
                emailSubject: "Enrollment Confirmed 🎉",
                emailHtml: buildLifecycleEmail({
                    title: "Enrollment Confirmed 🎓",
                    body: message,
                    details: [
                        { label: "Student", value: app.student.name },
                        { label: "University", value: app.university.name },
                        { label: "Intake", value: app.intake ?? "N/A" },
                    ],
                    note: "The student has been officially enrolled. Please ensure onboarding steps are completed.",
                    cta: { label: "View Student Profile", url: `/admin/students/${app.studentId}` },
                }),
                module: "APPLICATIONS",
                entityId: applicationId,
            },
            actorUserId
        );
    } catch (err) {
        console.error("[Lifecycle] notifyEnrollmentConfirmed error:", err);
    }
}
