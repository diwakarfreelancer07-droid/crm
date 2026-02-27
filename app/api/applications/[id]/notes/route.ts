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

        const notes = await prisma.applicationNote.findMany({
            where: { applicationId: id },
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
        const { note } = body;

        if (!note) {
            return NextResponse.json({ error: "Note content is required" }, { status: 400 });
        }

        const newNote = await prisma.applicationNote.create({
            data: {
                applicationId: id,
                userId: session.user.id,
                note
            },
            include: {
                user: { select: { name: true } }
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
                action: "NOTE_ADDED",
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
