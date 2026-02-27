
const { PrismaClient } = require('./prisma/generated/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, isActive: true }
        });
        const agentProfiles = await prisma.agentProfile.findMany();
        const counselorProfiles = await prisma.counselorProfile.findMany();

        const report = {
            roles: users.reduce((acc, u) => {
                acc[u.role] = (acc[u.role] || 0) + 1;
                return acc;
            }, {}),
            totalUsers: users.length,
            users: users.map(u => ({ name: u.name, email: u.email, role: u.role, active: u.isActive })),
            profiles: {
                agent: agentProfiles.length,
                counselor: counselorProfiles.length
            }
        };

        fs.writeFileSync('diag_report.json', JSON.stringify(report, null, 2));
    } catch (e) {
        fs.writeFileSync('diag_error.txt', e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
