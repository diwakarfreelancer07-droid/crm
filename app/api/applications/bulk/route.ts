import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogService } from "@/lib/auditLog";

// DELETE /api/applications/bulk - Bulk delete university applications
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // RBAC: Only ADMIN and MANAGER can bulk delete
        if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
            return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
        }

        const body = await req.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "Invalid request: No IDs provided" }, { status: 400 });
        }

        const applications = await prisma.universityApplication.findMany({
            where: { id: { in: ids } }
        });

        await prisma.universityApplication.deleteMany({
            where: { id: { in: ids } }
        });

        // Audit Logging
        for (const app of applications) {
            await AuditLogService.log({
                userId: session.user.id,
                action: "DELETED",
                module: "APPLICATIONS",
                entity: "UniversityApplication",
                entityId: app.id,
                previousValues: app
            });
        }

        return NextResponse.json({ message: `${ids.length} applications deleted successfully` });
    } catch (error) {
        console.error("Error bulk deleting applications:", error);
        return NextResponse.json({ error: "Failed to bulk delete applications" }, { status: 500 });
    }
}
