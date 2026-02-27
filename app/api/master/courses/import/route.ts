import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { AuditLogService } from "@/lib/auditLog";

// GET handler to download the import template
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Template");

        worksheet.columns = [
            { header: "Country*", key: "country", width: 20 },
            { header: "University*", key: "university", width: 30 },
            { header: "Course Name*", key: "name", width: 40 },
            { header: "Campus", key: "campus", width: 20 },
            { header: "Level", key: "level", width: 15 },
            { header: "Duration (Months)", key: "duration", width: 15 },
            { header: "Intakes (comma separated)", key: "intakes", width: 30 },
            { header: "Application Fee", key: "appFee", width: 20 },
            { header: "Tuition Fee", key: "tuitionFee", width: 20 },
            { header: "Expected Commission", key: "commission", width: 20 },
            { header: "GPA Score", key: "gpa", width: 10 },
            { header: "Deadline", key: "deadline", width: 30 },
            { header: "Entry Requirements", key: "requirements", width: 50 },
            { header: "Scores JSON (Optional)", key: "scores", width: 30 },
        ];

        // Add help/sample row
        worksheet.addRow({
            country: "Australia",
            university: "Deakin University",
            name: "Master of Data Science",
            campus: "Melbourne",
            level: "Master",
            duration: 24,
            intakes: "Feb-2026, Jul-2026",
            appFee: "AUD 100",
            tuitionFee: "AUD 35000",
            commission: "15%",
            gpa: 3.0,
            deadline: "30-Nov-2025",
            requirements: "IELTS 6.5, Bachelor in CS",
            scores: '[{"exam":"IELTS","overall":6.5,"subscores":6.0}]'
        });

        worksheet.getRow(1).font = { bold: true };

        const buffer = await workbook.xlsx.writeBuffer();

        return new Response(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": 'attachment; filename="course-import-template.xlsx"',
            },
        });
    } catch (error) {
        console.error("Error generating template:", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}

// POST handler to process import (can be used for both preview and confirm)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const confirm = formData.get("confirm") === "true";

        if (!file) {
            return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer()) as any;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];

        const rows: any[] = [];
        const errors: any[] = [];

        // Fetch all countries and universities for lookup to minimize DB hits
        const countries = await prisma.country.findMany();
        const universities = await prisma.university.findMany();

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const countryName = row.getCell(1).text?.trim();
            const universityName = row.getCell(2).text?.trim();
            const courseName = row.getCell(3).text?.trim();

            // Skip empty rows at the end, but validate middle rows
            if (!countryName && !universityName && !courseName) {
                return;
            }

            const country = countries.find(c => c.name.toLowerCase() === countryName.toLowerCase());
            const university = universities.find(u => u.name.toLowerCase() === universityName.toLowerCase());

            if (!country) {
                errors.push({ row: rowNumber, message: `Country "${countryName}" not found` });
                return;
            }
            if (!university) {
                errors.push({ row: rowNumber, message: `University "${universityName}" not found` });
                return;
            }
            if (university.countryId !== country.id) {
                errors.push({ row: rowNumber, message: `University "${universityName}" does not belong to country "${countryName}"` });
                return;
            }

            const duration = parseInt(row.getCell(6).text);
            const gpa = parseFloat(row.getCell(11).text);
            const intakesStr = row.getCell(7).text;
            const intakes = intakesStr ? intakesStr.split(",").map(i => i.trim()) : [];

            let scores = null;
            try {
                const scoresStr = row.getCell(14).text;
                if (scoresStr) scores = JSON.parse(scoresStr);
            } catch (e) {
                // Ignore invalid JSON scores for now or report error
            }

            rows.push({
                rowNumber,
                countryId: country.id,
                universityId: university.id,
                name: courseName,
                campus: row.getCell(4).text || null,
                level: row.getCell(5).text || null,
                durationMonths: isNaN(duration) ? null : duration,
                applicationFee: row.getCell(8).text || null,
                tuitionFee: row.getCell(9).text || null,
                expectedCommission: row.getCell(10).text || null,
                gpaScore: isNaN(gpa) ? null : gpa,
                deadline: row.getCell(12).text || null,
                entryRequirements: row.getCell(13).text || null,
                scores: scores,
                intakes: intakes,
                _display: { country: country.name, university: university.name } // For preview
            });
        });

        if (!confirm) {
            return NextResponse.json({ rows, errors });
        }

        // If confirm=true, proceed to save
        if (errors.length > 0) {
            return NextResponse.json({ message: "Cannot import with errors", errors }, { status: 400 });
        }

        const importedCount = await prisma.$transaction(async (tx) => {
            let count = 0;
            for (const rowData of rows) {
                const { intakes, _display, rowNumber, ...dbData } = rowData;
                await tx.course.create({
                    data: {
                        ...dbData,
                        intakes: {
                            create: intakes.map((month: string) => ({ month }))
                        }
                    }
                });
                count++;
            }
            return count;
        });

        await AuditLogService.log({
            userId: session.user.id,
            action: "CREATED",
            module: "MASTERS",
            entity: "Course",
            entityId: "BULK_IMPORT",
            metadata: { count: importedCount }
        });

        return NextResponse.json({ message: `Successfully imported ${importedCount} courses` });

    } catch (error) {
        console.error("Error importing courses:", error);
        return NextResponse.json({ message: "Internal Error" }, { status: 500 });
    }
}
