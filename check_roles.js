
const { PrismaClient } = require('./prisma/generated/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            select: { name: true, email: true, role: true }
        });
        users.forEach(u => {
            console.log(`- ${u.name} (${u.email}): ${u.role}`);
        });
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
