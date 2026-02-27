
const { PrismaClient } = require('./prisma/generated/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Roles Count ---');
        const roles = await prisma.user.groupBy({
            by: ['role'],
            _count: true
        });
        console.log(JSON.stringify(roles, null, 2));

        console.log('\n--- Active Agents ---');
        const agents = await prisma.user.findMany({
            where: { role: 'AGENT', isActive: true },
            include: { agentProfile: true }
        });
        console.log(`Found ${agents.length} active agents`);
        agents.forEach(a => {
            console.log(`Agent: ${a.name} (${a.email}), Profile ID: ${a.agentProfile?.id || 'MISSING'}`);
        });

        console.log('\n--- Active Counselors ---');
        const counselors = await prisma.user.findMany({
            where: { role: 'COUNSELOR', isActive: true },
            include: { counselorProfile: { include: { agent: { include: { user: true } } } } }
        });
        console.log(`Found ${counselors.length} active counselors`);
        counselors.forEach(c => {
            console.log(`Counselor: ${c.name} (${c.email}), Agent: ${c.counselorProfile?.agent?.user?.name || 'NONE'}`);
        });

    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
