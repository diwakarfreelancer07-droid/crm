import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const agents = await prisma.user.findMany({
        where: { role: 'AGENT' },
        include: { agentProfile: true }
    });
    console.log('AGENTS_REPORT:', JSON.stringify(agents.map(a => ({
        id: a.id,
        name: a.name,
        hasProfile: !!a.agentProfile,
        profileData: a.agentProfile
    })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
