const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testApi(id) {
    console.log(`Testing ID: ${id}`);
    const application = await prisma.universityApplication.findUnique({
        where: { id },
        include: {
            student: {
                include: {
                    lead: true,
                    user: { select: { name: true } }
                }
            },
            country: true,
            university: true,
            course: true,
            assignedBy: { select: { id: true, name: true, role: true } },
            assignedTo: { select: { id: true, name: true, role: true } },
            applicationNotes: {
                include: { user: { select: { name: true, role: true, imageUrl: true } } },
                orderBy: { createdAt: 'desc' }
            }
        },
    });
    console.log('Result found:', !!application);
}

async function run() {
    const first = await prisma.universityApplication.findFirst();
    if (first) {
        await testApi(first.id);
    } else {
        console.log('No applications found in DB');
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());
