
const { PrismaClient } = require('./prisma/generated/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- All Roles ---');
        const roles = await prisma.user.groupBy({
            by: ['role'],
            _count: true
        });
        console.log(JSON.stringify(roles, null, 2));

        console.log('\n--- All Users ---');
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, isActive: true }
        });
        console.table(users);

        console.log('\n--- Agent Profiles ---');
        const agentProfiles = await prisma.agentProfile.findMany({
            include: { user: { select: { name: true } } }
        });
        console.table(agentProfiles.map(p => ({
            id: p.id,
            userId: p.userId,
            userName: p.user?.name,
            company: p.companyName
        })));

        console.log('\n--- Counselor Profiles ---');
        const counselorProfiles = await prisma.counselorProfile.findMany({
            include: {
                user: { select: { name: true } },
                agent: { include: { user: { select: { name: true } } } }
            }
        });
        console.table(counselorProfiles.map(p => ({
            id: p.id,
            userId: p.userId,
            userName: p.user?.name,
            agentName: p.agent?.user?.name || 'NONE'
        })));

    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
