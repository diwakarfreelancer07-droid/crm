
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/master/checklist - List all checklist items with filters
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const countryId = searchParams.get("countryId");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const where: any = {};

        if (countryId && countryId !== "all") {
            where.countryId = countryId;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
            ];
        }

        const [items, total] = await Promise.all([
            prisma.applicationChecklist.findMany({
                where,
                include: { country: true },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.applicationChecklist.count({ where }),
        ]);

        return NextResponse.json({
            items,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error("GET_CHECKLIST_ERROR:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/master/checklist - Create a new checklist item
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, type, countryId, isEnquiryForm, isMandatory } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const item = await prisma.applicationChecklist.create({
            data: {
                name,
                type: type || "MANDATORY",
                countryId: countryId || null,
                isEnquiryForm: !!isEnquiryForm,
                isMandatory: !!isMandatory,
            },
            include: { country: true },
        });

        return NextResponse.json(item);
    } catch (error: any) {
        console.error("POST_CHECKLIST_ERROR:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
