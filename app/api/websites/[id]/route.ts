import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions) as any;
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name, url, isActive } = await req.json();
        const website = await prisma.website.update({
            where: { id },
            data: { name, url, isActive }
        });
        return NextResponse.json(website);
    } catch (error) {
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions) as any;
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Soft delete (set inactive) or Hard delete?
        // Hard deletion might break leads if we enforce FK, but here source is String.
        // Let's hard delete for now, but check if user wants soft delete. 
        // Plan said "Soft delete or hard delete". Let's do hard delete but maybe warn if used?
        // Actually, since relation isn't enforced (String), hard delete is fine for the Master list,
        // but old leads will keep the string value.
        await prisma.website.delete({
            where: { id }
        });
        return NextResponse.json({ message: 'Deleted' });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
