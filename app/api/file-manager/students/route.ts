import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || !['ADMIN', 'MANAGER'].includes(session.user?.role)) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const source = searchParams.get('source') || '';
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.max(1, parseInt(searchParams.get('limit') || '25'));
        const skip = (page - 1) * limit;

        // Build search filter
        const searchFilter: any = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { email: { contains: search, mode: 'insensitive' as const } },
                    { phone: { contains: search, mode: 'insensitive' as const } },
                ],
            }
            : {};

        if (source && source !== 'ALL') {
            searchFilter.lead = { source: source };
        }

        const where = {
            ...searchFilter,
            documents: { some: {} }, // only students with at least one document
        };

        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    createdAt: true,
                    _count: { select: { documents: true } },
                },
                orderBy: { name: 'asc' },
                skip,
                take: limit,
            }),
            prisma.student.count({ where }),
        ]);

        return NextResponse.json({
            students,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error('FILE_MANAGER_STUDENTS_ERROR:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
