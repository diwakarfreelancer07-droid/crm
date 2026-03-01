import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/students/[id] - Get student details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const student = await prisma.student.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
                lead: {
                    include: {
                        activities: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                            orderBy: { createdAt: "desc" },
                            take: 20,
                        },
                        documents: true,
                        tasks: {
                            include: {
                                reminders: true,
                            },
                        },
                        academicDetails: true,
                        workExperience: true,
                    },
                },
                applications: {
                    include: {
                        country: { select: { id: true, name: true } },
                        university: { select: { id: true, name: true } },
                        course: { select: { id: true, name: true } },
                    },
                    orderBy: { createdAt: 'desc' }
                },
                visaApplications: {
                    include: {
                        country: { select: { id: true, name: true } },
                        university: { select: { id: true, name: true } },
                    },
                    orderBy: { createdAt: 'desc' }
                }
            },
        });

        if (!student) {
            return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }

        return NextResponse.json(student);
    } catch (error) {
        console.error("Error fetching student:", error);
        return NextResponse.json({ error: "Failed to fetch student" }, { status: 500 });
    }
}

// PATCH /api/students/[id] - Update student
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { name, email, phone, status } = body;

        const student = await prisma.student.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(email !== undefined && { email }),
                ...(phone && { phone }),
                ...(status && { status }),
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json(student);
    } catch (error) {
        console.error("Error updating student:", error);
        return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
    }
}

// DELETE /api/students/[id] - Delete student (Admin only)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admins can delete students
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;

        await prisma.student.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Student deleted successfully" });
    } catch (error) {
        console.error("Error deleting student:", error);
        return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
    }
}
