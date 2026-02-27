import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/applications/whatsapp - Send whatsapp activity log (actual sending usually via client)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { students, message } = body; // students is array of {id, phone, leadId}

        if (!students || !Array.isArray(students) || !message) {
            return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
        }

        // Log whatsapp activity for each student (if they have a leadId)
        for (const student of students) {
            if (student.leadId) {
                await prisma.leadActivity.create({
                    data: {
                        leadId: student.leadId,
                        userId: session.user.id,
                        type: "WHATSAPP",
                        content: `WhatsApp message sent: ${message.substring(0, 100)}...`,
                    }
                });
            }
        }

        return NextResponse.json({ message: "WhatsApp activities logged" });
    } catch (error) {
        console.error("Error logging whatsapp activities:", error);
        return NextResponse.json({ error: "Failed to log whatsapp activities" }, { status: 500 });
    }
}
