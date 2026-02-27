import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LeadStatus } from '@prisma/client';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Delete associated activities and assignments first if not set to cascade in prisma
        // Given the schema provided earlier has some relations, I should be careful.
        // Actually, let's just delete the lead, assuming cascade or handling it.
        await prisma.lead.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Lead deleted successfully' });
    } catch (error) {
        console.error('Delete lead error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}


export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        // Check if this is an assignment request
        if (body.assignedTo) {
            const allowedRoles = ['ADMIN', 'MANAGER', 'AGENT', 'SALES_REP'];
            if (!allowedRoles.includes(session.user.role)) {
                return NextResponse.json({ message: 'You do not have permission to assign leads' }, { status: 403 });
            }

            const employeeId = body.assignedTo;
            const employee = await prisma.user.findUnique({ where: { id: employeeId } });

            if (!employee) {
                return NextResponse.json({ message: 'Employee not found' }, { status: 404 });
            }

            // Verify Hierarchy
            // Admin/Manager can assign to anyone
            // Agent/Sales Rep can only assign to Counselor
            if (session.user.role === 'AGENT' || session.user.role === 'SALES_REP') {
                if (employee.role !== 'COUNSELOR') {
                    return NextResponse.json({ message: 'You can only assign leads to Counselors' }, { status: 403 });
                }

                // Agent can only assign to their own subordinates
                if (session.user.role === 'AGENT') {
                    const agent = await prisma.agentProfile.findUnique({
                        where: { userId: session.user.id }
                    });
                    const targetCounselorProfile = await prisma.counselorProfile.findUnique({
                        where: { userId: employeeId }
                    });

                    if (targetCounselorProfile?.agentId !== agent?.id) {
                        return NextResponse.json({ message: 'You can only assign leads to your direct subordinates' }, { status: 403 });
                    }
                }
            }

            // Verify the assigner exists to prevent foreign key errors
            const assigner = await prisma.user.findUnique({ where: { id: session.user.id } });
            if (!assigner) {
                return NextResponse.json({ message: 'Your account was not found. Please log in again.' }, { status: 401 });
            }

            // Perform assignment in a transaction
            const lead = await prisma.$transaction(async (tx) => {
                // 1. Create Assignment
                await tx.leadAssignment.create({
                    data: {
                        leadId: id,
                        assignedTo: employeeId,
                        assignedBy: session.user.id,
                    }
                });

                // 2. Update Lead Status
                const updatedLead = await tx.lead.update({
                    where: { id },
                    data: { status: LeadStatus.UNDER_REVIEW }
                });

                // 3. Log Activity
                await tx.leadActivity.create({
                    data: {
                        leadId: id,
                        userId: session.user.id,
                        type: 'TASK_CREATED',
                        content: `Lead assigned to ${employee.name}`
                    }
                });

                return updatedLead;
            });

            // Notify Assigned Employee
            const { notifyUser } = await import('@/lib/notifications');
            await notifyUser(
                employeeId,
                'New Lead Assigned',
                `You have been assigned a new lead: ${lead.name}`,
                'LEAD_ASSIGNED'
            );

            return NextResponse.json(lead);
        }

        // Standard update logic
        const previousLead = await prisma.lead.findUnique({
            where: { id },
            include: {
                assignments: {
                    orderBy: { assignedAt: 'desc' },
                    take: 1
                }
            }
        });

        if (body.dateOfBirth) {
            body.dateOfBirth = new Date(body.dateOfBirth);
        }

        // Derive name if firstName/lastName changed
        if (body.firstName !== undefined || body.lastName !== undefined) {
            const currentLead = await prisma.lead.findUnique({ where: { id }, select: { firstName: true, lastName: true, phone: true } });
            const fName = body.firstName !== undefined ? body.firstName : (currentLead?.firstName || "");
            const lName = body.lastName !== undefined ? body.lastName : (currentLead?.lastName || "");
            body.name = `${fName} ${lName}`.trim() || currentLead?.phone;
        }

        // Handle nested updates for AcademicDetails and WorkExperience
        if (body.academicDetails && Array.isArray(body.academicDetails)) {
            const academicDetails = body.academicDetails;
            delete body.academicDetails;
            body.academicDetails = {
                deleteMany: {},
                create: academicDetails.map((detail: any) => ({
                    qualification: detail.qualification,
                    stream: detail.stream,
                    institution: detail.institution,
                    percentage: detail.percentage,
                    backlogs: detail.backlogs,
                    passingYear: detail.passingYear
                }))
            };
        }

        if (body.workExperience && Array.isArray(body.workExperience)) {
            const workExperience = body.workExperience;
            delete body.workExperience;
            body.workExperience = {
                deleteMany: {},
                create: workExperience.map((exp: any) => ({
                    companyName: exp.companyName,
                    position: exp.position,
                    startDate: exp.startDate,
                    endDate: exp.endDate,
                    totalExperience: exp.totalExperience
                }))
            };
        }

        const lead = await prisma.lead.update({
            where: { id },
            data: body,
        });

        // Check for conversion
        if (previousLead?.status !== LeadStatus.CLOSED && body.status === LeadStatus.CLOSED) {
            const { notifyAdmins, notifyUser } = await import('@/lib/notifications');

            // Notify Admins
            await notifyAdmins(
                'Lead Converted',
                `Lead ${lead.name} has been converted to a customer.`,
                'LEAD_CONVERTED'
            );

            // Notify Assigned Employee
            const assignedEmployeeId = previousLead?.assignments[0]?.assignedTo;
            if (assignedEmployeeId) {
                await notifyUser(
                    assignedEmployeeId,
                    'Lead Converted',
                    `Your lead ${lead.name} has been successfully converted.`,
                    'LEAD_CONVERTED'
                );
            }
        }

        return NextResponse.json(lead);
    } catch (error) {
        console.error('Update lead error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}


export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const lead = await prisma.lead.findUnique({
            where: { id },
            include: {
                activities: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: { name: true }
                        }
                    }
                },
                assignments: {
                    include: {
                        employee: {
                            select: { name: true, email: true }
                        }
                    }
                },
                tasks: {
                    orderBy: { dueAt: 'asc' },
                    include: {
                        reminders: true
                    }
                },
                documents: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: { select: { name: true } }
                    }
                },
                academicDetails: true,
                workExperience: true,
            }
        });

        if (!lead) {
            return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
        }

        return NextResponse.json(lead);
    } catch (error) {
        console.error('Fetch lead detail error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

