
const { PrismaClient } = require('./prisma/generated/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            select: { name: true, email: true, role: true, isActive: true }
        });
        console.log('--- USER DATA ---');
        users.forEach(u => {
            console.log(`NAME: ${u.name} | EMAIL: ${u.email} | ROLE: ${u.role} | ACTIVE: ${u.isActive}`);
        });
        console.log('-----------------');

        const agentCount = await prisma.agentProfile.count();
        console.log('AGENT_PROFILES:', agentCount);

        const counselorCount = await prisma.counselorProfile.count();
        console.log('COUNSELOR_PROFILES:', counselorCount);
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
