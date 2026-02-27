const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Diagnostics ---');
    try {
        const count = await prisma.user.count();
        console.log('Total Users:', count);

        const users = await prisma.user.findMany({
            select: { id: true, email: true, role: true, name: true }
        });
        console.log('User List:');
        users.forEach(u => console.log(`- ${u.email} (${u.role}) ID: ${u.id} [${u.name}]`));

        const leads = await prisma.lead.count();
        console.log('Total Leads:', leads);

        const students = await prisma.student.count();
        console.log('Total Students:', students);
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
