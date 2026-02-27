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

        const { searchParams } = req.nextUrl;
        const leadId = searchParams.get('leadId');
        const studentId = searchParams.get('studentId');
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
        const skip = (page - 1) * limit;

        if (!leadId && !studentId) {
            return NextResponse.json({ error: 'leadId or studentId is required' }, { status: 400 });
        }

        const where: any = {};
        if (leadId) where.leadId = leadId;
        if (studentId) where.studentId = studentId;

        const [callLogs, total] = await Promise.all([
            prisma.callLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
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
        console.error('[Calls API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
