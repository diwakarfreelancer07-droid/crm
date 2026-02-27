
import { PrismaClient } from './prisma/generated/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting minimal seeding...');
    const passwordHash = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@inter.in' },
        update: {},
        create: {
            email: 'admin@inter.in',
            name: 'System Admin',
            passwordHash: passwordHash,
            role: 'ADMIN',
            isActive: true,
            emailVerified: new Date(),
        },
    });
    console.log('Admin user seeded:', admin.email);

    const agent = await prisma.user.upsert({
        where: { email: 'sales@inter.in' },
        update: {},
        create: {
            email: 'sales@inter.in',
            name: 'Sales Rep 1',
            passwordHash: passwordHash,
            role: 'AGENT',
            isActive: true,
            emailVerified: new Date(),
        },
    });
    console.log('Agent user seeded:', agent.email);

    const student = await prisma.student.create({
        data: {
            name: 'Test Student',
            email: 'test@student.com',
            phone: '1234567890',
            onboardedBy: agent.id,
            status: 'NEW',
        },
    });
    console.log('Student seeded:', student.name);

    console.log('Minimal seeding completed!');
}

main()
    .catch((e) => {
        console.error('SEED_ERROR:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
