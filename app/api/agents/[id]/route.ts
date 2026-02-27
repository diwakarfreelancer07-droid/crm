import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const agent = await prisma.user.findUnique({
            where: { id, role: 'AGENT' },
            include: {
                agentProfile: {
                    include: {
                        counselors: {
                            include: {
                                user: { select: { name: true, email: true } }
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        onboardedStudents: true,
                    }
                }
            }
        });

        if (!agent) return NextResponse.json({ message: 'Agent not found' }, { status: 404 });

        return NextResponse.json(agent);
    } catch (error) {
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { name, email, isActive, companyName, address, phone, commission } = body;

        const updatedAgent = await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                isActive,
                agentProfile: {
                    update: {
                        companyName,
                        address,
                        phone,
                        commission: commission ? parseFloat(commission) : undefined,
                    }
                }
            },
            include: { agentProfile: true }
        });

        return NextResponse.json(updatedAgent);
    } catch (error) {
        return NextResponse.json({ message: 'Failed to update agent' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await prisma.user.delete({ where: { id } });

        return NextResponse.json({ message: 'Agent deleted successfully' });
    } catch (error) {
        return NextResponse.json({ message: 'Failed to delete agent' }, { status: 500 });
    }
}
