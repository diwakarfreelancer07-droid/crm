
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH /api/master/checklist/[id] - Update a checklist item
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { name, type, countryId, isEnquiryForm, isMandatory } = body;

        const item = await prisma.applicationChecklist.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(type && { type }),
                countryId: countryId === "all" ? null : countryId,
                isEnquiryForm: isEnquiryForm !== undefined ? !!isEnquiryForm : undefined,
                isMandatory: isMandatory !== undefined ? !!isMandatory : undefined,
            },
            include: { country: true },
        });

        return NextResponse.json(item);
    } catch (error: any) {
        console.error("PATCH_CHECKLIST_ERROR:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// DELETE /api/master/checklist/[id] - Delete a checklist item
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await prisma.applicationChecklist.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("DELETE_CHECKLIST_ERROR:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
