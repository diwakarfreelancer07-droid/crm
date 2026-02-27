const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const app = await prisma.universityApplication.findFirst();
    console.log('First Application:', app);
    if (app) {
        const found = await prisma.universityApplication.findUnique({
            where: { id: app.id }
        });
        console.log('Found by ID:', found ? 'Yes' : 'No');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
