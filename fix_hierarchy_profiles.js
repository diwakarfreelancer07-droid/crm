
const { PrismaClient } = require('./prisma/generated/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- ENHANCING HIERARCHY PROFILES ---');

        // Find all active SALES_REP and MANAGER users who don't have an AgentProfile
        const usersToUpdate = await prisma.user.findMany({
            where: {
                role: { in: ['SALES_REP', 'MANAGER'] },
                isActive: true,
                agentProfile: null
            }
        });

        console.log(`Found ${usersToUpdate.length} users to update.`);

        for (const user of usersToUpdate) {
            console.log(`Creating AgentProfile for: ${user.name} (${user.role})`);
            await prisma.agentProfile.create({
                data: {
                    userId: user.id,
                }
            });
        }

        console.log('--- UPDATE COMPLETE ---');
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
