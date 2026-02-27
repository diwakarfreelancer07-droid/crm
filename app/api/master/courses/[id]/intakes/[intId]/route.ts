import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditLogService } from "@/lib/auditLog";

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string, intId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const intake = await prisma.courseIntake.findUnique({
            where: { id: params.intId },
        });

        if (!intake) {
            return NextResponse.json({ message: "Intake not found" }, { status: 404 });
        }

        await prisma.courseIntake.delete({
            where: { id: params.intId },
        });

        await AuditLogService.log({
            userId: session.user.id,
            action: "UPDATED",
            module: "MASTERS",
            entity: "Course",
            entityId: params.id,
            metadata: { intakeMonth: intake.month, action: "REMOVE_INTAKE" },
        });

        return NextResponse.json({ message: "Intake removed successfully" });
    } catch (error) {
        console.error("Error removing intake:", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
