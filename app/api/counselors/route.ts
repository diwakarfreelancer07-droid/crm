import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Admins see all, Agents see their own counselors
        const userRole = session.user.role;
        if (userRole !== 'ADMIN' && userRole !== 'AGENT') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "active";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const where: any = { role: 'COUNSELOR' };

        if (userRole === 'AGENT') {
            where.counselorProfile = {
                agent: {
                    userId: session.user.id
                }
            };
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        if (status === "active") where.isActive = true;
        else if (status === "inactive") where.isActive = false;

        const [counselors, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    counselorProfile: {
                        include: {
                            agent: {
                                include: {
                                    user: {
                                        select: { name: true }
                                    }
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            assignedLeads: true,
                            onboardedStudents: true,
                        },
                    },
                },
                orderBy: { name: 'asc' },
                skip,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        return NextResponse.json({
            counselors,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Fetch counselors error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AGENT')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, email, password, phone, department, designation, salary, joiningDate, agentId } = await req.json();

        // If an Agent is creating, the counselor is automatically linked to them
        let effectiveAgentId = agentId;
        if (session.user.role === 'AGENT') {
            const agentProfile = await prisma.agentProfile.findUnique({
                where: { userId: session.user.id }
            });
            if (!agentProfile) {
                console.error(`Agent profile not found for userId: ${session.user.id}`);
                return NextResponse.json({ error: "Your Agent profile was not found. Please contact support." }, { status: 400 });
            }
            effectiveAgentId = agentProfile.id;
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            console.warn(`Attempted to create counselor with existing email: ${email}`);
            return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const counselor = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: "COUNSELOR",
                emailVerified: new Date(),
                counselorProfile: {
                    create: {
                        phone,
                        department,
                        designation,
                        salary: salary ? parseFloat(salary) : null,
                        joiningDate: joiningDate ? new Date(joiningDate) : null,
                        agentId: effectiveAgentId || null,
                    },
                },
            },
            include: { counselorProfile: true },
        });

        return NextResponse.json(counselor, { status: 201 });
    } catch (error: any) {
        console.error('Create counselor error stack:', error.stack);
        console.error('Create counselor error:', error);
        return NextResponse.json({ error: error.message || "Failed to create counselor" }, { status: 500 });
    }
}
