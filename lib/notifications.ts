import { sendEmail } from '@/lib/email';
import { prisma, NotificationType } from '@/lib/prisma';

export async function createNotification(userId: string, title: string, message: string, type: NotificationType) {
    try {
        await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
            },
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

export async function notifyAdmins(title: string, message: string, type: NotificationType) {
    console.log(`[Notification] notifyAdmins called: ${title}`);
    try {
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN', isActive: true },
            select: { id: true, email: true },
        });

        console.log(`[Notification] Found ${admins.length} admins`);

        for (const admin of admins) {
            console.log(`[Notification] Sending to admin: ${admin.email}`);
            // Create in-app notification
            await createNotification(admin.id, title, message, type);

            // Send email
            const result = await sendEmail({
                to: admin.email,
                subject: `[Inter CRM] ${title}`,
                html: `<p>${message}</p>`,
            });
            console.log(`[Notification] Email result for ${admin.email}:`, result ? 'Success' : 'Failed');
        }
    } catch (error) {
        console.error('Error notifying admins:', error);
    }
}

export async function notifyUser(userId: string, title: string, message: string, type: NotificationType) {
    console.log(`[Notification] notifyUser called for ${userId}: ${title}`);
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, isActive: true },
        });

        if (user && user.isActive) {
            console.log(`[Notification] Sending to user: ${user.email}`);
            // Create in-app notification
            await createNotification(userId, title, message, type);

            // Send email
            const result = await sendEmail({
                to: user.email,
                subject: `[Inter CRM] ${title}`,
                html: `<p>${message}</p>`,
            });
            console.log(`[Notification] Email result for ${user.email}:`, result ? 'Success' : 'Failed');
        } else {
            console.log(`[Notification] User ${userId} not found or inactive`);
        }
    } catch (error) {
        console.error('Error notifying user:', error);
    }
}
