import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const agentsWithoutProfile = await prisma.user.findMany({
        where: {
            role: 'AGENT',
            agentProfile: null
        }
    });

    console.log(`Found ${agentsWithoutProfile.length} agents without profiles.`);

    for (const agent of agentsWithoutProfile) {
        console.log(`Creating profile for ${agent.email}...`);
        await prisma.agentProfile.create({
            data: {
                userId: agent.id,
                phone: null,
                companyName: 'Default Company',
                commission: 0
            }
        });
    }

    console.log('Done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
