import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { intakeSchema } from "@/lib/validations/course";
import { AuditLogService } from "@/lib/auditLog";

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validatedData = intakeSchema.parse(body);

        const course = await prisma.course.findUnique({ where: { id: params.id } });
        if (!course) {
            return NextResponse.json({ message: "Course not found" }, { status: 404 });
        }

        const intake = await prisma.courseIntake.create({
            data: {
                courseId: params.id,
                month: validatedData.month,
            },
        });

        await AuditLogService.log({
            userId: session.user.id,
            action: "UPDATED",
            module: "MASTERS",
            entity: "Course",
            entityId: params.id,
            metadata: { intakeMonth: validatedData.month, action: "ADD_INTAKE" },
        });

        return NextResponse.json(intake, { status: 201 });
    } catch (error: any) {
        console.error("Error adding intake:", error);
        if (error.name === "ZodError") {
            return NextResponse.json({ message: "Validation Error", errors: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
