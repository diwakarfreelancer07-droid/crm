import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogService } from "@/lib/auditLog";

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    console.log("[DEBUG] Hit revert-from-visa API");
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const params = await context.params;
        const { id } = params;

        const application = await prisma.universityApplication.findUnique({
            where: { id },
            include: { student: true }
        });

        if (!application) {
            return NextResponse.json({ error: "Application not found" }, { status: 404 });
        }

        // Update University Application back to READY_FOR_VISA
        const updatedApp = await prisma.universityApplication.update({
            where: { id },
            data: { status: "READY_FOR_VISA" }
        });

        // Find and update the linked Visa Application back to UNDER_REVIEW
        const visaApp = await prisma.visaApplication.findFirst({
            where: { universityApplicationId: id }
        });

        if (visaApp) {
            await prisma.visaApplication.update({
                where: { id: visaApp.id },
                data: { status: "UNDER_REVIEW" as any }
            });
        }

        await AuditLogService.log({
            userId: (session.user as any).id,
            action: "UPDATED",
            module: "APPLICATIONS",
            entity: "UniversityApplication",
            entityId: id,
            previousValues: application,
            newValues: updatedApp,
            metadata: { action: "REVERT_FROM_VISA" }
        });

        return NextResponse.json({ message: "Reverted to Visa stage successfully", application: updatedApp });
    } catch (error) {
        console.error("Error reverting from visa:", error);
        return NextResponse.json({ error: "Failed to revert application" }, { status: 500 });
    }
}
