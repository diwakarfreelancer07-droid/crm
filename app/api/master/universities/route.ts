import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuditLogService } from '@/lib/auditLog';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const countryId = searchParams.get('countryId');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const skip = (page - 1) * limit;

    try {
        const where = {
            ...(countryId && { countryId }),
            ...(search && {
                name: { contains: search, mode: 'insensitive' as const }
            })
        };

        const [universities, total] = await Promise.all([
            prisma.university.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                include: { country: true }
            }),
            prisma.university.count({ where })
        ]);

        return NextResponse.json({
            universities,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching universities:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions) as any;
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, countryId, website, address, description, imageUrl } = body;

        if (!name || !countryId) {
            return NextResponse.json({ message: 'Name and Country ID are required' }, { status: 400 });
        }

        // Verify country exists
        const country = await prisma.country.findUnique({ where: { id: countryId } });
        if (!country) {
            return NextResponse.json({ message: 'Country not found' }, { status: 404 });
        }

        const university = await prisma.university.create({
            data: {
                name,
                countryId,
                website,
                address,
                description,
                imageUrl
            }
        });

        // Audit Log
        await AuditLogService.log({
            userId: session.user.id,
            action: "CREATED",
            module: "MASTERS",
            entity: "University",
            entityId: university.id,
            newValues: university
        });

        return NextResponse.json(university);
    } catch (error) {
        console.error("Error creating university:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
