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
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const counselor = await prisma.user.findUnique({
            where: { id, role: 'COUNSELOR' },
            include: {
                counselorProfile: {
                    include: {
                        agent: {
                            include: {
                                user: { select: { name: true } }
                            }
                        }
                    }
                },
                assignedLeads: { include: { lead: true } },
                onboardedStudents: true,
                activities: { take: 10, orderBy: { createdAt: 'desc' } }
            }
        });

        if (!counselor) return NextResponse.json({ message: 'Counselor not found' }, { status: 404 });

        // Agent can only see their own counselors
        if (session.user.role === 'AGENT' && counselor.counselorProfile?.agent?.userId !== session.user.id) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(counselor);
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
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();
        const { name, email, isActive, phone, department, designation, salary, joiningDate, agentId } = body;

        // Check permissions
        if (session.user.role !== 'ADMIN' && session.user.id !== id) {
            // Agents can potentially edit their counselors? Let's restrict to Admin for sensitivity if needed.
            // But if it's the counselor themselves editing their profile:
            if (session.user.role !== 'AGENT') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const updatedCounselor = await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                isActive,
                counselorProfile: {
                    update: {
                        phone,
                        department,
                        designation,
                        salary: salary ? parseFloat(salary) : undefined,
                        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
                        agentId: agentId || undefined,
                    }
                }
            },
            include: { counselorProfile: true }
        });

        return NextResponse.json(updatedCounselor);
    } catch (error) {
        return NextResponse.json({ message: 'Failed to update counselor' }, { status: 500 });
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

        return NextResponse.json({ message: 'Counselor deleted successfully' });
    } catch (error) {
        return NextResponse.json({ message: 'Failed to delete counselor' }, { status: 500 });
    }
}
