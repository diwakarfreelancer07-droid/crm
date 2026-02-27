import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const followUps = await prisma.followUp.findMany({
            where: { leadId: id },
            include: { user: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(followUps);
    } catch (error) {
        console.error("[FOLLOW_UPS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = (await getServerSession(authOptions)) as any;
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { type, status, nextFollowUpAt, remark } = await req.json();

        const followUp = await prisma.followUp.create({
            data: {
                leadId: id,
                userId: session.user.id,
                type,
                status,
                nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : null,
                remark,
            },
        });

        // Also log this as an activity
        await prisma.leadActivity.create({
            data: {
                leadId: id,
                userId: session.user.id,
                type: type,
                content: `Follow-up (${type}) logged. Status: ${status}. ${remark || ""}`,
            },
        });

        return NextResponse.json(followUp);
    } catch (error) {
        console.error("[FOLLOW_UPS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
