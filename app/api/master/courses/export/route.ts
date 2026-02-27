import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const countryId = searchParams.get("countryId");
        const universityId = searchParams.get("universityId");
        const search = searchParams.get("search");

        const where: any = {};
        if (countryId) where.countryId = countryId;
        if (universityId) where.universityId = universityId;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { campus: { contains: search, mode: 'insensitive' } },
                { university: { name: { contains: search, mode: 'insensitive' } } },
                { country: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const courses = await prisma.course.findMany({
            where,
            include: {
                university: { select: { name: true } },
                country: { select: { name: true } },
                intakes: { select: { month: true } },
            },
            orderBy: { name: "asc" },
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Courses");

        worksheet.columns = [
            { header: "ID", key: "id", width: 36 },
            { header: "Country", key: "country", width: 20 },
            { header: "University", key: "university", width: 30 },
            { header: "Course Name", key: "name", width: 40 },
            { header: "Campus", key: "campus", width: 20 },
            { header: "Level", key: "level", width: 15 },
            { header: "Duration (Months)", key: "duration", width: 15 },
            { header: "Intakes", key: "intakes", width: 30 },
            { header: "Application Fee", key: "appFee", width: 20 },
            { header: "Tuition Fee", key: "tuitionFee", width: 20 },
            { header: "Expected Commission", key: "commission", width: 20 },
            { header: "GPA Score", key: "gpa", width: 10 },
            { header: "Deadline", key: "deadline", width: 30 },
            { header: "Entry Requirements", key: "requirements", width: 50 },
            { header: "Scores", key: "scores", width: 30 },
        ];

        // Style the header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFDEEAF6" },
        };

        courses.forEach((course) => {
            const rowData = {
                id: course.id,
                country: course.country.name,
                university: course.university.name,
                name: course.name,
                campus: course.campus || "",
                level: course.level || "",
                duration: course.durationMonths || "",
                intakes: course.intakes.map(i => i.month).join(", "),
                appFee: course.applicationFee || "",
                tuitionFee: course.tuitionFee || "",
                commission: course.expectedCommission || "",
                gpa: course.gpaScore || "",
                deadline: course.deadline || "",
                requirements: course.entryRequirements || "",
                scores: JSON.stringify(course.scores), // Simplified JSON for now
            };
            worksheet.addRow(rowData);
        });

        const buffer = await workbook.xlsx.writeBuffer();

        return new Response(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="courses-export-${new Date().toISOString().split("T")[0]}.xlsx"`,
            },
        });
    } catch (error) {
        console.error("Error exporting courses:", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
