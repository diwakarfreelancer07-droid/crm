const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const leadId = '7420ecb0-9582-41c6-b812-2305271b56ff';
    const lead = await prisma.lead.findUnique({
        where: { id: leadId }
    });
    console.log('LEAD_DATA:', JSON.stringify(lead, null, 2));

    const student = await prisma.student.findUnique({
        where: { leadId: leadId }
    });
    console.log('STUDENT_DATA:', JSON.stringify(student, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
