import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { portalName, username, password, url, notes } = body;

        if (!portalName || !username || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const loginDetail = await prisma.loginDetail.create({
            data: {
                studentId: id,
                portalName,
                username,
                password,
                url,
                notes,
            }
        });

        return NextResponse.json(loginDetail);
    } catch (error) {
        console.error("Error creating login detail:", error);
        return NextResponse.json({ error: "Failed to create login detail" }, { status: 500 });
    }
}
