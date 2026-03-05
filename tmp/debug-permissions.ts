
import { PrismaClient } from "./prisma/generated/client";

const prisma = new PrismaClient();

async function debug() {
    const counselors = await prisma.user.findMany({
        where: { role: 'COUNSELOR' },
        include: {
            roleProfile: {
                include: {
                    permissions: true
                }
            }
        },
        take: 5
    });

    console.log(`Found ${counselors.length} counselors.`);
    for (const user of counselors) {
        console.log(`\nUser: ${user.name} (${user.email})`);
        console.log(`Role: ${user.role}`);
        console.log(`Profile: ${user.roleProfile?.name || 'None'}`);
        console.log(`Profile Active: ${user.roleProfile?.isActive ?? 'N/A'}`);

        const permission = await checkPermissionLocal(user, 'LEADS', 'VIEW');
        console.log(`Result: ${JSON.stringify(permission)}`);
    }
}

async function checkPermissionLocal(user: any, module: string, action: string) {
    if (user.role === "ADMIN") return { has: true, scope: "ALL" };

    const ROLE_DEFAULTS: Record<string, any> = {
        MANAGER: { actions: ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "DOWNLOAD"], scope: "ALL" },
        AGENT: { actions: ["VIEW", "CREATE", "EDIT"], scope: "ASSIGNED" },
        COUNSELOR: { actions: ["VIEW", "CREATE", "EDIT"], scope: "ASSIGNED" },
    };

    if (user.roleProfile && user.roleProfile.isActive) {
        const modulePermission = user.roleProfile.permissions.find((p: any) => p.module === module);
        if (modulePermission) {
            if (modulePermission.actions.includes(action)) {
                return { has: true, scope: modulePermission.scope };
            } else {
                return { has: false, scope: "OWN", reason: "Action not in profile" };
            }
        }
        // Fallback or fail? Current code fallbacks.
    }

    const roleDefault = ROLE_DEFAULTS[user.role];
    if (roleDefault && roleDefault.actions.includes(action)) {
        return { has: true, scope: roleDefault.scope };
    }
    return { has: false, scope: "OWN", reason: "Fallback failed" };
}

debug();
