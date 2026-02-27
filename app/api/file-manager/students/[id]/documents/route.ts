import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || !['ADMIN', 'MANAGER'].includes(session.user?.role)) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const documents = await prisma.studentDocument.findMany({
            where: { studentId: id },
            include: {
                uploader: {
                    select: {
                        name: true,
                        role: true,
                    },
                },
                country: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Enrich with checklist isMandatory flag if checklistId exists
        const enriched = await Promise.all(
            documents.map(async (doc) => {
                let isMandatory = false;
                let documentFor = doc.country?.name || 'Application';
                if (doc.checklistId) {
                    const checklist = await prisma.applicationChecklist.findUnique({
                        where: { id: doc.checklistId },
                        select: { isMandatory: true, isEnquiryForm: true },
                    });
                    if (checklist) {
                        isMandatory = checklist.isMandatory;
                        documentFor = checklist.isEnquiryForm ? 'Enquiry' : 'Application';
                    }
                }
                return { ...doc, isMandatory, documentFor };
            })
        );

        return NextResponse.json(enriched);
    } catch (error: any) {
        console.error('FILE_MANAGER_DOCS_ERROR:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
