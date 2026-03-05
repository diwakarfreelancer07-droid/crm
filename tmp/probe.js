
const { PrismaClient } = require("../prisma/generated/client");
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, role: true, roleId: true },
            take: 10
        });
        console.log("Users sample:", JSON.stringify(users, null, 2));

        const roles = await prisma.userRole.findMany({
            include: { permissions: true }
        });
        console.log("Roles sample:", JSON.stringify(roles, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
