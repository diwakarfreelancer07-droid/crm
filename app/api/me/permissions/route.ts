import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PERMISSION_MODULES, PERMISSION_ACTIONS } from "@/lib/permissions";

/**
 * GET /api/me/permissions
 * Returns the current user's permission map: { module: { action: boolean } }
 * ADMIN always gets full access. Others get permissions from their roleProfile.
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const userRole = session.user.role as string;

        // ADMIN gets everything
        if (userRole === "ADMIN") {
            const allPerms: Record<string, Record<string, boolean>> = {};
            for (const mod of PERMISSION_MODULES) {
                allPerms[mod] = {};
                for (const act of PERMISSION_ACTIONS) {
                    allPerms[mod][act] = true;
                }
            }
            return NextResponse.json({ role: userRole, permissions: allPerms, scope: "ALL" });
        }

        // Fetch user with their role profile permissions
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                roleProfile: {
                    include: {
                        permissions: true
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Role-enum based fallbacks when no roleProfile is assigned
        const ROLE_DEFAULTS: Record<string, { actions: string[]; scope: string }> = {
            MANAGER: { actions: ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "DOWNLOAD"], scope: "ALL" },
            AGENT: { actions: ["VIEW", "CREATE", "EDIT"], scope: "ASSIGNED" },
            COUNSELOR: { actions: ["VIEW", "CREATE", "EDIT"], scope: "ASSIGNED" },
            SALES_REP: { actions: ["VIEW", "CREATE", "EDIT"], scope: "ASSIGNED" },
            SUPPORT_AGENT: { actions: ["VIEW", "CREATE", "EDIT"], scope: "ASSIGNED" },
            EMPLOYEE: { actions: ["VIEW", "CREATE", "EDIT"], scope: "OWN" },
            STUDENT: { actions: ["VIEW"], scope: "OWN" },
        };

        const permMap: Record<string, Record<string, boolean>> = {};
        const scopeMap: Record<string, string> = {};

        for (const mod of PERMISSION_MODULES) {
            permMap[mod] = {};
            for (const act of PERMISSION_ACTIONS) {
                permMap[mod][act] = false;
            }
            scopeMap[mod] = "OWN";
        }

        if (user.roleProfile && user.roleProfile.isActive && user.roleProfile.permissions?.length > 0) {
            // Fine-grained permissions from roleProfile
            for (const perm of user.roleProfile.permissions) {
                const mod = perm.module as string;
                if (permMap[mod]) {
                    for (const act of PERMISSION_ACTIONS) {
                        permMap[mod][act] = (perm.actions as string[]).includes(act);
                    }
                    scopeMap[mod] = perm.scope;
                }
            }
        } else {
            // Fallback: role-enum defaults apply to ALL modules
            const defaults = ROLE_DEFAULTS[userRole];
            if (defaults) {
                for (const mod of PERMISSION_MODULES) {
                    for (const act of PERMISSION_ACTIONS) {
                        permMap[mod][act] = defaults.actions.includes(act);
                    }
                    scopeMap[mod] = defaults.scope;
                }
            }
        }

        return NextResponse.json({
            role: userRole,
            permissions: permMap,
            scopes: scopeMap,
        });
    } catch (error) {
        console.error("Error fetching user permissions:", error);
        return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 });
    }
}
