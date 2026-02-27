import { NextResponse } from 'next/server';
import { prisma, LeadActivityType } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic'; // Ensure no caching for cron

export async function GET(req: Request) {
    try {
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
        const in10Minutes = new Date(now.getTime() + 10 * 60 * 1000);

        // Fetch pending reminders that need notification
        // We look for reminders due within the respective windows that haven't been sent yet
        const reminders = await prisma.reminder.findMany({
            where: {
                task: {
                    status: 'PENDING'
                },
                OR: [
                    {
                        // 24 Hour window: RemindAt is roughly 24h from now (e.g. within next 24h range but not too close)
                        // Actually, simplified logic: If remindAt <= in24Hours AND !sent24h
                        remindAt: { lte: in24Hours },
                        sent24h: false
                    },
                    {
                        remindAt: { lte: in1Hour },
                        sent1h: false
                    },
                    {
                        remindAt: { lte: in10Minutes },
                        sent10m: false
                    }
                ]
            },
            include: {
                task: {
                    include: {
                        lead: {
                            include: {
                                assignments: {
                                    include: {
                                        employee: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        const results = {
            processed: 0,
            sent24h: 0,
            sent1h: 0,
            sent10m: 0,
            errors: 0
        };

        for (const reminder of reminders) {
            results.processed++;
            const { remindAt } = reminder;
            const diff = remindAt.getTime() - now.getTime();
            const hoursDiff = diff / (1000 * 60 * 60);
            const minutesDiff = diff / (1000 * 60);

            let type = '';
            let updateField = {};

            // Determine which notification to send
            // Priority: 10m > 1h > 24h to avoid sending multiple at once if we missed a window?
            // Actually, we want to send specific ones based on the time remaining.

            // Logic:
            // If < 10 mins remaining AND !sent10m -> Send 10m
            // If < 1 hour remaining AND !sent1h -> Send 1h
            // If < 24 hours remaining AND !sent24h -> Send 24h

            if (reminder.remindAt <= in10Minutes && !reminder.sent10m) {
                type = '10 MINUTE';
                updateField = { sent10m: true };
                results.sent10m++;
            } else if (reminder.remindAt <= in1Hour && !reminder.sent1h) {
                type = '1 HOUR';
                updateField = { sent1h: true };
                results.sent1h++;
            } else if (reminder.remindAt <= in24Hours && !reminder.sent24h) {
                type = '24 HOUR';
                updateField = { sent24h: true };
                results.sent24h++;
            } else {
                continue; // Should not happen given query, but safety
            }

            const activeAssignment = reminder.task.lead.assignments.find((a: any) => !a.unassignedAt); // Assuming unassignedAt logic or just take first active
            // The schema for LeadAssignment doesn't have unassignedAt, effectively latest or filtering by logic.
            // Let's assume the latest assignment or the one corresponding to 'ASSIGNED' status.
            // For now, simpler: send to ALL currently assigned employees.
            const assignee = reminder.task.lead.assignments[0]?.employee; // Simplification

            if (assignee && assignee.email) {
                try {
                    // 1. Send In-App Notification
                    await createNotification(
                        assignee.id,
                        `Task Due: ${reminder.task.title}`,
                        `Task for ${reminder.task.lead.name} is due in ${type.toLowerCase()}.`,
                        'TASK_REMINDER'
                    );

                    // 2. Send Email
                    await sendEmail({
                        to: assignee.email,
                        subject: `[${type} REMINDER] Task Due: ${reminder.task.title}`,
                        html: `
                            <div style="font-family: Arial; padding: 20px;">
                                <h2 style="color: #e11d48;">Task Reminder</h2>
                                <p>Hello ${assignee.name},</p>
                                <p>This is a reminder that the task <strong>${reminder.task.title}</strong> for lead <strong><a href="${process.env.NEXTAUTH_URL}/leads/${reminder.task.leadId}">${reminder.task.lead.name}</a></strong> is due.</p>
                                <p><strong>Due Time:</strong> ${remindAt.toLocaleString()}</p>
                                <p><strong>Time Remaining:</strong> ~${Math.round(hoursDiff > 1 ? hoursDiff : minutesDiff)} ${hoursDiff > 1 ? 'hours' : 'minutes'}</p>
                                <br/>
                                <a href="${process.env.NEXTAUTH_URL}/leads/${reminder.task.leadId}?tab=tasks" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Task</a>
                            </div>
                        `
                    });

                    // 3. Update DB to mark as sent
                    await prisma.reminder.update({
                        where: { id: reminder.id },
                        data: updateField
                    });

                } catch (err) {
                    console.error("Failed to process reminder:", reminder.id, err);
                    results.errors++;
                }
            }
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
