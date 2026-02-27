
const { PrismaClient } = require('./prisma/generated/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const roles = await prisma.user.groupBy({ by: ['role'], _count: true });
        roles.forEach(r => console.log(`${r.role}: ${r._count}`));
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
