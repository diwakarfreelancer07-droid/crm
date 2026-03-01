
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createDummyData() {
    console.log('Starting dummy data creation...');

    // 1. Get any existing user
    const admin = await prisma.user.findFirst();

    if (!admin) {
        throw new Error('No user found in the database. Please run seed script first.');
    }

    // 2. Get or create a country
    let country = await prisma.country.findFirst();
    if (!country) {
        country = await prisma.country.create({
            data: {
                name: 'Dummy Country',
                code: 'DC'
            }
        });
    }

    // 3. Create a university
    const university = await prisma.university.create({
        data: {
            name: 'Dummy University 1234',
            countryId: country.id,
        }
    });

    console.log(`Created university: ${university.name}`);

    // 4. Create 10 Students and Applications
    for (let i = 1; i <= 10; i++) {
        const studentName = `student 1234 ${i}`;
        const studentEmail = `student1234_${i}@example.com`;
        const phone = `12345678${i.toString().padStart(2, '0')}`;

        const student = await prisma.student.create({
            data: {
                name: studentName,
                email: studentEmail,
                phone: phone,
                onboardedBy: admin.id,
                status: 'NEW'
            }
        });

        await prisma.universityApplication.create({
            data: {
                studentId: student.id,
                countryId: country.id,
                universityId: university.id,
                status: 'PENDING',
                intake: 'Sep-2026',
            }
        });

        console.log(`Created ${studentName} and its application.`);
    }

    console.log('Finished creating 10 dummy students and applications.');
}

createDummyData()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
