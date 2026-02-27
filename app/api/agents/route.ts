import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "active";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const where: any = { role: 'AGENT' };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        if (status === "active") where.isActive = true;
        else if (status === "inactive") where.isActive = false;

        const [agents, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    agentProfile: true,
                    _count: {
                        select: {
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
            agents,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Fetch agents error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, email, password, companyName, address, phone, commission } = await req.json();

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return NextResponse.json({ error: "Email already exists" }, { status: 400 });

        const passwordHash = await bcrypt.hash(password, 10);

        const agent = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: "AGENT",
                emailVerified: new Date(),
                agentProfile: {
                    create: {
                        companyName,
                        address,
                        phone,
                        commission: commission ? parseFloat(commission) : null,
                    },
                },
            },
            include: { agentProfile: true },
        });

        return NextResponse.json(agent, { status: 201 });
    } catch (error) {
        console.error('Create agent error:', error);
        return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
    }
}
