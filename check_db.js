
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.student.count();
        console.log('STUDENT_COUNT:', count);
        const students = await prisma.student.findMany({ take: 5 });
        console.log('STUDENTS_SAMPLE:', JSON.stringify(students, null, 2));
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
