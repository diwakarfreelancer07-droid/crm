import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const appointments = await prisma.appointment.findMany({
            where: { leadId: id },
            include: { user: { select: { name: true } } },
            orderBy: { startTime: "asc" },
        });

        return NextResponse.json(appointments);
    } catch (error) {
        console.error("[APPOINTMENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = (await getServerSession(authOptions)) as any;
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { title, description, startTime, endTime, status, location } = await req.json();

        const appointment = await prisma.appointment.create({
            data: {
                leadId: id,
                userId: session.user.id,
                title,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                status,
                location,
            },
        });

        // Also log this as an activity
        await prisma.leadActivity.create({
            data: {
                leadId: id,
                userId: session.user.id,
                type: "APPOINTMENT",
                content: `Appointment scheduled: ${title} at ${new Date(startTime).toLocaleString()}`,
            },
        });

        return NextResponse.json(appointment);
    } catch (error) {
        console.error("[APPOINTMENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
