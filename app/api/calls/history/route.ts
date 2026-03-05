/**
 * GET /api/calls/history
 * Returns paginated call logs for the currently authenticated user (agent/counselor).
 * Admins can filter by employeeId.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id as string;
        const role = session.user.role as string;

        const { searchParams } = req.nextUrl;
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
        const skip = (page - 1) * limit;

        // Admin can query any employee's history; agents/counselors only see their own
        const filterEmployeeId =
            role === 'ADMIN'
                ? (searchParams.get('employeeId') || undefined)
                : userId;

        const where: any = {};
        if (filterEmployeeId) where.employeeId = filterEmployeeId;

        const [callLogs, total] = await Promise.all([
            prisma.callLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    lead: { select: { id: true, name: true, phone: true } },
                    student: { select: { id: true, name: true, phone: true } },
                    employee: { select: { id: true, name: true } },
                },
            }),
            prisma.callLog.count({ where }),
        ]);

        return NextResponse.json({
            callLogs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('[Call History]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
