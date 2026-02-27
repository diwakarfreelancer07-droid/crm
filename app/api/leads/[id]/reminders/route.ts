import { NextResponse } from 'next/server';
import { prisma, LeadActivityType } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/leads/[id]/reminders - Create a reminder for a task
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
        const { taskId, remindAt } = body;

        if (!taskId || !remindAt) {
            return NextResponse.json({ message: 'Task ID and remind time required' }, { status: 400 });
        }

        const reminder = await prisma.$transaction(async (tx) => {
            const newReminder = await tx.reminder.create({
                data: {
                    taskId,
                    remindAt: new Date(remindAt),
                    isSent: false
                }
            });

            await tx.leadActivity.create({
                data: {
                    leadId: id,
                    userId: session.user.id,
                    type: LeadActivityType.NOTE,
                    content: `Reminder set for ${new Date(remindAt).toLocaleString()}`
                }
            });

            return newReminder;
        });

        return NextResponse.json(reminder, { status: 201 });
    } catch (error) {
        console.error('Create reminder error:', error);
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

        // Get all reminders for tasks related to this lead
        const reminders = await prisma.reminder.findMany({
            where: {
                task: {
                    leadId: id
                }
            },
            include: {
                task: {
                    select: {
                        title: true,
                        dueAt: true,
                        status: true
                    }
                }
            },
            orderBy: { remindAt: 'asc' }
        });

        return NextResponse.json(reminders);
    } catch (error) {
        console.error('Fetch reminders error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
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
        const { reminderId, remindAt } = body;

        if (!reminderId || !remindAt) {
            return NextResponse.json({ message: 'Reminder ID and remind time required' }, { status: 400 });
        }

        const reminder = await prisma.$transaction(async (tx) => {
            const updated = await tx.reminder.update({
                where: { id: reminderId },
                data: { remindAt: new Date(remindAt), isSent: false }
            });

            await tx.leadActivity.create({
                data: {
                    leadId: id,
                    userId: session.user.id,
                    type: LeadActivityType.NOTE,
                    content: `Reminder updated to ${new Date(remindAt).toLocaleString()}`
                }
            });

            return updated;
        });

        return NextResponse.json(reminder);
    } catch (error) {
        console.error('Update reminder error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const reminderId = searchParams.get('reminderId');

        if (!reminderId) {
            return NextResponse.json({ message: 'Reminder ID required' }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            try {
                // Try to delete directly. Using deleteMany prevents error if not found.
                // However, deleteMany doesn't return the deleted record, but we don't need it here.
                // But we want to know if we should log activity.
                const result = await tx.reminder.deleteMany({
                    where: { id: reminderId }
                });

                if (result.count > 0) {
                    await tx.leadActivity.create({
                        data: {
                            leadId: id,
                            userId: session.user.id,
                            type: LeadActivityType.NOTE,
                            content: `Reminder deleted`
                        }
                    });
                }
            } catch (error) {
                // If anything else goes wrong in the transaction, rethrow
                throw error;
            }
        });

        return NextResponse.json({ message: 'Reminder deleted successfully' });
    } catch (error) {
        console.error('Delete reminder error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
