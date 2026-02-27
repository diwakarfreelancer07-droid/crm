import { NextResponse } from 'next/server';
import { prisma, LeadActivityType, DocumentType } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { S3UploadService } from '@/lib/s3';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const documentType = formData.get('type') as DocumentType || DocumentType.OTHER;

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
        }

        if (!session.user?.email) {
            return NextResponse.json({ message: 'Unauthorized: no email in session' }, { status: 401 });
        }
        const sessionUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });
        if (!sessionUser) {
            return NextResponse.json({ message: 'Uploader account not found' }, { status: 400 });
        }
        const uploaderId = sessionUser.id;

        // Upload to S3
        const s3Service = new S3UploadService();
        const uploadResult = await s3Service.uploadFile(file);

        if (!uploadResult.success || !uploadResult.imageUrl) {
            return NextResponse.json({ message: uploadResult.error || 'Upload failed' }, { status: 500 });
        }

        const document = await prisma.$transaction(async (tx) => {
            const newDoc = await tx.leadDocument.create({
                data: {
                    leadId: id,
                    uploadedBy: uploaderId,
                    type: documentType,
                    fileName: file.name,
                    fileUrl: uploadResult.imageUrl,
                }
            });

            await tx.leadActivity.create({
                data: {
                    leadId: id,
                    userId: uploaderId,
                    type: LeadActivityType.DOCUMENT_UPLOAD,
                    content: `Document uploaded: ${file.name} (${documentType})`
                }
            });

            return newDoc;
        });

        return NextResponse.json(document, { status: 201 });
    } catch (error) {
        console.error('Upload document error:', error);
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
        const documents = await prisma.leadDocument.findMany({
            where: { leadId: id },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { name: true }
                }
            }
        });

        return NextResponse.json(documents);
    } catch (error) {
        console.error('Fetch documents error:', error);
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

        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const documentId = searchParams.get('documentId');

        if (!documentId) {
            return NextResponse.json({ message: 'Document ID required' }, { status: 400 });
        }

        const document = await prisma.leadDocument.findUnique({
            where: { id: documentId }
        });

        if (!document) {
            return NextResponse.json({ message: 'Document not found' }, { status: 404 });
        }

        if (!session.user?.email) {
            return NextResponse.json({ message: 'Unauthorized: no email in session' }, { status: 401 });
        }
        const sessionUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });
        if (!sessionUser) {
            return NextResponse.json({ message: 'Uploader account not found' }, { status: 400 });
        }
        const uploaderId = sessionUser.id;

        // Delete from S3
        const s3Service = new S3UploadService();
        await s3Service.deleteFile(document.fileUrl);

        // Delete from database
        await prisma.$transaction(async (tx) => {
            await tx.leadDocument.delete({
                where: { id: documentId }
            });

            await tx.leadActivity.create({
                data: {
                    leadId: id,
                    userId: uploaderId,
                    type: LeadActivityType.NOTE,
                    content: `Document deleted: ${document.fileName}`
                }
            });
        });

        return NextResponse.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Delete document error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

