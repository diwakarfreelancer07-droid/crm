import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');
        const status = searchParams.get('status');
        const source = searchParams.get('source');
        const temperature = searchParams.get('temperature');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status && status !== 'ALL') {
            where.status = status;
        } else {
            // By default, exclude CONVERTED leads from the "All" view to keep active list clean
            where.status = { not: 'CONVERTED' };
        }
        if (source) where.source = source;
        if (temperature) where.temperature = temperature;

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }

        // RBAC: Employee/Agent/Counselor visibility
        if (session.user.role === 'EMPLOYEE' || session.user.role === 'AGENT' || session.user.role === 'COUNSELOR' || session.user.role === 'SALES_REP' || session.user.role === 'SUPPORT_AGENT') {
            const assignedToIds = [session.user.id];

            // For AGENT, also include leads assigned to their subordinates
            if (session.user.role === 'AGENT') {
                const agent = await prisma.agentProfile.findUnique({
                    where: { userId: session.user.id }
                });
                if (agent) {
                    const subordinates = await prisma.counselorProfile.findMany({
                        where: { agentId: agent.id },
                        select: { userId: true }
                    });
                    assignedToIds.push(...subordinates.map(s => s.userId));
                }
            }

            where.assignments = {
                some: {
                    assignedTo: { in: assignedToIds }
                }
            };
        }

        const [leads, total] = await Promise.all([
            prisma.lead.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    assignments: {
                        include: {
                            employee: {
                                select: { name: true, email: true }
                            }
                        }
                    }
                }
            }),
            prisma.lead.count({ where })
        ]);

        return NextResponse.json({
            leads,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Fetch leads error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        const {
            firstName, lastName, email, phone, alternateNo,
            dateOfBirth, gender, nationality, maritalStatus,
            address, highestQualification, interestedCourse,
            testName, testScore, interestedCountry, intake,
            applyLevel, source, remark, message, imageUrl,
            followUp, appointment,
            passportNo, passportIssueDate, passportExpiryDate,
            academicDetails, workExperience, proficiencyExams
        } = data;

        // name is still required in the schema for now, let's derive it
        const name = data.name || `${firstName || ""} ${lastName || ""}`.trim() || phone;

        if (!name || !phone || !source) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Check for duplicate lead (by phone OR email)
        const existingLead = await prisma.lead.findFirst({
            where: {
                OR: [
                    { phone: phone },
                    ...(email ? [{ email: email }] : []),
                ],
            },
        });

        if (existingLead) {
            return NextResponse.json({
                message: 'A lead with this phone number or email already exists.'
            }, { status: 400 });
        }

        // Generate random password
        const password = Math.random().toString(36).slice(-8);
        const passwordHash = await import('bcryptjs').then(bcrypt => bcrypt.hash(password, 10));

        // Create User (Student) and Lead in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create User
            let user;
            // Only create user if email is provided, otherwise we can't create a login
            if (email) {
                // Check if user exists (could be a re-entry)
                const existingUser = await tx.user.findUnique({ where: { email } });
                if (existingUser) {
                    if (existingUser.role !== 'STUDENT') {
                        throw new Error('Email already registered with a different role.');
                    }
                    user = existingUser;
                } else {
                    user = await tx.user.create({
                        data: {
                            name,
                            email,
                            passwordHash,
                            role: 'STUDENT',
                            isActive: true,
                            emailVerified: new Date(),
                            imageUrl,
                        }
                    });
                }
            }

            // 2. Create Lead
            const lead = await tx.lead.create({
                data: {
                    name,
                    firstName,
                    lastName,
                    email,
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
                    passportNo,
                    passportIssueDate: passportIssueDate ? new Date(passportIssueDate) : null,
                    passportExpiryDate: passportExpiryDate ? new Date(passportExpiryDate) : null,
                    userId: user?.id || null, // Link to User if created
                    // Nested creation for FollowUp and Appointment
                    followUps: (followUp && followUp.nextFollowUpAt) ? {
                        create: {
                            nextFollowUpAt: new Date(followUp.nextFollowUpAt),
                            remark: followUp.remark,
                            userId: session.user.id,
                            type: followUp.type || 'CALL',
                            status: 'PENDING'
                        }
                    } : undefined,
                    appointments: (appointment && appointment.startTime) ? {
                        create: {
                            startTime: new Date(appointment.startTime),
                            endTime: appointment.endTime ? new Date(appointment.endTime) : new Date(new Date(appointment.startTime).getTime() + 60 * 60 * 1000),
                            title: appointment.title || 'Initial Consultation',
                            description: appointment.remark,
                            userId: session.user.id,
                            status: 'SCHEDULED'
                        }
                    } : undefined,
                    academicDetails: (academicDetails && Array.isArray(academicDetails)) ? {
                        create: academicDetails.map((detail: any) => ({
                            qualification: detail.qualification,
                            stream: detail.stream,
                            institution: detail.institution,
                            percentage: detail.percentage,
                            backlogs: detail.backlogs,
                            passingYear: detail.passingYear
                        }))
                    } : undefined,
                    workExperience: (workExperience && Array.isArray(workExperience)) ? {
                        create: workExperience.map((exp: any) => ({
                            companyName: exp.companyName,
                            position: exp.position,
                            startDate: exp.startDate,
                            endDate: exp.endDate,
                            totalExperience: exp.totalExperience
                        }))
                    } : undefined,
                    proficiencyExams: proficiencyExams ? proficiencyExams : undefined,
                    // If Creator is Employee/Agent/Counselor, automatically assign to them
                    ...((session.user.role === 'EMPLOYEE' || session.user.role === 'AGENT' || session.user.role === 'COUNSELOR' || session.user.role === 'SALES_REP') ? {
                        assignments: {
                            create: {
                                assignedTo: session.user.id,
                                assignedBy: session.user.id, // Self-assigned
                            }
                        },
                        status: 'ASSIGNED' as any // Auto-update status
                    } : {})
                },
            });

            return { lead, user, password };
        });

        const { lead, user, password: generatedPassword } = result;

        // Send Email if user was created
        if (user && email) {
            const { sendEmail } = await import('@/lib/email');
            try {
                await sendEmail({
                    to: email,
                    subject: 'Welcome to Inter CRM - Your Student Account',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #6d28d9;">Welcome to Inter CRM!</h2>
                            <p>Hello ${name},</p>
                            <p>Your student account has been successfully created. You can now login to the portal using the following credentials:</p>
                            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 5px 0;"><strong>Login URL:</strong> <a href="${process.env.NEXT_PUBLIC_APP_URL}/login">${process.env.NEXT_PUBLIC_APP_URL}/login</a></p>
                                <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                                <p style="margin: 5px 0;"><strong>Password:</strong> ${generatedPassword}</p>
                            </div>
                            <p>Please login and change your password immediately for security.</p>
                            <p>Best regards,<br>The Inter CRM Team</p>
                        </div>
                    `,
                });
            } catch (emailError) {
                console.error("Failed to send welcome email:", emailError);
            }
        }

        // Notify Admins
        const { notifyAdmins } = await import('@/lib/notifications');
        await notifyAdmins(
            'New Lead Created',
            `A new lead has been created: ${name} (${phone}) from ${source}.`,
            'LEAD_CREATED'
        );

        return NextResponse.json(lead, { status: 201 });
    } catch (error: any) {
        console.error('Create lead error:', error);
        return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
    }
}
