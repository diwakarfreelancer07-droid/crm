import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { courseSchema } from "@/lib/validations/course";
import { AuditLogService } from "@/lib/auditLog";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const countryId = searchParams.get("countryId");
        const universityId = searchParams.get("universityId");
        const courseId = searchParams.get("courseId"); // Filter by specific course if needed (though name list is more common)
        const search = searchParams.get("search");
        const sortBy = searchParams.get("sortBy") || "createdAt";
        const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

        const skip = (page - 1) * limit;

        const where: any = {};

        if (countryId) where.countryId = countryId;
        if (universityId) where.universityId = universityId;
        if (courseId) where.id = courseId;

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { campus: { contains: search, mode: 'insensitive' } },
                { university: { name: { contains: search, mode: 'insensitive' } } },
                { country: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    university: { select: { name: true } },
                    country: { select: { name: true } },
                    intakes: true,
                },
            }),
            prisma.course.count({ where }),
        ]);

        return NextResponse.json({
            courses,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Error fetching courses:", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validatedData = courseSchema.parse(body);

        const { intakes, ...courseData } = validatedData;

        // Create course and intakes in a transaction
        const course = await prisma.$transaction(async (tx) => {
            const newCourse = await tx.course.create({
                data: {
                    ...courseData,
                    scores: courseData.scores as any, // Cast for Json field
                    intakes: intakes ? {
                        create: intakes.map(month => ({ month }))
                    } : undefined
                },
                include: {
                    university: { select: { name: true } },
                    country: { select: { name: true } },
                    intakes: true,
                }
            });

            await AuditLogService.log({
                userId: session.user.id,
                action: "CREATED",
                module: "MASTERS",
                entity: "Course",
                entityId: newCourse.id,
                newValues: newCourse,
                metadata: { universityId: newCourse.universityId, countryId: newCourse.countryId }
            });

            return newCourse;
        });

        return NextResponse.json(course, { status: 201 });
    } catch (error: any) {
        console.error("Error creating course:", error);
        if (error.name === "ZodError") {
            return NextResponse.json({ message: "Validation Error", errors: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
