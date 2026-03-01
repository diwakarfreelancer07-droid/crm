import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const role = await prisma.userRole.findUnique({
            where: { id },
            include: {
                permissions: {
                    orderBy: { module: "asc" }
                }
            }
        });

        if (!role) {
            return NextResponse.json({ error: "Role not found" }, { status: 404 });
        }

        return NextResponse.json(role);
    } catch (error) {
        console.error("Error fetching role:", error);
        return NextResponse.json({ error: "Failed to fetch role" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { name, description, isActive, permissions } = body;

        const role = await prisma.userRole.findUnique({ where: { id } });
        if (!role) {
            return NextResponse.json({ error: "Role not found" }, { status: 404 });
        }

        // Prevent deactivating system roles if critical
        if (role.isSystem && isActive === false) {
            // Optional: allow but warn, or block
        }

        // Update role and its permissions
        const updatedRole = await prisma.userRole.update({
            where: { id },
            data: {
                name,
                description,
                isActive,
                permissions: permissions ? {
                    upsert: permissions.map((p: any) => ({
                        where: { roleId_module: { roleId: id, module: p.module } },
                        update: {
                            actions: p.actions,
                            scope: p.scope
                        },
                        create: {
                            module: p.module,
                            actions: p.actions,
                            scope: p.scope
                        }
                    }))
                } : undefined
            },
            include: {
                permissions: true
            }
        });

        return NextResponse.json(updatedRole);
    } catch (error) {
        console.error("Error updating role:", error);
        return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const role = await prisma.userRole.findUnique({
            where: { id },
            include: { _count: { select: { users: true } } }
        });

        if (!role) {
            return NextResponse.json({ error: "Role not found" }, { status: 404 });
        }

        if (role.isSystem) {
            return NextResponse.json({ error: "System roles cannot be deleted" }, { status: 400 });
        }

        if (role._count.users > 0) {
            return NextResponse.json({ error: "Cannot delete role with assigned users" }, { status: 400 });
        }

        await prisma.userRole.delete({ where: { id } });

        return NextResponse.json({ message: "Role deleted successfully" });
    } catch (error) {
        console.error("Error deleting role:", error);
        return NextResponse.json({ error: "Failed to delete role" }, { status: 500 });
    }
}
