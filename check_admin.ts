import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
    const user = await prisma.user.findUnique({
        where: { email: 'admin@inter.in' },
    });

    if (!user) {
        console.log('User admin@inter.in NOT FOUND');
    } else {
        console.log('User admin@inter.in found');
        console.log('passwordHash exists:', !!user.passwordHash);
        console.log('isActive:', user.isActive);
        console.log('emailVerified:', user.emailVerified);
        console.log('role:', user.role);
    }
}

checkAdmin().catch(console.error).finally(() => prisma.$disconnect());
