const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const leadId = '7420ecb0-9582-41c6-b812-2305271b56ff';
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    console.log('STATUS:', lead.status);

    const student = await prisma.student.findUnique({ where: { leadId } });
    console.log('STUDENT_EXISTS:', !!student);
}

main().catch(console.error).finally(() => prisma.$disconnect());
