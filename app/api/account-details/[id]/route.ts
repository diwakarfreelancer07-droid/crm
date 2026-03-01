import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await prisma.accountDetail.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Deleted successfully" });
    } catch (error) {
        console.error("Error deleting account detail:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
