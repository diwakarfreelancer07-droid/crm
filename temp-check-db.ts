import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const agentCount = await prisma.user.count({ where: { role: 'AGENT' } });
    const users = await prisma.user.findMany({
        where: { role: 'AGENT' },
        select: { id: true, name: true, email: true, isActive: true }
    });
    console.log('AGENT_COUNT:', agentCount);
    console.log('AGENTS:', JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
