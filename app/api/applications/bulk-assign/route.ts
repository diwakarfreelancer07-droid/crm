import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogService } from "@/lib/auditLog";

// POST /api/applications/bulk-assign - Bulk assign applications
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { ids, assignedToId } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0 || !assignedToId) {
            return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
        }

        await prisma.universityApplication.updateMany({
            where: { id: { in: ids } },
            data: {
                assignedToId,
                assignedById: session.user.id
            }
        });

        // Audit Logging (Log for each)
        // Optimization: we could do it in one or many. The user asked for AuditLog per app in Step 5 context.
        const apps = await prisma.universityApplication.findMany({
            where: { id: { in: ids } },
            include: {
                assignedTo: { select: { name: true } },
                assignedBy: { select: { name: true } }
            }
        });

        for (const app of apps) {
            await AuditLogService.log({
                userId: session.user.id,
                action: "UPDATED",
                module: "APPLICATIONS",
                entity: "UniversityApplication",
                entityId: app.id,
                metadata: {
                    action: "LEAD_ASSIGNED",
                    assignedTo: app.assignedTo?.name,
                    assignedBy: app.assignedBy?.name
                }
            });
        }

        return NextResponse.json({ message: `${ids.length} applications assigned successfully` });
    } catch (error) {
        console.error("Error bulk assigning applications:", error);
        return NextResponse.json({ error: "Failed to bulk assign applications" }, { status: 500 });
    }
}
