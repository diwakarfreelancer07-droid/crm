import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            role: true,
            isActive: true
        }
    });

    console.log('Database Users:');
    console.table(users);
}

listUsers().catch(console.error).finally(() => prisma.$disconnect());
