import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const stats = await prisma.lead.groupBy({
            by: ['status'],
            _count: {
                status: true,
            },
        });

        const counts: Record<string, number> = {
            ALL: 0,
            NEW: 0,
            ASSIGNED: 0,
            IN_PROGRESS: 0,
            FOLLOW_UP: 0,
            CONVERTED: 0,
            LOST: 0,
        };

        let total = 0;

        stats.forEach((group) => {
            const count = group._count.status;
            counts[group.status] = count;
            total += count;
        });

        // ALL should reflect the default list view (Active leads: All except Converted)
        counts.ALL = total - (counts.CONVERTED || 0);

        return NextResponse.json(counts);
    } catch (error) {
        console.error('Fetch leads stats error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
