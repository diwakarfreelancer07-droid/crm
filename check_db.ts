import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDb() {
    const userCount = await prisma.user.count();
    const countryCount = await prisma.country.count();
    const universityCount = await prisma.university.count();
    const studentCount = await prisma.student.count();
    const applicationCount = await prisma.universityApplication.count();

    console.log(`Users: ${userCount}`);
    console.log(`Countries: ${countryCount}`);
    console.log(`Universities: ${universityCount}`);
    console.log(`Students: ${studentCount}`);
    console.log(`Applications: ${applicationCount}`);

    const sampleUser = await prisma.user.findFirst();
    const sampleCountry = await prisma.country.findFirst();
    const sampleUniv = await prisma.university.findFirst();

    console.log('Sample User ID:', sampleUser?.id);
    console.log('Sample Country ID:', sampleCountry?.id);
    console.log('Sample Univ ID:', sampleUniv?.id);
}

checkDb().catch(console.error).finally(() => prisma.$disconnect());
