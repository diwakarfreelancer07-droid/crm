import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogService } from "@/lib/auditLog";

// GET /api/applications/[id] - Get university application details
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Handle params safely for both Next.js 14 and 15
        const params = await context.params;
        const { id } = params;

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
}

// PUT /api/applications/[id]
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const params = await context.params;
        const { id } = params;
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
}

// DELETE /api/applications/[id]
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userRole = (session.user as any).role;
        if (!["ADMIN", "MANAGER"].includes(userRole)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const params = await context.params;
        const { id } = params;
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
}
