import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuditLogService } from "@/lib/auditLog";
import { withPermission } from "@/lib/permissions";
import { ApplicationStatus, VisaStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

// GET /api/applications - List university applications
export const GET = withPermission('APPLICATIONS', 'VIEW', async (req, { permission }) => {
    try {
        const { user: sessionUser, scope } = permission;
        const session = { user: sessionUser };

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

        const userRole = session.user.role as string;
        const userId = session.user.id as string;

        // If studentId is provided, returns all applications for that specific student
        if (studentIdString) {
            const studentAppWhere: any = { studentId: studentIdString };
            if (status) {
                if (Object.values(ApplicationStatus).includes(status as any)) {
                    studentAppWhere.status = status;
                }
            } else {
                studentAppWhere.status = { notIn: ["READY_FOR_VISA", "DEFERRED", "ENROLLED"] };
            }

            const [applications, total] = await Promise.all([
                prisma.universityApplication.findMany({
                    where: studentAppWhere,
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
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                prisma.universityApplication.count({ where: studentAppWhere })
            ]);

            return NextResponse.json({
                applications,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                }
            });
        }

        // --- Grouped By Student View ---

        const appWhere: Record<string, any> = {};
        let isAppStatus = false;
        let isVisaStatus = false;

        if (status) {
            isAppStatus = Object.values(ApplicationStatus).includes(status as any);
            isVisaStatus = Object.values(VisaStatus).includes(status as any);
            if (isAppStatus) {
                appWhere.status = status;
            }
        } else {
            // By default, hide applications that have been moved to the visa stage or completed
            appWhere.status = { notIn: ["READY_FOR_VISA", "DEFERRED", "ENROLLED"] };
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

        // RBAC Logic for applications (Dynamic scope-based)
        if (scope === 'OWN' || scope === 'ASSIGNED') {
            const secondaryIds = [userId];
            if (userRole === 'AGENT') {
                const agent = await prisma.agentProfile.findUnique({
                    where: { userId },
                    select: { id: true }
                });
                if (agent) {
                    const counselors = await prisma.counselorProfile.findMany({
                        where: { agentId: agent.id },
                        select: { userId: true }
                    });
                    secondaryIds.push(...counselors.map(c => c.userId));
                }
            }

            // Apply restrictions to appWhere
            appWhere.OR = [
                { assignedToId: { in: secondaryIds } },
                { assignedById: { in: secondaryIds as any } },
                { student: { onboardedBy: { in: secondaryIds } } }
            ];
        }

        // Base where clause for STUDENTS
        const studentWhere: Record<string, any> = {};

        if (!status) {
            studentWhere.applications = {
                some: appWhere,
                none: {
                    status: { in: ["READY_FOR_VISA", "DEFERRED", "ENROLLED"] }
                }
            };
        } else if (isAppStatus) {
            studentWhere.applications = {
                some: appWhere
            };
        } else if (isVisaStatus) {
            studentWhere.visaApplications = {
                some: { status: status as any }
            };
            if (Object.keys(appWhere).length > 0) {
                studentWhere.applications = { some: appWhere };
            }
        } else {
            studentWhere.applications = { some: appWhere };
        }


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

        console.log('DEBUG: Applications API', { userRole, userId, status, studentIdString });
        console.log('DEBUG: appWhere', JSON.stringify(appWhere, null, 2));
        console.log('DEBUG: studentWhere', JSON.stringify(studentWhere, null, 2));

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
                    visaApplications: {
                        where: {
                            ...(isVisaStatus && { status: status as any })
                        },
                        include: {
                            country: { select: { id: true, name: true } },
                            university: { select: { id: true, name: true } },
                            course: { select: { id: true, name: true } },
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    },
                    _count: {
                        select: { applications: true, visaApplications: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.student.count({ where: studentWhere }),
        ]);

        const mappedApplications = students.map(student => {
            const latestUniApp = student.applications[0];
            const latestVisaApp = student.visaApplications?.[0];

            // Prioritize status match. If we are filtering by status, find the one that matches.
            let displayApp = latestUniApp;
            if (status && latestVisaApp?.status === (status as any)) {
                displayApp = {
                    ...latestVisaApp,
                    status: latestVisaApp.status as any,
                    universityApplication: latestUniApp // keep ref if exists
                } as any;
            }

            if (!displayApp) return null;

            const isVisaStage = !!latestVisaApp;

            return {
                ...displayApp,
                isVisaStage,
                student: {
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    phone: student.phone,
                    imageUrl: student.imageUrl,
                    status: student.status,
                    passportNo: student.passportNo,
                    _count: {
                        applications: student._count.applications,
                        visaApplications: student._count.visaApplications
                    }
                },
                _count: {
                    notes: (displayApp as any)._count?.applicationNotes || 0
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
});

// POST /api/applications 
export const POST = withPermission('APPLICATIONS', 'CREATE', async (req, { permission }) => {
    try {
        const { user: sessionUser } = permission;
        const session = { user: sessionUser };

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

            // Extract agent/counselor from first app (assuming they are student-wide for this batch)
            const firstApp = applications[0];
            if (firstApp && (firstApp.agentId || firstApp.counselorId)) {
                await tx.student.update({
                    where: { id: studentId },
                    data: {
                        agentId: firstApp.agentId || null,
                        counselorId: firstApp.counselorId || null
                    }
                });
            }

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
                        agentId: appData.agentId || null,
                        counselorId: appData.counselorId || null,
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
});
