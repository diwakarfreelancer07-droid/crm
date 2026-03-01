import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { withPermission } from "@/lib/permissions";

export const dynamic = 'force-dynamic';

// GET /api/students - List all students with filters
export const GET = withPermission('STUDENTS', 'VIEW', async (req, { permission }) => {
    try {
        const { user: sessionUser, scope } = permission;
        const session = { user: sessionUser };

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const where: any = {
            applications: {
                none: {}
            }
        };
        const userRole = (session as any).user.role;

        // RBAC: Dynamic scope-based visibility
        if (scope === 'OWN' || scope === 'ASSIGNED') {
            const onboardedByIds = [session.user.id];

            if (session.user.role === 'AGENT') {
                const agent = await prisma.agentProfile.findUnique({
                    where: { userId: session.user.id }
                });
                if (agent) {
                    const subordinates = await prisma.counselorProfile.findMany({
                        where: { agentId: agent.id },
                        select: { userId: true }
                    });
                    onboardedByIds.push(...subordinates.map(s => s.userId));
                }
            }

            where.onboardedBy = { in: onboardedByIds };
        }

        const includeConverted = searchParams.get("includeConverted") === "true";

        // Search by name, email, or phone
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
            ];
        }

        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where,
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                    lead: {
                        select: {
                            source: true,
                            temperature: true,
                            interestedCountry: true,
                        },
                    },
                    _count: {
                        select: {
                            applications: true
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.student.count({ where }),
        ]);

        return NextResponse.json({
            students,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching students:", error);
        return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
    }
});

// POST /api/students - Create new student (manual entry)
export const POST = withPermission('STUDENTS', 'CREATE', async (req, { permission }) => {
    try {
        const { user: sessionUser } = permission;
        const session = { user: sessionUser };

        // Verify session user exists in DB (to prevent FK errors if session is from before DB reset)
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!currentUser) {
            return NextResponse.json({
                error: "Your session is invalid (likely due to a database reset). Please log out and log back in."
            }, { status: 403 });
        }

        const body = await req.json();
        const {
            firstName, lastName, email, phone, alternateNo,
            dateOfBirth, gender, nationality, maritalStatus,
            address, highestQualification, interestedCourse,
            testName, testScore, interestedCountry, intake,
            applyLevel, source, remark, message, imageUrl,
            followUp, appointment,
            passportNo, passportIssueDate, passportExpiryDate,
            academicDetails, workExperience, proficiencyExams,
            status: leadStatus
        } = body;

        // name is still required in the schema for now, let's derive it
        const name = body.name || `${firstName || ""} ${lastName || ""}`.trim() || phone;

        if (!name || !phone) {
            return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
        }

        // Generate a dummy password: Student@${last4}
        const last4 = phone.replace(/\D/g, "").slice(-4) || "0000";
        const tempPassword = `Student@${last4}`;
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        // Build a unique login email — use student's email or generate one
        let loginEmail = email;
        if (!loginEmail) {
            const slug = name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");
            loginEmail = `${slug}.${last4}@student.intered.app`;
        }

        // Ensure the email is not already taken
        const existingUser = await prisma.user.findUnique({ where: { email: loginEmail } });
        if (existingUser) {
            return NextResponse.json(
                { error: `A user with email ${loginEmail} already exists. Please provide a unique email.` },
                { status: 400 }
            );
        }

        // Create user, lead, and student records atomically
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create User
            const newUser = await tx.user.create({
                data: {
                    name,
                    email: loginEmail,
                    passwordHash,
                    role: "STUDENT",
                    isActive: true,
                    emailVerified: new Date(),
                },
            });

            // 2. Create Lead
            const lead = await tx.lead.create({
                data: {
                    name,
                    firstName,
                    lastName,
                    email: loginEmail,
                    phone,
                    alternateNo,
                    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                    gender,
                    nationality,
                    maritalStatus,
                    address,
                    highestQualification,
                    interestedCourse,
                    testName,
                    testScore,
                    interestedCountry,
                    intake,
                    applyLevel,
                    message,
                    source,
                    remark,
                    imageUrl,
                    userId: newUser.id,
                    passportNo,
                    passportIssueDate: passportIssueDate ? new Date(passportIssueDate) : null,
                    passportExpiryDate: passportExpiryDate ? new Date(passportExpiryDate) : null,
                    academicDetails: (academicDetails && Array.isArray(academicDetails)) ? {
                        create: academicDetails.filter((d: any) => d.qualification).map((detail: any) => ({
                            qualification: detail.qualification,
                            stream: detail.stream,
                            institution: detail.institution,
                            percentage: detail.percentage,
                            backlogs: detail.backlogs,
                            passingYear: detail.passingYear
                        }))
                    } : undefined,
                    workExperience: (workExperience && Array.isArray(workExperience)) ? {
                        create: workExperience.filter((e: any) => e.companyName).map((exp: any) => ({
                            companyName: exp.companyName,
                            position: exp.position,
                            startDate: exp.startDate,
                            endDate: exp.endDate,
                            totalExperience: exp.totalExperience
                        }))
                    } : undefined,
                    proficiencyExams: proficiencyExams || undefined,
                    status: (leadStatus as any) || 'NEW'
                },
            });

            // 3. Create Student
            const student = await tx.student.create({
                data: {
                    name,
                    email: loginEmail,
                    phone,
                    status: "NEW",
                    leadId: lead.id,
                    onboardedBy: session.user.id,
                    imageUrl,
                    studentUserId: newUser.id,
                    passportNo,
                    passportIssueDate: passportIssueDate ? new Date(passportIssueDate) : null,
                    passportExpiryDate: passportExpiryDate ? new Date(passportExpiryDate) : null,
                },
                include: {
                    user: { select: { name: true, email: true } },
                },
            });

            return { newUser, lead, student };
        });

        const { newUser, lead, student } = result;

        // Send welcome email with credentials (non-blocking — don't fail if email fails)
        try {
            const { sendStudentWelcomeEmail } = await import("@/lib/mail");
            const loginUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`;
            await sendStudentWelcomeEmail(loginEmail, name, tempPassword, loginUrl);
        } catch (mailError) {
            console.warn("Welcome email failed (non-fatal):", mailError);
        }

        return NextResponse.json(
            { ...student, studentLoginEmail: loginEmail, studentUserId: newUser.id },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating student:", error);
        return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
    }
});

