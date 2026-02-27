import { NextResponse } from 'next/server';
import { prisma, TaskStatus, LeadActivityType } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { title, description, dueAt, remindAt } = body;

        if (!title || !dueAt) {
            return NextResponse.json({ message: 'Title and due date are required' }, { status: 400 });
        }

        const task = await prisma.$transaction(async (tx) => {
            // 1. Create the task
            const newTask = await tx.leadTask.create({
                data: {
                    leadId: id,
                    assignedTo: session.user.id,
                    title,
                    description,
                    dueAt: new Date(dueAt),
                    status: TaskStatus.PENDING,
                }
            });

            // 2. Create reminder if requested
            if (remindAt) {
                await tx.reminder.create({
                    data: {
                        taskId: newTask.id,
                        remindAt: new Date(remindAt),
                    }
                });
            }

            // 3. Log Activity
            await tx.leadActivity.create({
                data: {
                    leadId: id,
                    userId: session.user.id,
                    type: LeadActivityType.TASK_CREATED,
                    content: `Task created: ${title}${remindAt ? ' with reminder' : ''} `
                }
            });

            return newTask;
        });

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error('Create task error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const tasks = await prisma.leadTask.findMany({
            where: { leadId: id },
            orderBy: { dueAt: 'asc' },
            include: {
                reminders: true
            }
        });

        return NextResponse.json(tasks);
    } catch (error) {
        console.error('Fetch tasks error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
