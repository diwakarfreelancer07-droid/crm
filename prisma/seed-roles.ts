import { PrismaClient } from "./generated/client";

const prisma = new PrismaClient();

const PERMISSION_MODULES = [
    "LEADS", "STUDENTS", "APPLICATIONS", "VISA", "MASTERS", "ROLES"
];

const ALL_ACTIONS = ["VIEW", "CREATE", "EDIT", "DELETE", "DOWNLOAD", "APPROVE"];
const VIEW_ONLY = ["VIEW"];
const AGENT_ACTIONS = ["VIEW", "CREATE", "EDIT"];

const SYSTEM_ROLES = [
    {
        name: "Super Admin",
        description: "Full unrestricted access to all modules and settings.",
        isSystem: true,
        defaultScope: "ALL",
        defaultActions: ALL_ACTIONS,
    },
    {
        name: "Admin",
        description: "Manages all CRM data, users, and settings.",
        isSystem: true,
        defaultScope: "ALL",
        defaultActions: ALL_ACTIONS,
    },
    {
        name: "Agent",
        description: "Manages own assigned students and applications.",
        isSystem: true,
        defaultScope: "ASSIGNED",
        defaultActions: AGENT_ACTIONS,
    },
    {
        name: "Counselor",
        description: "Views and edits records assigned to them.",
        isSystem: true,
        defaultScope: "ASSIGNED",
        defaultActions: AGENT_ACTIONS,
    },
    {
        name: "Student",
        description: "Views only their own profile and application status.",
        isSystem: true,
        defaultScope: "OWN",
        defaultActions: VIEW_ONLY,
    },
];

async function main() {
    console.log("Seeding system roles...");

    for (const roleData of SYSTEM_ROLES) {
        const role = await prisma.userRole.upsert({
            where: { name: roleData.name },
            update: {
                description: roleData.description,
                isSystem: true,
                isActive: true,
            },
            create: {
                name: roleData.name,
                description: roleData.description,
                isSystem: true,
                isActive: true,
            },
        });

        // Upsert permissions for each module
        for (const module of PERMISSION_MODULES) {
            await prisma.rolePermission.upsert({
                where: { roleId_module: { roleId: role.id, module } },
                update: {
                    actions: roleData.defaultActions,
                    scope: roleData.defaultScope,
                },
                create: {
                    roleId: role.id,
                    module,
                    actions: roleData.defaultActions,
                    scope: roleData.defaultScope,
                },
            });
        }

        console.log(`✓ Seeded role: ${roleData.name}`);
    }

    console.log("✅ Done seeding system roles.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
