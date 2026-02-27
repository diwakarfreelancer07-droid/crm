
const { PrismaClient } = require('./prisma/generated/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const apCount = await prisma.agentProfile.count();
        console.log('AgentProfile count:', apCount);

        const cpCount = await prisma.counselorProfile.count();
        console.log('CounselorProfile count:', cpCount);

        const eps = await prisma.employeeProfile.count();
        console.log('EmployeeProfile count:', eps);

    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
