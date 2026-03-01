const { PrismaClient } = require('./prisma/generated/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@inter.in' },
        update: {
            passwordHash,
            isActive: true,
            emailVerified: new Date(),
            role: 'ADMIN',
            name: 'System Admin',
        },
        create: {
            email: 'admin@inter.in',
            name: 'System Admin',
            passwordHash,
            role: 'ADMIN',
            isActive: true,
            emailVerified: new Date(),
        },
    });

    console.log('Admin user ready:', admin.email, '| id:', admin.id);
    console.log('Login at: /admin/login | Email: admin@inter.in | Password: admin123');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
