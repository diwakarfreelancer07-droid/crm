import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const associates = await prisma.user.findMany({
            where: {
                role: {
                    in: ["AGENT", "COUNSELOR", "EMPLOYEE", "ADMIN", "MANAGER"]
                },
                isActive: true
            },
            select: {
                id: true,
                name: true,
                role: true
            },
            orderBy: { name: "asc" }
        });

        return NextResponse.json(associates);
    } catch (error) {
        console.error("Error fetching associates:", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
