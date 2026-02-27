import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogService } from "@/lib/auditLog";

// POST /api/applications/:id/assign - Assign application to a user
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
        const { assignedToId } = body;

        if (!assignedToId) {
            return NextResponse.json({ error: "Assigned To ID is required" }, { status: 400 });
        }

        const existing = await prisma.universityApplication.findUnique({
            where: { id },
            include: { student: true }
        });

        if (!existing) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        const updated = await prisma.universityApplication.update({
            where: { id },
            data: {
                assignedToId,
                assignedById: session.user.id
            },
            include: {
                assignedTo: { select: { name: true } },
                assignedBy: { select: { name: true } }
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
                action: "LEAD_ASSIGNED", // User specifically asked for this action name in Step 5
                assignedTo: updated.assignedTo?.name,
                assignedBy: updated.assignedBy?.name
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error assigning application:", error);
        return NextResponse.json({ error: "Failed to assign application" }, { status: 500 });
    }
}
