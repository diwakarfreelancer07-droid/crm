import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import axios from 'axios';
import { basename } from 'path';

// GET /api/file-manager/download?file=https://...&name=Passport.pdf
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || !['ADMIN', 'MANAGER'].includes(session.user?.role)) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const fileUrl = searchParams.get('file');
        const downloadName = searchParams.get('name') || 'document';

        if (!fileUrl) {
            return NextResponse.json({ message: 'file param required' }, { status: 400 });
        }

        // Fetch file from S3
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const fileBuffer = Buffer.from(response.data);

        const ext = fileUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
        const contentType = getContentType(ext);

        return new NextResponse(fileBuffer as any, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadName)}"`,
                'Content-Length': fileBuffer.length.toString(),
            },
        });
    } catch (error: any) {
        console.error('FILE_MANAGER_DOWNLOAD_ERROR:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// POST /api/file-manager/download — body: { files: [{url, name}] }
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session || !['ADMIN', 'MANAGER'].includes(session.user?.role)) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const files: { url: string; name: string }[] = body.files || [];

        if (!files.length) {
            return NextResponse.json({ message: 'No files provided' }, { status: 400 });
        }

        // Dynamically import JSZip
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        // Fetch all files in parallel
        await Promise.all(
            files.map(async (f) => {
                try {
                    const response = await axios.get(f.url, { responseType: 'arraybuffer' });
                    const buf = Buffer.from(response.data);
                    const safeName = f.name || basename(new URL(f.url).pathname);
                    zip.file(safeName, buf);
                } catch (err) {
                    console.error(`Failed to fetch file for zip: ${f.url}`, err);
                }
            })
        );

        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

        return new NextResponse(zipBuffer as any, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="student-documents.zip"`,
                'Content-Length': zipBuffer.length.toString(),
            },
        });
    } catch (error: any) {
        console.error('FILE_MANAGER_ZIP_ERROR:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

function getContentType(ext: string): string {
    const map: Record<string, string> = {
        pdf: 'application/pdf',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    return map[ext] || 'application/octet-stream';
}
