import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const countries = await prisma.country.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                code: true,
                _count: {
                    select: { universities: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        const response = countries.map(c => ({
            id: c.id,
            name: c.name,
            code: c.code,
            universityCount: c._count.universities
        }));

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching countries with university count:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
