import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Comprehensive Country Merge Started ---')

    const allCountries = await prisma.country.findMany()
    const map = new Map<string, any[]>()

    for (const c of allCountries) {
        const key = c.name.toLowerCase().trim()
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(c)
    }

    for (const [name, duplicates] of map.entries()) {
        if (duplicates.length > 1) {
            console.log(`Duplicate found for "${name}": ${duplicates.length} entries.`)

            const enriched = await Promise.all(duplicates.map(async c => {
                const u = await prisma.university.count({ where: { countryId: c.id } })
                const a = await prisma.universityApplication.count({ where: { countryId: c.id } })
                const d = await prisma.studentDocument.count({ where: { countryId: c.id } })
                return { ...c, totalRefs: u + a + d, u, a, d }
            }))

            // Sort: keep the one with most references
            enriched.sort((a, b) => b.totalRefs - a.totalRefs)
            const keep = enriched[0]
            const toRemove = enriched.slice(1)

            console.log(`  KEEPING: ${keep.id} (${keep.name}) [Refs: ${keep.totalRefs}]`)

            for (const rem of toRemove) {
                console.log(`  MERGING & REMOVING: ${rem.id} (${rem.name}) [Refs: ${rem.totalRefs}]`)

                const u = await prisma.university.updateMany({ where: { countryId: rem.id }, data: { countryId: keep.id } })
                const a = await prisma.universityApplication.updateMany({ where: { countryId: rem.id }, data: { countryId: keep.id } })
                const d = await prisma.studentDocument.updateMany({ where: { countryId: rem.id }, data: { countryId: keep.id } })
                const c = await prisma.applicationChecklist.updateMany({ where: { countryId: rem.id }, data: { countryId: keep.id } })

                console.log(`    Updated: ${u.count} Unis, ${a.count} Apps, ${d.count} Docs, ${c.count} Checklists.`)

                try {
                    await prisma.country.delete({ where: { id: rem.id } })
                    console.log(`    Deleted duplicate: ${rem.id}`)
                } catch (err) {
                    console.error(`    Failed to delete ${rem.id}:`, err)
                }
            }
        }
    }

    console.log('\n--- Final Verification ---')
    const remaining = await prisma.country.findMany({ orderBy: { name: 'asc' } })
    for (const c of remaining) {
        const count = await prisma.university.count({ where: { countryId: c.id } })
        console.log(`- ${c.name}: ${count} universities`)
    }
}

main()
    .catch(e => {
        console.error('Fatal error in merge script:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
