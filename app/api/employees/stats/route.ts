import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const role = searchParams.get("role");

        const where: any = {};
        if (role) where.role = role;

        const [active, inactive] = await Promise.all([
            prisma.user.count({ where: { ...where, isActive: true } }),
            prisma.user.count({ where: { ...where, isActive: false } }),
        ]);

        return NextResponse.json({
            total: active + inactive,
            active,
            inactive,
        });
    } catch (error) {
        console.error('Fetch employees stats error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
