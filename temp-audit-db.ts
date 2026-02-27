import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const agents = await prisma.user.findMany({
        where: { role: 'AGENT' },
        include: { agentProfile: true }
    });

    console.log('AGENT_AUDIT:');
    agents.forEach(a => {
        console.log(`- ${a.name} (${a.email}): Profile ${a.agentProfile ? 'EXISTS' : 'MISSING'}`);
    });

    const counselors = await prisma.user.findMany({
        where: { role: 'COUNSELOR' },
        include: { counselorProfile: true }
    });
    console.log('\nCOUNSELOR_AUDIT:');
    counselors.forEach(c => {
        console.log(`- ${c.name} (${c.email}): Profile ${c.counselorProfile ? 'EXISTS' : 'MISSING'}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
