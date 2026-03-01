import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixAdmin() {
    const passwordHash = await bcrypt.hash('admin123', 10);
    const now = new Date();

    const result = await prisma.user.update({
        where: { email: 'admin@inter.in' },
        data: {
            passwordHash: passwordHash,
            emailVerified: now,
            isActive: true
        }
    });

    console.log('Admin user fixed:', result.email);
}

fixAdmin().catch(console.error).finally(() => prisma.$disconnect());
