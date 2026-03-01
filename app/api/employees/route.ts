import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// GET /api/employees - List employees with filters
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // RBAC: 
        // Admin/Manager: All
        // Agent/Sales Rep: Can see Counselors (and maybe themselves? logic below)
        // For now, let's allow authenticated users to fetch, and we can filter in the query if needed or just return all and let frontend filter. 
        // But to be safe, let's restrict what they get back if possible, or just open it up for now as "Employees" list is generally internal directory.
        // The previous code restricted to ADMIN only.

        const userRole = session.user.role;
        const allowedRoles = ['ADMIN', 'MANAGER', 'AGENT', 'SALES_REP', 'COUNSELOR', 'SUPPORT_AGENT']; // All staff

        if (!allowedRoles.includes(userRole)) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const role = searchParams.get("role") || "";
        const status = searchParams.get("status") || "active";
        const agentId = searchParams.get("agentId") || ""; // New filter
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        console.log("API Employees Params:", { search, role, status, agentId, page, limit });

        const where: any = {};

        // Filter by Agent ID (if provided)
        if (agentId) {
            where.counselorProfile = {
                agent: {
                    userId: agentId
                }
            };
        }

        // Search by name or email
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        // Filter by role
        if (role) {
            where.role = role;
        }

        // AGENT can only see their own subordinates
        if (session.user.role === 'AGENT') {
            const agent = await prisma.agentProfile.findUnique({
                where: { userId: session.user.id }
            });
            if (agent) {
                where.counselorProfile = {
                    agentId: agent.id
                };
            } else {
                where.id = 'none'; // Should not happen but helps security
            }
        }

        // Filter by status
        if (status === "active") {
            where.isActive = true;
        } else if (status === "inactive") {
            where.isActive = false;
        }

        console.log("API Employees Where:", JSON.stringify(where, null, 2));

        const [employees, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    roleId: true,
                    roleProfile: {
                        select: {
                            id: true,
                            name: true,
                        }
                    },
                    isActive: true,
                    createdAt: true,
                    agentProfile: true,
                    counselorProfile: {
                        include: {
                            agent: { include: { user: { select: { name: true } } } }
                        }
                    },
                    _count: {
                        select: {
                            assignedLeads: true,
                            activities: true,
                            onboardedStudents: true,
                        },
                    },
                },
                orderBy: {
                    name: 'asc'
                },
                skip,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        return NextResponse.json({
            employees,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Fetch employees error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/employees - Create new employee (Admin/Manager/Agent?)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        const body = await req.json();
        const { name, email, password, role, imageUrl, phone, department, designation, salary, joiningDate, managerId } = body;

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only admins can create employees (for now)
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: "Email already exists" }, { status: 400 });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create employee
        const employee = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: role || "EMPLOYEE",
                roleId: body.roleId || null,
                imageUrl, // Save profile picture
                emailVerified: new Date(), // Auto-verify employees created by admin
                agentProfile: ["AGENT", "SALES_REP", "MANAGER"].includes(role) ? {
                    create: {
                        phone: phone || null,
                        companyName: body.companyName || null,
                        commission: body.commission ? parseFloat(body.commission) : null,
                    }
                } : undefined,
                counselorProfile: role === "COUNSELOR" ? {
                    create: {
                        phone: phone || null,
                        department: department || null,
                        designation: designation || null,
                        salary: salary ? parseFloat(salary) : null,
                        joiningDate: joiningDate ? new Date(joiningDate) : null,
                        agentId: body.agentId || null,
                    }
                } : undefined,
            },
            include: {
                agentProfile: true,
                counselorProfile: true,
            },
        });

        const { passwordHash: _, otp, otpExpiresAt, ...employeeData } = employee;

        // Send welcome email with credentials
        try {
            await sendEmail({
                to: email,
                subject: 'Welcome to Inter CRM - Your Account Credentials',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #6d28d9;">Welcome to Inter CRM!</h2>
                        <p>Hello ${name},</p>
                        <p>Your employee account has been successfully created. You can now login to the dashboard using the following credentials:</p>
                        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                            <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
                        </div>
                        <p>Please login and change your password immediately for security.</p>
                        <p>Best regards,<br>The Inter CRM Team</p>
                    </div>
                `,
            });
        } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
            // Continue even if email fails
        }

        return NextResponse.json(employeeData, { status: 201 });
    } catch (error: any) {
        console.error("Error creating employee:", error);
        return NextResponse.json({ error: "Failed to create employee", details: error.message }, { status: 500 });
    }
}
