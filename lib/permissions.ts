import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export const PERMISSION_MODULES = [
    "LEADS",
    "STUDENTS",
    "APPLICATIONS",
    "VISA",
    "MASTERS",
    "ROLES"
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export const PERMISSION_ACTIONS = [
    "VIEW",
    "CREATE",
    "EDIT",
    "DELETE",
    "DOWNLOAD",
    "PRINT",
    "APPROVE"
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const PERMISSION_SCOPES = [
    "ALL",
    "OWN",
    "ASSIGNED"
] as const;

export type PermissionScope = (typeof PERMISSION_SCOPES)[number];

export interface PermissionCheck {
    hasPermission: boolean;
    scope: PermissionScope;
    user?: any;
}

/**
 * Check if a user has specific permission for a module.
 * Super Admin bypasses all checks.
 */
export async function checkPermission(
    userId: string,
    module: PermissionModule,
    action: PermissionAction
): Promise<PermissionCheck> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                roleProfile: {
                    include: {
                        permissions: {
                            where: { module }
                        }
                    }
                }
            }
        });

        if (!user) {
            return { hasPermission: false, scope: "OWN" };
        }

        // Super Admin and Admin bypass all checks
        if (user.role === "ADMIN") {
            return { hasPermission: true, scope: "ALL", user };
        }

        // Role-enum based fallbacks when no roleProfile is assigned
        // This ensures users with a known role enum can always operate correctly
        const ROLE_DEFAULTS: Record<string, { actions: string[]; scope: PermissionScope }> = {
            MANAGER: { actions: ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "DOWNLOAD"], scope: "ALL" },
            AGENT: { actions: ["VIEW", "CREATE", "EDIT"], scope: "ASSIGNED" },
            COUNSELOR: { actions: ["VIEW", "CREATE", "EDIT"], scope: "ASSIGNED" },
            SALES_REP: { actions: ["VIEW", "CREATE", "EDIT"], scope: "ASSIGNED" },
            SUPPORT_AGENT: { actions: ["VIEW", "CREATE", "EDIT"], scope: "ASSIGNED" },
            EMPLOYEE: { actions: ["VIEW", "CREATE", "EDIT"], scope: "OWN" },
            STUDENT: { actions: ["VIEW"], scope: "OWN" },
        };

        // If user has a roleProfile, use it (fine-grained permissions)
        if (user.roleProfile && user.roleProfile.isActive) {
            const modulePermission = user.roleProfile.permissions[0];
            if (!modulePermission) {
                // Fall through to role enum defaults below
            } else if (modulePermission.actions.includes(action)) {
                return {
                    hasPermission: true,
                    scope: modulePermission.scope as PermissionScope,
                    user
                };
            } else {
                return { hasPermission: false, scope: "OWN", user };
            }
        }

        // Fallback: use role-enum defaults
        const roleDefault = ROLE_DEFAULTS[user.role];
        if (roleDefault && roleDefault.actions.includes(action)) {
            return { hasPermission: true, scope: roleDefault.scope, user };
        }

        return { hasPermission: false, scope: "OWN", user };
    } catch (error) {
        console.error("checkPermission error:", error);
        return { hasPermission: false, scope: "OWN" };
    }
}

/**
 * Wrapper for API handlers to enforce permissions.
 */
export function withPermission(
    module: PermissionModule,
    action: PermissionAction,
    handler: (req: Request, context: { params: any; permission: PermissionCheck }) => Promise<Response>
) {
    return async (req: Request, context: any) => {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const permission = await checkPermission(session.user.id, module, action);
        if (!permission.hasPermission) {
            return NextResponse.json({ error: `Forbidden: Missing ${action} permission for ${module}` }, { status: 403 });
        }

        return handler(req, { ...context, permission });
    };
}
