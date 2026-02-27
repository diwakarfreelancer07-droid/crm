import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogService } from "@/lib/auditLog";

// GET /api/applications - List university applications
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);

        // Pagination
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        // Filters
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status");
        const countryId = searchParams.get("countryId");
        const assignedToId = searchParams.get("assignedToId");
        const assignedById = searchParams.get("assignedById");
        const intake = searchParams.get("intake");
        const applyLevel = searchParams.get("applyLevel");
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");
        const studentIdString = searchParams.get("studentId");

        const userRole = session.user.role;
        const userId = session.user.id;

        // If studentId is provided, returns all applications for that specific student
        if (studentIdString) {
            const applications = await prisma.universityApplication.findMany({
                where: { studentId: studentIdString },
                include: {
                    student: {
                        select: {
                            id: true, name: true, email: true, phone: true, imageUrl: true, status: true, passportNo: true,
                        }
                    },
                    country: { select: { id: true, name: true } },
                    university: { select: { id: true, name: true } },
                    course: { select: { id: true, name: true } },
                    assignedBy: { select: { id: true, name: true, role: true } },
                    assignedTo: { select: { id: true, name: true, role: true } },
                    _count: {
                        select: { applicationNotes: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            return NextResponse.json({ applications });
        }

        // --- Grouped By Student View ---

        const appWhere: Record<string, any> = {};
        if (status) {
            appWhere.status = status;
        } else {
            // By default, hide applications that have been moved to the visa stage
            appWhere.status = { not: "READY_FOR_VISA" };
        }
        if (countryId) appWhere.countryId = countryId;
        if (assignedToId) appWhere.assignedToId = assignedToId;
        if (assignedById) appWhere.assignedById = assignedById;
        if (intake) appWhere.intake = { contains: intake, mode: "insensitive" };
        if (applyLevel) appWhere.applyLevel = applyLevel;

        if (dateFrom || dateTo) {
            appWhere.createdAt = {
                ...(dateFrom && { gte: new Date(dateFrom) }),
                ...(dateTo && { lte: new Date(dateTo) }),
            };
        }

        // RBAC Logic for applications
        if (userRole === 'COUNSELOR') {
            appWhere.OR = [
                { assignedToId: userId },
                { student: { onboardedBy: userId } }
            ];
        } else if (['SUPPORT_AGENT', 'SALES_REP'].includes(userRole)) {
            appWhere.assignedToId = userId;
        }

        // Base where clause for STUDENTS
        const studentWhere: Record<string, any> = {
            applications: {
                some: appWhere
            }
        };

        if (search) {
            studentWhere.AND = [
                {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } },
                        { phone: { contains: search, mode: "insensitive" } },
                        { passportNo: { contains: search, mode: "insensitive" } },
                        {
                            applications: {
                                some: {
                                    OR: [
                                        { university: { name: { contains: search, mode: "insensitive" } } },
                                        { intendedCourse: { contains: search, mode: "insensitive" } },
                                    ]
                                }
                            }
                        }
                    ]
                }
            ];
        }

        if (userRole === 'STUDENT') {
            studentWhere.studentUserId = userId;
        } else if (userRole === 'AGENT') {
            const agent = await prisma.agentProfile.findUnique({
                where: { userId },
                select: { id: true }
            });
            const secondaryIds = [userId];
            if (agent) {
                const counselors = await prisma.counselorProfile.findMany({
                    where: { agentId: agent.id },
                    select: { userId: true }
                });
                secondaryIds.push(...counselors.map(c => c.userId));
            }
            studentWhere.onboardedBy = { in: secondaryIds };
        }

        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where: studentWhere,
                include: {
                    applications: {
                        where: appWhere,
                        include: {
                            country: { select: { id: true, name: true } },
                            university: { select: { id: true, name: true } },
                            course: { select: { id: true, name: true } },
                            assignedBy: { select: { id: true, name: true, role: true } },
                            assignedTo: { select: { id: true, name: true, role: true } },
                            _count: { select: { applicationNotes: true } }
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    },
                    _count: {
                        select: { applications: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.student.count({ where: studentWhere }),
        ]);

        const mappedApplications = students.map(student => {
            const latestApp = student.applications[0];
            if (!latestApp) return null;

            const { _count, ...appDetails } = latestApp;

            return {
                ...appDetails,
                student: {
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    phone: student.phone,
                    imageUrl: student.imageUrl,
                    status: student.status,
                    passportNo: student.passportNo,
                    _count: {
                        applications: student._count.applications
                    }
                },
                _count: {
                    notes: _count?.applicationNotes || 0
                }
            };
        }).filter(Boolean);

        return NextResponse.json({
            applications: mappedApplications,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching applications:", error);
        return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
    }
}

// POST /api/applications 
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: (session.user as any).id }
        });

        if (!currentUser) {
            return NextResponse.json({
                error: "Your session is invalid (likely due to a database reset). Please log out and log back in."
            }, { status: 403 });
        }

        if (!["ADMIN", "MANAGER", "COUNSELOR", "AGENT"].includes(session.user.role)) {
            return NextResponse.json({ error: "Permission denied" }, { status: 403 });
        }

        const body = await req.json();
        const { studentId, applications } = body;

        if (!studentId || !applications || !Array.isArray(applications) || applications.length === 0) {
            return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
        }

        if (session.user.role === 'AGENT') {
            const student = await prisma.student.findUnique({
                where: { id: studentId },
                select: { onboardedBy: true }
            });
            if (!student || student.onboardedBy !== (session.user as any).id) {
                return NextResponse.json({ error: "Unauthorized access to student" }, { status: 403 });
            }
        }

        const createdApplications = await prisma.$transaction(async (tx) => {
            const results = [];
            for (const appData of applications) {
                const app = await tx.universityApplication.create({
                    data: {
                        studentId,
                        countryId: appData.countryId,
                        universityId: appData.universityId,
                        courseId: appData.courseId || null,
                        courseName: appData.courseName || null,
                        intake: appData.intake || null,
                        intendedCourse: appData.intendedCourse || null,
                        applyLevel: appData.applyLevel || null,
                        deadlineDate: appData.deadlineDate ? new Date(appData.deadlineDate) : null,
                        associateId: appData.associateId || null,
                        status: "PENDING"
                    },
                    include: {
                        student: { select: { name: true, leadId: true } },
                        university: { select: { name: true } }
                    }
                });

                await AuditLogService.log({
                    userId: (session.user as any).id,
                    action: "CREATED",
                    module: "APPLICATIONS",
                    entity: "UniversityApplication",
                    entityId: app.id,
                    newValues: app,
                    metadata: { studentId, universityId: appData.universityId }
                });

                if (app.student.leadId) {
                    await tx.leadActivity.create({
                        data: {
                            leadId: app.student.leadId,
                            userId: (session.user as any).id,
                            type: "STATUS_CHANGE",
                            content: `New application added for ${app.university.name} (${appData.intake || 'N/A'})`,
                        }
                    });
                }

                results.push(app);
            }
            return results;
        });

        return NextResponse.json(createdApplications, { status: 201 });
    } catch (error) {
        console.error("Error creating applications:", error);
        return NextResponse.json({ error: "Failed to create applications" }, { status: 500 });
    }
}
