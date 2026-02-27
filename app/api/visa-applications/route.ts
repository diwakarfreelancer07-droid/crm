import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { VisaStatus, VisaType } from '@prisma/client';
import { AuditLogService } from '@/lib/auditLog';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const studentId = searchParams.get('studentId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const where: any = {};
        if (studentId) {
            where.studentId = studentId;
        }

        const [visaApplications, total] = await Promise.all([
            prisma.visaApplication.findMany({
                where,
                include: {
                    student: { select: { name: true, phone: true, email: true, passportNo: true } },
                    country: { select: { name: true } },
                    university: { select: { name: true } },
                    course: { select: { name: true } },
                    universityApplication: {
                        include: {
                            assignedBy: { select: { name: true, role: true } },
                            assignedTo: { select: { name: true, role: true } },
                            _count: { select: { applicationNotes: true } }
                        }
                    },
                    assignedOfficer: { select: { name: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.visaApplication.count({ where }),
        ]);

        return NextResponse.json({
            visaApplications,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Fetch visa applications error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            studentId,
            universityApplicationId,
            countryId,
            universityId,
            courseId,
            intake,
            visaType,
            applicationDate,
            appointmentDate,
            decisionDate,
            expiryDate,
            gicTuitionFeePaid,
            medicalDone,
            biometricsDone,
            remarks,
            assignedOfficerId,
            status,
        } = body;

        if (!studentId || !countryId || !visaType) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const visaApplication = await prisma.visaApplication.create({
            data: {
                studentId,
                universityApplicationId: universityApplicationId || null,
                countryId,
                universityId: universityId || null,
                courseId: courseId || null,
                intake: intake || null,
                visaType: visaType as VisaType,
                applicationDate: applicationDate ? new Date(applicationDate) : new Date(),
                appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
                decisionDate: decisionDate ? new Date(decisionDate) : null,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                gicTuitionFeePaid: gicTuitionFeePaid || false,
                medicalDone: medicalDone || false,
                biometricsDone: biometricsDone || false,
                remarks: remarks || null,
                assignedOfficerId: assignedOfficerId || null,
                status: (status as VisaStatus) || VisaStatus.PENDING,
            },
            include: {
                student: true,
                country: true,
            }
        });

        // Log activity
        await prisma.leadActivity.create({
            data: {
                leadId: (await prisma.student.findUnique({ where: { id: studentId }, select: { leadId: true } }))?.leadId || "",
                userId: session.user.id,
                type: 'NOTE',
                content: `New Visa Application (${visaType}) created for ${visaApplication.student.name} to ${visaApplication.country.name}.`,
            }
        });

        // Audit Log
        await AuditLogService.log({
            userId: session.user.id,
            action: "CREATED",
            module: "VISA",
            entity: "VisaApplication",
            entityId: visaApplication.id,
            newValues: visaApplication,
            metadata: { studentId, countryId }
        });

        return NextResponse.json(visaApplication, { status: 201 });
    } catch (error) {
        console.error('Create visa application error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
