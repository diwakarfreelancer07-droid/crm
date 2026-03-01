import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PERMISSION_MODULES } from "@/lib/permissions";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const roles = await prisma.userRole.findMany({
            include: {
                _count: {
                    select: { users: true }
                }
            },
            orderBy: { name: "asc" }
        });

        return NextResponse.json(roles);
    } catch (error) {
        console.error("Error fetching roles:", error);
        return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        // Create role with default permissions (empty actions for all modules)
        const role = await prisma.userRole.create({
            data: {
                name,
                description,
                permissions: {
                    create: PERMISSION_MODULES.map(module => ({
                        module,
                        actions: [],
                        scope: "OWN"
                    }))
                }
            },
            include: {
                permissions: true
            }
        });

        return NextResponse.json(role);
    } catch (error: any) {
        console.error("Error creating role:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Role name already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
    }
}
