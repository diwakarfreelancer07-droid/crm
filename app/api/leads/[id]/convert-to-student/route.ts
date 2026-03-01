import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { AuditLogService } from "@/lib/auditLog";
import { notifyLeadConverted } from "@/lib/lifecycle-notifications";
import { sendStudentWelcomeEmail } from "@/lib/mail";

/** Generates a random 6-digit numeric password string, e.g. "482901" */
function generateSixDigitPassword(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(
    req: NextRequest,
    context: any
) {
    console.error(">>> CONVERSION API START");
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user) {
            console.error(">>> CONVERSION API: Unauthorized");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Handle params specifically for Next.js 15
        const params = await context.params;
        const leadId = params?.id;
        console.error(">>> CONVERSION API: leadId =", leadId);

        if (!leadId) {
            console.error(">>> CONVERSION API: Missing leadId");
            return NextResponse.json({ error: "Missing Lead ID" }, { status: 400 });
        }

        const body = await req.json();
        console.error(">>> CONVERSION API: Body received");

        // 1. Fetch the Lead
        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            include: { documents: true }
        });

        if (!lead) {
            console.error(">>> CONVERSION API: Lead not found");
            return NextResponse.json({ error: "Lead not found" }, { status: 404 });
        }

        // 2. Check if already converted from the Lead status perspective
        // If it's already CONVERTED, we can still allow "updating" the conversion info? 
        // Or should we block it? For now, let's block only if it's already fully consistent.
        // But if the user is clicking the button, it means status isn't CONVERTED or they are on a stale page.

        // 3. Prepare Data
        const {
            name, email, phone, alternateNo, dateOfBirth, gender,
            nationality, passportNo, passportIssueDate, passportExpiryDate,
            highestQualification, address, imageUrl,
            agentId: bodyAgentId,
            counselorId: bodyCounselorId,
        } = body;

        const studentName = name || lead.name;
        const studentEmail = email || lead.email;
        const studentPhone = phone || lead.phone;

        if (!studentName || !studentPhone) {
            console.error(">>> CONVERSION API: Missing name/phone");
            return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
        }

        const parseDate = (d: any) => {
            if (!d || d === "") return null;
            const date = new Date(d);
            return isNaN(date.getTime()) ? null : date;
        };

        const result = await prisma.$transaction(async (tx) => {
            let userId = lead.userId;

            // 4. User Account
            if (!userId && studentEmail) {
                // Check if user with this email already exists
                const existingUser = await tx.user.findUnique({ where: { email: studentEmail } });
                if (existingUser) {
                    userId = existingUser.id;
                    await tx.user.update({
                        where: { id: userId },
                        data: { role: "STUDENT" }
                    });
                } else {
                    const last4 = studentPhone.replace(/\D/g, "").slice(-4) || "0000";
                    const passwordHash = await bcrypt.hash(`Student@${last4}`, 10);
                    const newUser = await tx.user.create({
                        data: {
                            name: studentName,
                            email: studentEmail,
                            passwordHash,
                            role: "STUDENT",
                            isActive: true,
                            emailVerified: new Date(),
                            imageUrl: imageUrl || lead.imageUrl
                        },
                    });
                    userId = newUser.id;
                }
            } else if (userId) {
                // Update existing user role to STUDENT
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        role: "STUDENT",
                        name: studentName,
                        email: studentEmail || undefined,
                        imageUrl: imageUrl || undefined
                    }
                });
            }

            // 5. Find or Create Student record
            // Priority 1: Student linked to this specific leadId
            // Priority 2: Student linked to this userId

            let student = await tx.student.findUnique({
                where: { leadId: leadId }
            });

            if (!student && userId) {
                student = await tx.student.findUnique({
                    where: { studentUserId: userId }
                });
            }

            if (student) {
                console.error(">>> CONVERSION API: Student record already exists. Updating.");
                student = await tx.student.update({
                    where: { id: student.id },
                    data: {
                        leadId: leadId,
                        name: studentName,
                        email: studentEmail,
                        phone: studentPhone,
                        passportNo: passportNo || lead.passportNo || undefined,
                        passportIssueDate: parseDate(passportIssueDate) || parseDate(lead.passportIssueDate) || undefined,
                        passportExpiryDate: parseDate(passportExpiryDate) || parseDate(lead.passportExpiryDate) || undefined,
                        ...(bodyAgentId ? { agentId: bodyAgentId } : {}),
                        ...(bodyCounselorId ? { counselorId: bodyCounselorId } : {}),
                    }
                });
            } else {
                // Create New Student
                student = await tx.student.create({
                    data: {
                        name: studentName,
                        email: studentEmail,
                        phone: studentPhone,
                        status: "NEW",
                        leadId: leadId,
                        onboardedBy: session.user.id,
                        imageUrl: imageUrl || lead.imageUrl,
                        studentUserId: userId,
                        passportNo: passportNo || lead.passportNo,
                        passportIssueDate: parseDate(passportIssueDate) || parseDate(lead.passportIssueDate),
                        passportExpiryDate: parseDate(passportExpiryDate) || parseDate(lead.passportExpiryDate),
                        ...(bodyAgentId ? { agentId: bodyAgentId } : {}),
                        ...(bodyCounselorId ? { counselorId: bodyCounselorId } : {}),
                    }
                });
            }

            // 6. Update Lead
            await tx.lead.update({
                where: { id: leadId },
                data: { status: 'CONVERTED', userId: userId }
            });

            // 7. Copy Documents (Avoid duplicates if re-converting)
            if (lead.documents && lead.documents.length > 0) {
                // Check for existing documents to avoid duplicate keys error if any unique constraint exists
                // The schema for StudentDocument doesn't have a unique constraint on studentId/fileName/fileUrl collectively but let's be safe.

                // For now, let's just attempt to create them. If we want to be safe, we could delete existing or skip duplicates.
                // Actually, assuming we want to sync them:
                for (const doc of lead.documents) {
                    const exists = await tx.studentDocument.findFirst({
                        where: {
                            studentId: student.id,
                            fileUrl: doc.fileUrl
                        }
                    });
                    if (!exists) {
                        await tx.studentDocument.create({
                            data: {
                                studentId: student.id,
                                uploadedBy: doc.uploadedBy,
                                fileName: doc.fileName,
                                fileUrl: doc.fileUrl,
                                documentName: doc.type,
                            }
                        });
                    }
                }
            }

            // 8. Log Activity
            await tx.leadActivity.create({
                data: {
                    leadId: leadId,
                    userId: session.user.id,
                    type: "STATUS_CHANGE",
                    content: `Lead converted/synced to Student: ${studentName}`,
                    meta: { studentId: student.id }
                }
            });

            return { student };
        });

        // 9. Audit Log
        if (AuditLogService) {
            await AuditLogService.log({
                userId: session.user.id,
                action: "UPDATED" as any,
                module: "LEADS",
                entity: "Lead",
                entityId: leadId,
                newValues: result.student,
                metadata: { studentId: result.student.id, action: "LEAD_CONVERTED" }
            });
        }

        // 10. Lifecycle Notification (non-blocking)
        notifyLeadConverted(leadId, result.student.id, session.user.id).catch(
            (err) => console.error("[Lifecycle] notifyLeadConverted failed:", err)
        );

        // 11. Generate a fresh 6-digit password, update the student user account, and send welcome email
        if (result.student.studentUserId) {
            try {
                const rawPassword = generateSixDigitPassword();
                const passwordHash = await bcrypt.hash(rawPassword, 10);

                // Update user's password to the newly generated one
                await prisma.user.update({
                    where: { id: result.student.studentUserId },
                    data: { passwordHash },
                });

                const loginEmail = studentEmail || `student+${result.student.id.slice(0, 8)}@intered.app`;
                const loginUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`;

                await sendStudentWelcomeEmail(loginEmail, studentName, rawPassword, loginUrl);
                console.log(`[ConvertToStudent] Welcome email sent to ${loginEmail}`);
            } catch (emailErr) {
                // Non-fatal — log but don't break the API response
                console.warn("[ConvertToStudent] Welcome email failed (non-fatal):", emailErr);
            }
        }

        console.error(">>> CONVERSION API: Success");
        return NextResponse.json({
            studentId: result.student.id,
            message: `${studentName} has been converted/synced successfully`
        }, { status: 201 });

    } catch (error: any) {
        console.error(">>> CONVERSION API ERROR:", error);
        return NextResponse.json({
            error: "Failed to convert lead",
            details: error.message
        }, { status: 500 });
    }
}
