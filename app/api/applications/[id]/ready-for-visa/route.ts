import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { VisaType, VisaStatus } from "@prisma/client";

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
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

        if (application.status === "READY_FOR_VISA") {
            return NextResponse.json({ error: "Application is already in Visa stage" }, { status: 400 });
        }

        const body = await req.json();
        const { agentId, counselorId, appointmentDate } = body;

        // Update application status
        await prisma.universityApplication.update({
            where: { id },
            data: { status: "READY_FOR_VISA" }
        });

        // Create visa application
        const visaApp = await prisma.visaApplication.create({
            data: {
                studentId: application.studentId,
                universityApplicationId: application.id,
                countryId: application.countryId,
                universityId: application.universityId,
                courseId: application.courseId,
                intake: application.intake,
                visaType: VisaType.STUDENT_VISA,
                status: VisaStatus.PENDING,
                applicationDate: new Date(),
                appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
                assignedOfficerId: agentId || null,
            },
            include: {
                student: true,
                country: true,
                university: true
            }
        });

        // Log Activity
        await prisma.leadActivity.create({
            data: {
                leadId: application.student.leadId || "",
                userId: (session.user as any).id,
                type: "STATUS_CHANGE",
                content: `Application for ${application.universityId || 'institution'} moved to Visa stage. Assigned to Agent: ${agentId}`,
            }
        });

        return NextResponse.json(visaApp);
    } catch (error: any) {
        console.error("Error promoting to visa:", error);
        return NextResponse.json({ error: "Failed to promote to visa", details: error.message }, { status: 500 });
    }
}
