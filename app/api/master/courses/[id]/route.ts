import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { courseSchema } from "@/lib/validations/course";
import { AuditLogService } from "@/lib/auditLog";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                university: { select: { name: true } },
                country: { select: { name: true } },
                intakes: true,
            },
        });

        if (!course) {
            return NextResponse.json({ message: "Course not found" }, { status: 404 });
        }

        return NextResponse.json(course);
    } catch (error) {
        console.error("Error fetching course:", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const validatedData = courseSchema.partial().parse(body);

        const oldCourse = await prisma.course.findUnique({ where: { id } });
        if (!oldCourse) {
            return NextResponse.json({ message: "Course not found" }, { status: 404 });
        }

        const { intakes, ...courseData } = validatedData;

        const updatedCourse = await prisma.course.update({
            where: { id },
            data: {
                ...courseData,
                scores: courseData.scores as any,
                // Note: intakes are managed via separate endpoints as per requirement
            },
            include: {
                university: { select: { name: true } },
                country: { select: { name: true } },
                intakes: true,
            },
        });

        await AuditLogService.log({
            userId: session.user.id,
            action: "UPDATED",
            module: "MASTERS",
            entity: "Course",
            entityId: updatedCourse.id,
            previousValues: oldCourse,
            newValues: updatedCourse,
        });

        return NextResponse.json(updatedCourse);
    } catch (error: any) {
        console.error("Error updating course:", error);
        if (error.name === "ZodError") {
            return NextResponse.json({ message: "Validation Error", errors: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const course = await prisma.course.findUnique({ where: { id } });
        if (!course) {
            return NextResponse.json({ message: "Course not found" }, { status: 404 });
        }

        await prisma.course.delete({ where: { id } });

        await AuditLogService.log({
            userId: session.user.id,
            action: "DELETED",
            module: "MASTERS",
            entity: "Course",
            entityId: id,
            previousValues: course,
        });

        return NextResponse.json({ message: "Course deleted successfully" });
    } catch (error) {
        console.error("Error deleting course:", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
