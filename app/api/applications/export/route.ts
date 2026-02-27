import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status");

        const where: any = {};
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { student: { name: { contains: search, mode: "insensitive" } } },
                { university: { name: { contains: search, mode: "insensitive" } } },
                { intendedCourse: { contains: search, mode: "insensitive" } },
            ];
        }

        const applications = await prisma.universityApplication.findMany({
            where,
            include: {
                student: true,
                university: true,
                country: true,
                course: true,
                assignedBy: true,
                assignedTo: true,
            },
            orderBy: { createdAt: "desc" },
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Applications");

        worksheet.columns = [
            { header: "ID", key: "id", width: 15 },
            { header: "Created", key: "createdAt", width: 20 },
            { header: "Student ID", key: "studentIdValue", width: 20 },
            { header: "Student Name", key: "studentName", width: 25 },
            { header: "Email", key: "email", width: 30 },
            { header: "Mobile", key: "phone", width: 20 },
            { header: "University", key: "university", width: 30 },
            { header: "Country", key: "country", width: 15 },
            { header: "Course", key: "course", width: 30 },
            { header: "Intake", key: "intake", width: 15 },
            { header: "Apply Level", key: "applyLevel", width: 20 },
            { header: "Status", key: "status", width: 15 },
            { header: "Assigned To", key: "assignedTo", width: 20 },
            { header: "Assigned By", key: "assignedBy", width: 20 },
        ];

        applications.forEach(app => {
            worksheet.addRow({
                id: app.id,
                createdAt: app.createdAt.toLocaleString(),
                studentIdValue: app.student.passportNo || "N/A",
                studentName: app.student.name,
                email: app.student.email,
                phone: app.student.phone,
                university: app.university.name,
                country: app.country.name,
                course: app.course?.name || app.intendedCourse || "N/A",
                intake: app.intake,
                applyLevel: app.applyLevel,
                status: app.status,
                assignedTo: app.assignedTo?.name || "Unassigned",
                assignedBy: app.assignedBy?.name || "System",
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();

        return new Response(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="applications_export_${new Date().toISOString()}.xlsx"`,
            },
        });
    } catch (error) {
        console.error("Error exporting applications:", error);
        return NextResponse.json({ error: "Failed to export applications" }, { status: 500 });
    }
}
