import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const totalUnis = await prisma.university.count()
    console.log(`Total Universities in DB: ${totalUnis}`)

    if (totalUnis > 0) {
        const allUnis = await prisma.university.findMany({
            include: { country: true },
            take: 10
        })
        console.log('Sample Universities:', JSON.stringify(allUnis, null, 2))
    }

    const allCountries = await prisma.country.findMany()
    console.log('All Countries:', JSON.stringify(allCountries, null, 2))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
