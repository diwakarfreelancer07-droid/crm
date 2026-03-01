import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogService } from "@/lib/auditLog";
import { VisaType, VisaStatus } from "@prisma/client";
import { withPermission } from "@/lib/permissions";

// GET /api/applications/[id] - Get university application details
export const GET = withPermission('APPLICATIONS', 'VIEW', async (req, { params, permission }) => {
    try {
        const { user: sessionUser } = permission;
        const session = { user: sessionUser };

        // Handle params safely (awaiting them as withPermission passes them as-is)
        const { id } = await params;

        console.log(`[API DEBUG] Fetching application ID: "${id}"`);

        if (!id || id === 'undefined' || id === '[id]') {
            console.error(`[API DEBUG] Invalid ID provided: ${id}`);
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        const application = await prisma.universityApplication.findUnique({
            where: { id },
            include: {
                student: {
                    include: {
                        lead: true,
                        user: { select: { name: true } }
                    }
                },
                country: true,
                university: true,
                course: true,
                assignedBy: { select: { id: true, name: true, role: true } },
                assignedTo: { select: { id: true, name: true, role: true } },
                applicationNotes: {
                    include: { user: { select: { name: true, role: true, imageUrl: true } } },
                    orderBy: { createdAt: 'desc' }
                }
            },
        });

        if (!application) {
            console.error(`[API DEBUG] Application not found in DB for ID: ${id}`);
            // Check if it might be a student ID accidentally passed
            const possibleStudent = await prisma.student.findUnique({ where: { id } });
            if (possibleStudent) {
                console.log(`[API DEBUG] ID ${id} belongs to a Student, not an Application.`);
                return NextResponse.json({
                    error: "This ID belongs to a student. Please use an application ID.",
                    isStudentId: true
                }, { status: 404 });
            }
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        const userRole = (session.user as any).role;
        const userId = (session.user as any).id;

        // RBAC
        if (userRole === 'STUDENT' && application.student.studentUserId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (userRole === 'AGENT') {
            const agent = await prisma.agentProfile.findUnique({ where: { userId } });
            const subordinates = agent ? await prisma.counselorProfile.findMany({ where: { agentId: agent.id }, select: { userId: true } }) : [];
            const allowedIds = [userId, ...subordinates.map(s => s.userId)];
            if (!allowedIds.includes(application.student.onboardedBy)) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        return NextResponse.json(application);
    } catch (error: any) {
        console.error("Error fetching university application details:", error);
        return NextResponse.json({ error: "Failed to fetch application", details: error.message }, { status: 500 });
    }
});

// PUT /api/applications/[id]
export const PUT = withPermission('APPLICATIONS', 'EDIT', async (req, { params, permission }) => {
    try {
        const { user: sessionUser } = permission;
        const session = { user: sessionUser };

        const { id } = await params;
        const body = await req.json();

        const {
            status, universityId, courseId, intake, countryId,
            deadlineDate, assignedToId, intendedCourse, applyLevel, notes
        } = body;

        const previousValues = await prisma.universityApplication.findUnique({ where: { id } });
        if (!previousValues) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        const updated = await prisma.universityApplication.update({
            where: { id },
            data: {
                ...(status && { status }),
                ...(universityId && { universityId }),
                ...(courseId && { courseId }),
                ...(countryId && { countryId }),
                ...(intake && { intake }),
                ...(applyLevel && { applyLevel }),
                ...(intendedCourse && { intendedCourse }),
                ...(deadlineDate && { deadlineDate: new Date(deadlineDate) }),
                ...(assignedToId && { assignedToId }),
                ...(notes && { notes }),
            },
            include: {
                student: { select: { id: true, name: true, leadId: true } },
                university: { select: { name: true } }
            }
        });

        await AuditLogService.log({
            userId: (session.user as any).id,
            action: "UPDATED",
            module: "APPLICATIONS",
            entity: "UniversityApplication",
            entityId: id,
            previousValues,
            newValues: updated
        });

        if (status && status !== previousValues.status) {
            if (updated.student.leadId) {
                await prisma.leadActivity.create({
                    data: {
                        leadId: updated.student.leadId,
                        userId: (session.user as any).id,
                        type: "STATUS_CHANGE",
                        content: `Application status for ${updated.university.name} updated from ${previousValues.status} to ${status}`,
                    }
                });
            }
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating university application:", error);
        return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
    }
});

// DELETE /api/applications/[id]
export const DELETE = withPermission('APPLICATIONS', 'DELETE', async (req, { params, permission }) => {
    try {
        const { user: sessionUser } = permission;
        const session = { user: sessionUser };

        const { id } = await params;
        const previousValues = await prisma.universityApplication.findUnique({ where: { id } });

        await prisma.universityApplication.delete({
            where: { id },
        });

        await AuditLogService.log({
            userId: (session.user as any).id,
            action: "DELETED",
            module: "APPLICATIONS",
            entity: "UniversityApplication",
            entityId: id,
            previousValues
        });

        return NextResponse.json({ message: "Application deleted successfully" });
    } catch (error) {
        console.error("Error deleting university application:", error);
        return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
    }
});
// POST /api/applications/[id]/ready-for-visa or /revert-from-visa
export const POST = withPermission('APPLICATIONS', 'EDIT', async (req, { params, permission }) => {
    try {
        const { user: sessionUser } = permission;
        const session = { user: sessionUser };

        const { id } = await params;
        const pathname = (req as NextRequest).nextUrl.pathname;

        const application = await prisma.universityApplication.findUnique({
            where: { id },
            include: { student: true }
        });

        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        // Action: READY_FOR_VISA
        if (pathname.endsWith('/ready-for-visa')) {
            if (application.status === "READY_FOR_VISA") {
                return NextResponse.json({ error: "Application is already in Visa stage" }, { status: 400 });
            }

            let body = {};
            try { body = await req.json(); } catch (e) { /* ignore empty body */ }
            const { agentId, counselorId, appointmentDate } = body as any;

            const updatedVisaApp = await prisma.$transaction(async (tx) => {
                // Update application status and assignments
                await tx.universityApplication.update({
                    where: { id },
                    data: {
                        status: "READY_FOR_VISA",
                        agentId: agentId || null,
                        counselorId: counselorId || null
                    }
                });

                // Update student record
                await tx.student.update({
                    where: { id: application.studentId },
                    data: {
                        agentId: agentId || null,
                        counselorId: counselorId || null
                    }
                });

                // Create visa application
                return await tx.visaApplication.create({
                    data: {
                        studentId: application.studentId,
                        universityApplicationId: application.id,
                        countryId: application.countryId,
                        universityId: application.universityId,
                        courseId: application.courseId,
                        intake: application.intake,
                        visaType: VisaType.STUDENT_VISA,
                        status: VisaStatus.PENDING,
                        applicationDate: new Date(),
                        appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
                        assignedOfficerId: agentId || null,
                        agentId: agentId || null,
                        counselorId: counselorId || null,
                    }
                });
            });

            // Log Activity
            await prisma.leadActivity.create({
                data: {
                    leadId: application.student.leadId || "",
                    userId: (session.user as any).id,
                    type: "STATUS_CHANGE",
                    content: `Application for ${application.universityId || 'institution'} moved to Visa stage.`,
                }
            });

            return NextResponse.json(updatedVisaApp);
        }

        // Action: REVERT_FROM_VISA
        if (pathname.endsWith('/revert-from-visa')) {
            // Update University Application back to READY_FOR_VISA (or should it be UNDER_REVIEW?)
            // Based on earlier code, it reverts to READY_FOR_VISA? 
            // Wait, the earlier code set status: "READY_FOR_VISA" in revert-from-visa too.
            // Actually, if we are reverting FROM visa, maybe it should go back to a pre-visa state?
            // Let's stick to the previous implementation for now to be safe.
            const updatedApp = await prisma.universityApplication.update({
                where: { id },
                data: { status: "UNDER_REVIEW" } // Usually it should go back to under review
            });

            // Find and update the linked Visa Application
            const visaApp = await prisma.visaApplication.findFirst({
                where: { universityApplicationId: id }
            });

            if (visaApp) {
                await prisma.visaApplication.update({
                    where: { id: visaApp.id },
                    data: { status: "WITHDRAWN" as any } // Mark it as withdrawn instead of just updating
                });
            }

            await AuditLogService.log({
                userId: (session.user as any).id,
                action: "UPDATED",
                module: "APPLICATIONS",
                entity: "UniversityApplication",
                entityId: id,
                previousValues: application,
                newValues: updatedApp,
                metadata: { action: "REVERT_FROM_VISA" }
            });

            return NextResponse.json({ message: "Reverted successfully", application: updatedApp });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        console.error("Action error:", error);
        return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
    }
});
