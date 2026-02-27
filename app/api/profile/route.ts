import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                agentProfile: true,
                counselorProfile: true,
            },
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Exclude sensitive data
        const { passwordHash, ...safeUser } = user;

        return NextResponse.json(safeUser);
    } catch (error) {
        console.error('Fetch profile error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        const { name, phone, department } = data;

        // Update User and EmployeeProfile
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name,
                agentProfile: session.user.role === 'AGENT' ? {
                    upsert: {
                        create: { phone },
                        update: { phone },
                    }
                } : undefined,
                counselorProfile: session.user.role === 'COUNSELOR' ? {
                    upsert: {
                        create: { phone, department },
                        update: { phone, department },
                    }
                } : undefined,
            },
            include: {
                agentProfile: true,
                counselorProfile: true,
            }
        });

        const { passwordHash, ...safeUser } = updatedUser;
        return NextResponse.json(safeUser);
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
