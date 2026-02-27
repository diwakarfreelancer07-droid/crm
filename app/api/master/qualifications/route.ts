import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const qualifications = await prisma.qualification.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(qualifications);
    } catch (error) {
        console.error("Error fetching qualifications:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions) as any;
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name } = await req.json();

        // Check if already exists
        const existing = await prisma.qualification.findUnique({
            where: { name }
        });

        if (existing) {
            return NextResponse.json({ message: 'Qualification already exists' }, { status: 400 });
        }

        const qualification = await prisma.qualification.create({
            data: { name }
        });
        return NextResponse.json(qualification);
    } catch (error) {
        console.error("Error creating qualification:", error);
        return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
    }
}
