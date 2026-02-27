import { NextResponse } from 'next/server';
import { prisma, LeadActivityType, TaskStatus } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        // Simple security: check for a secret header
        const authHeader = req.headers.get('x-cron-secret');
        if (authHeader !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();

        // 1. Find reminders that are due and not yet sent
        const reminders = await prisma.reminder.findMany({
            where: {
                remindAt: { lte: now },
                isSent: false
            },
            include: {
                task: {
                    include: {
                        lead: true
                    }
                }
            }
        });

        const results = [];

        for (const reminder of reminders) {
            // "Send" notification: in this case, we'll log an activity
            await prisma.$transaction(async (tx) => {
                // Mark as sent
                await tx.reminder.update({
                    where: { id: reminder.id },
                    data: { isSent: true }
                });

                // Log Activity for visibility
                await tx.leadActivity.create({
                    data: {
                        leadId: reminder.task.leadId,
                        userId: reminder.task.assignedTo,
                        type: LeadActivityType.NOTE,
                        content: `SYSTEM REMINDER: Task "${reminder.task.title}" is due soon!`
                    }
                });
            });
            results.push(reminder.id);
        }

        return NextResponse.json({
            processed: results.length,
            ids: results
        });
    } catch (error) {
        console.error('Automation error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
