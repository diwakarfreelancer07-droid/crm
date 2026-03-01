import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/roles/[id]/users - List users assigned to this role
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user || !["ADMIN"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const users = await prisma.user.findMany({
            where: { roleId: id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                imageUrl: true,
                createdAt: true,
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching role users:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

// POST /api/roles/[id]/users - Assign user to this role
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        const role = await prisma.userRole.findUnique({ where: { id } });
        if (!role) {
            return NextResponse.json({ error: "Role not found" }, { status: 404 });
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { roleId: id },
            select: { id: true, name: true, email: true, role: true, roleId: true },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error assigning user to role:", error);
        return NextResponse.json({ error: "Failed to assign user" }, { status: 500 });
    }
}

// DELETE /api/roles/[id]/users - Remove user from role
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
        const { userId } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        const updated = await prisma.user.update({
            where: { id: userId, roleId: id },
            data: { roleId: null },
            select: { id: true, name: true },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error removing user from role:", error);
        return NextResponse.json({ error: "Failed to remove user" }, { status: 500 });
    }
}
