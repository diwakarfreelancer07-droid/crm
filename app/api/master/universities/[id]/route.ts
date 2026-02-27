import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuditLogService } from '@/lib/auditLog';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const university = await prisma.university.findUnique({
            where: { id },
            include: { country: true }
        });

        if (!university) {
            return NextResponse.json({ message: 'University not found' }, { status: 404 });
        }

        return NextResponse.json(university);
    } catch (error) {
        console.error("Error fetching university:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions) as any;
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await req.json();
        const { name, website, address, description, imageUrl } = body;

        const previousValues = await prisma.university.findUnique({ where: { id } });
        if (!previousValues) {
            return NextResponse.json({ message: 'University not found' }, { status: 404 });
        }

        const university = await prisma.university.update({
            where: { id },
            data: {
                name,
                website,
                address,
                description,
                imageUrl
            }
        });

        // Audit Log
        await AuditLogService.log({
            userId: session.user.id,
            action: "UPDATED",
            module: "MASTERS",
            entity: "University",
            entityId: university.id,
            previousValues,
            newValues: university
        });

        return NextResponse.json(university);
    } catch (error) {
        console.error("Error updating university:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions) as any;
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const university = await prisma.university.findUnique({ where: { id } });
        if (!university) {
            return NextResponse.json({ message: 'University not found' }, { status: 404 });
        }

        await prisma.university.delete({ where: { id } });

        // Audit Log
        await AuditLogService.log({
            userId: session.user.id,
            action: "DELETED",
            module: "MASTERS",
            entity: "University",
            entityId: id,
            previousValues: university
        });

        return NextResponse.json({ message: 'University deleted successfully' });
    } catch (error) {
        console.error("Error deleting university:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
