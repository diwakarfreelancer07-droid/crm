import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions) as any;
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name, code, isActive } = await req.json();
        const { id } = await params;

        const country = await prisma.country.update({
            where: { id },
            data: {
                name,
                code,
                isActive: isActive !== undefined ? isActive : undefined
            }
        });

        return NextResponse.json(country);
    } catch (error) {
        console.error("Error updating country:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions) as any;
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        await prisma.country.delete({
            where: { id }
        });
        return NextResponse.json({ message: 'Country deleted' });
    } catch (error) {
        console.error("Error deleting country:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
