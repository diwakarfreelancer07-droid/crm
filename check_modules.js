const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const modules = await prisma.auditLog.findMany({
        select: { module: true },
        distinct: ['module'],
    });
    console.log('Unique modules:', modules);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
