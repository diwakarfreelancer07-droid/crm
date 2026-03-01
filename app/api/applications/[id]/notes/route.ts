import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogService } from "@/lib/auditLog";

// GET /api/applications/:id/notes - Get notes for an application
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');

        const notes = await prisma.applicationNote.findMany({
            where: {
                applicationId: id,
                ...(type ? { type: type as any } : {})
            },
            include: {
                user: { select: { name: true, role: true, imageUrl: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(notes);
    } catch (error) {
        console.error("Error fetching application notes:", error);
        return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
    }
}

// POST /api/applications/:id/notes - Add note to an application
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { note, attachmentUrl, attachmentName, type } = body;

        if (!note && !attachmentUrl) {
            return NextResponse.json({ error: "Note content or attachment is required" }, { status: 400 });
        }

        const newNote = await prisma.applicationNote.create({
            data: {
                applicationId: id,
                userId: session.user.id,
                note: note || "",
                attachmentUrl,
                attachmentName,
                type: type || "COMMENT"
            },
            include: {
                user: { select: { name: true, role: true } }
            }
        });

        // Audit Logging
        await AuditLogService.log({
            userId: session.user.id,
            action: "UPDATED",
            module: "APPLICATIONS",
            entity: "UniversityApplication",
            entityId: id,
            metadata: {
                action: type === "OFFER_LETTER" ? "OFFER_LETTER_ADDED" : "NOTE_ADDED",
                note,
                addedBy: newNote.user.name
            }
        });

        return NextResponse.json(newNote, { status: 201 });
    } catch (error) {
        console.error("Error adding application note:", error);
        return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
    }
}
