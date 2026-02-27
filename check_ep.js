
const { PrismaClient } = require('./prisma/generated/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const ep = await prisma.employeeProfile.findFirst({
            include: { user: true }
        });
        if (ep) {
            console.log(`User with EmployeeProfile: ${ep.user.name} (${ep.user.email}), Role: ${ep.user.role}`);
        } else {
            console.log('No EmployeeProfile found');
        }
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
