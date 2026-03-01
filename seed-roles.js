const { PrismaClient } = require('./prisma/generated/client');
const prisma = new PrismaClient();

const MODULES = ['LEADS', 'STUDENTS', 'APPLICATIONS', 'VISA', 'MASTERS', 'ROLES'];
const ALL = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'DOWNLOAD', 'APPROVE'];
const AGENT = ['VIEW', 'CREATE', 'EDIT'];
const VIEW = ['VIEW'];

const ROLES = [
    { name: 'Super Admin', desc: 'Full unrestricted access to all modules.', scope: 'ALL', actions: ALL },
    { name: 'Admin', desc: 'Manages all CRM data and settings.', scope: 'ALL', actions: ALL },
    { name: 'Agent', desc: 'Manages own assigned students and applications.', scope: 'ASSIGNED', actions: AGENT },
    { name: 'Counselor', desc: 'Views and edits assigned records.', scope: 'ASSIGNED', actions: AGENT },
    { name: 'Student', desc: 'Views own profile and application status.', scope: 'OWN', actions: VIEW },
];

async function main() {
    console.log('Seeding system roles...');
    for (const r of ROLES) {
        const role = await prisma.userRole.upsert({
            where: { name: r.name },
            update: { description: r.desc, isSystem: true, isActive: true },
            create: { name: r.name, description: r.desc, isSystem: true, isActive: true },
        });

        for (const m of MODULES) {
            await prisma.rolePermission.upsert({
                where: { roleId_module: { roleId: role.id, module: m } },
                update: { actions: r.actions, scope: r.scope },
                create: { roleId: role.id, module: m, actions: r.actions, scope: r.scope },
            });
        }

        console.log('Seeded:', r.name, '(id:', role.id + ')');
    }

    console.log('Done!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
