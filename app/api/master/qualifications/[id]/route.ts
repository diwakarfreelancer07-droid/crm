import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
        const { name, isActive } = await req.json();

        const qualification = await prisma.qualification.update({
            where: { id },
            data: {
                name,
                isActive: isActive !== undefined ? isActive : undefined
            }
        });

        return NextResponse.json(qualification);
    } catch (error) {
        console.error("Error updating qualification:", error);
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
        await prisma.qualification.delete({
            where: { id }
        });
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error("Error deleting qualification:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
