import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // RBAC Filters
        const isEmployee = session.user.role === 'EMPLOYEE' || session.user.role === 'SALES_REP';

        const leadWhere: any = {};
        const studentWhere: any = {};

        if (isEmployee) {
            leadWhere.assignments = {
                some: {
                    assignedTo: session.user.id
                }
            };
            studentWhere.onboardedBy = session.user.id;
        }

        const activeLeadWhere = { ...leadWhere, status: { not: 'CONVERTED' } };

        const [
            totalLeads,
            totalStudents,
            totalEmployees,
            activeWebsites,
            totalWebsites,
            newLeadsToday,
            newStudentsToday,
            pendingTasksCount,
            recentLeads,
            leadsLast30Days,
            studentsLast30Days,
            upcomingTasks,
            leadStatusCounts,
            totalAgents,
            totalCounselors
        ] = await Promise.all([
            prisma.lead.count({ where: activeLeadWhere }),
            prisma.student.count({ where: studentWhere }),
            prisma.user.count({
                where: {
                    role: 'EMPLOYEE',
                    ...(session.user.role !== 'ADMIN' ? { id: 'none' } : {}) // Effectively hide if not admin
                }
            }),
            prisma.website.count({
                where: { isActive: true }
            }),
            prisma.website.count(),
            prisma.lead.count({
                where: {
                    ...activeLeadWhere,
                    createdAt: {
                        gte: startOfDay
                    }
                }
            }),
            prisma.student.count({
                where: {
                    ...studentWhere,
                    createdAt: {
                        gte: startOfDay
                    }
                }
            }),
            prisma.leadTask.count({
                where: {
                    status: 'PENDING',
                    assignedTo: session.user.id
                }
            }),
            prisma.lead.findMany({
                where: activeLeadWhere,
                take: 10, // Dashboard usually needs fewer
                orderBy: { updatedAt: 'desc' },
                include: {
                    student: true
                }
            }),
            prisma.lead.findMany({
                where: {
                    ...leadWhere,
                    createdAt: {
                        gte: new Date(new Date().setDate(new Date().getDate() - 30))
                    }
                },
                select: {
                    createdAt: true
                }
            }),
            prisma.student.findMany({
                where: {
                    ...studentWhere,
                    createdAt: {
                        gte: new Date(new Date().setDate(new Date().getDate() - 30))
                    }
                },
                select: {
                    createdAt: true
                }
            }),
            prisma.leadTask.findMany({
                where: {
                    status: 'PENDING',
                    assignedTo: session.user.id
                },
                take: 5,
                orderBy: {
                    dueAt: 'asc'
                },
                include: {
                    lead: {
                        select: {
                            name: true
                        }
                    }
                }
            }),
            prisma.lead.groupBy({
                by: ['status'],
                where: leadWhere,
                _count: {
                    status: true
                }
            }),
            prisma.user.count({ where: { role: 'AGENT' } }),
            prisma.user.count({ where: { role: 'COUNSELOR' } })
        ]);

        // Process data for analytics graph
        const analyticsMap = new Map<string, { leads: number, students: number }>();

        // Initialize last 30 days with 0
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            analyticsMap.set(dateStr, { leads: 0, students: 0 });
        }

        // Fill leads data
        leadsLast30Days.forEach((lead: any) => {
            const dateStr = lead.createdAt.toISOString().split('T')[0];
            if (analyticsMap.has(dateStr)) {
                analyticsMap.get(dateStr)!.leads++;
            }
        });

        // Fill students data
        studentsLast30Days.forEach((student: any) => {
            const dateStr = student.createdAt.toISOString().split('T')[0];
            if (analyticsMap.has(dateStr)) {
                analyticsMap.get(dateStr)!.students++;
            }
        });

        const analytics = Array.from(analyticsMap.entries()).map(([date, counts]) => ({
            date,
            ...counts
        }));

        return NextResponse.json({
            stats: {
                totalLeads,
                totalStudents,
                totalEmployees,
                totalWebsites,
                activeWebsites,
                newLeadsToday,
                newStudentsToday,
                pendingTasksCount,
                totalAgents,
                totalCounselors,
                isAdmin: session.user.role === 'ADMIN'
            },
            recentLeads,
            upcomingTasks,
            leadStatusCounts,
            analytics
        });

    } catch (error) {
        console.error("[DASHBOARD_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
