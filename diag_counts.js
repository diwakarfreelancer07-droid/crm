
const { PrismaClient } = require('./prisma/generated/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const roles = await prisma.user.groupBy({ by: ['role'], _count: true });
        console.log('ROLES:', JSON.stringify(roles));

        const agents = await prisma.user.count({ where: { role: 'AGENT' } });
        console.log('TOTAL_AGENTS:', agents);

        const activeAgents = await prisma.user.count({ where: { role: 'AGENT', isActive: true } });
        console.log('ACTIVE_AGENTS:', activeAgents);

        const counselors = await prisma.user.count({ where: { role: 'COUNSELOR' } });
        console.log('TOTAL_COUNSELORS:', counselors);

        const activeCounselors = await prisma.user.count({ where: { role: 'COUNSELOR', isActive: true } });
        console.log('ACTIVE_COUNSELORS:', activeCounselors);

        const agentProfiles = await prisma.agentProfile.count();
        console.log('AGENT_PROFILES:', agentProfiles);

        const counselorProfiles = await prisma.counselorProfile.count();
        console.log('COUNSELOR_PROFILES:', counselorProfiles);

    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
