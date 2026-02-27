
const { PrismaClient } = require('./prisma/generated/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            select: { name: true, email: true, role: true }
        });
        console.log('--- ALL USERS ---');
        users.forEach(u => console.log(`${u.name} | ${u.email} | ${u.role}`));

        const count = await prisma.user.count();
        console.log('Total users:', count);
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
