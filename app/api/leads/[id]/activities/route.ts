import { NextResponse } from 'next/server';
import { prisma, LeadActivityType, LeadStatus, LeadTemperature } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            console.log('Unauthorized access attempt to create activity');
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { type, content, updateLead } = body;

        console.log('Creating activity for lead:', id);
        console.log('User:', session.user.id);
        console.log('Payload:', { type, content, updateLead });

        if (!type) {
            return NextResponse.json({ message: 'Activity type is required' }, { status: 400 });
        }

        // Verify lead exists first
        const leadExists = await prisma.lead.findUnique({ where: { id } });
        if (!leadExists) {
            console.error(`Lead not found: ${id} `);
            return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
        }

        const activity = await prisma.$transaction(async (tx) => {
            const newActivity = await tx.leadActivity.create({
                data: {
                    leadId: id,
                    userId: session.user.id,
                    type: type as LeadActivityType,
                    content: content || `Action: ${type} `,
                }
            });

            if (updateLead) {
                await tx.lead.update({
                    where: { id },
                    data: {
                        status: LeadStatus.UNDER_REVIEW,
                        temperature: LeadTemperature.WARM
                    }
                });

                await tx.leadActivity.create({
                    data: {
                        leadId: id,
                        userId: session.user.id,
                        type: LeadActivityType.STATUS_CHANGE,
                        content: `Status changed to UNDER_REVIEW`
                    }
                });

                await tx.leadActivity.create({
                    data: {
                        leadId: id,
                        userId: session.user.id,
                        type: LeadActivityType.TEMPERATURE_CHANGE,
                        content: `Temperature changed to WARM`
                    }
                });
            }

            return newActivity;
        });

        return NextResponse.json(activity, { status: 201 });
    } catch (error: any) {
        console.error('Create activity error details:', {
            message: error.message,
            code: error.code,
            meta: error.meta,
            stack: error.stack
        });
        return NextResponse.json({
            message: 'Internal server error',
            details: error.message
        }, { status: 500 });
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
        const { activityId, content } = body;

        if (!activityId || !content) {
            return NextResponse.json({ message: 'Activity ID and content required' }, { status: 400 });
        }

        // Only allow editing NOTE type activities
        const activity = await prisma.leadActivity.findUnique({
            where: { id: activityId }
        });

        if (!activity) {
            return NextResponse.json({ message: 'Activity not found' }, { status: 404 });
        }

        if (activity.type !== LeadActivityType.NOTE) {
            return NextResponse.json({ message: 'Only notes can be edited' }, { status: 400 });
        }

        const updated = await prisma.leadActivity.update({
            where: { id: activityId },
            data: { content }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Update activity error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Only admins can delete activities
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Only admins can delete activities' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const activityId = searchParams.get('activityId');

        if (!activityId) {
            return NextResponse.json({ message: 'Activity ID required' }, { status: 400 });
        }

        await prisma.leadActivity.delete({
            where: { id: activityId }
        });

        return NextResponse.json({ message: 'Activity deleted successfully' });
    } catch (error) {
        console.error('Delete activity error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const [activities, total] = await Promise.all([
            prisma.leadActivity.findMany({
                where: { leadId: id },
                include: {
                    user: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.leadActivity.count({
                where: { leadId: id },
            }),
        ]);

        return NextResponse.json({
            activities,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Fetch activities error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
