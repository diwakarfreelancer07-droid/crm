import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixAllUsers() {
    const users = await prisma.user.findMany();
    const passwordHash = await bcrypt.hash('admin123', 10);
    const now = new Date();

    for (const user of users) {
        if (!user.passwordHash || !user.emailVerified) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordHash: user.passwordHash || passwordHash,
                    emailVerified: user.emailVerified || now,
                    isActive: true
                }
            });
            console.log(`Fixed user: ${user.email}`);
        }
    }
}

fixAllUsers().catch(console.error).finally(() => prisma.$disconnect());
