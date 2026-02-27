const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const apps = await prisma.universityApplication.findMany({
        take: 5,
        include: { student: true }
    });
    console.log('Applications in DB:');
    apps.forEach(app => {
        console.log(`App ID: ${app.id}, Student ID: ${app.studentId}, Student Name: ${app.student?.name}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
