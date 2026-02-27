const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const students = await prisma.student.findMany({
        include: {
            applications: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    });

    const student = students.find(s => s.applications.length > 0);
    if (student) {
        const latestApp = student.applications[0];
        const { _count, ...appDetails } = latestApp;
        console.log('Original ID:', latestApp.id);
        console.log('Derived ID:', appDetails.id);
    } else {
        console.log('No students with applications found');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
