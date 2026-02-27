import { S3Client, S3ClientConfig, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export interface S3UploadConfig {
    bucketName: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    rootFolder?: string;
    subFolder?: string;
    maxFileSize?: number; // in bytes
    allowedMimeTypes?: string[];
    endpoint?: string; // For DigitalOcean Spaces
    forcePathStyle?: boolean; // For DigitalOcean Spaces
    makePublic?: boolean; // Control file visibility
}

export interface UploadResult {
    success: boolean;
    imageUrl?: string;
    error?: string;
    fileName?: string;
    fileSize?: number;
}

export class S3UploadService {
    private s3: S3Client;
    private config: S3UploadConfig;

    constructor(config?: Partial<S3UploadConfig>) {
        this.config = {
            bucketName: process.env.BUCKET_NAME || '',
            region: process.env.NEW_REGION || 'blr1',
            accessKeyId: process.env.NEW_ACCESS_KEY || '',
            secretAccessKey: process.env.SECRET_ACCESS_KEY || '',
            rootFolder: 'inter-platform-assets', // Default from user code
            subFolder: 'user_documents',
            maxFileSize: 10 * 1024 * 1024, // 10MB default
            allowedMimeTypes: [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/gif',
                'image/webp',
                'application/pdf',
                'video/mp4',
                'video/quicktime',
                'video/x-msvideo'
            ],
            // DigitalOcean Spaces specific configuration
            endpoint: process.env.S3_ENDPOINT || 'https://blr1.digitaloceanspaces.com',
            forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true', // DigitalOcean Spaces typically creates virtual-hosted style unless specified
            makePublic: process.env.S3_MAKE_PUBLIC !== 'false', // Default to true
            ...config
        };

        // Configure S3 client
        const s3Config: S3ClientConfig = {
            region: this.config.region,
            credentials: {
                accessKeyId: this.config.accessKeyId,
                secretAccessKey: this.config.secretAccessKey,
            },
            requestChecksumCalculation: "WHEN_REQUIRED",
            responseChecksumValidation: "WHEN_REQUIRED",
        };

        // Add custom endpoint for DigitalOcean Spaces
        if (this.config.endpoint) {
            s3Config.endpoint = this.config.endpoint;
            s3Config.forcePathStyle = false; // DigitalOcean Spaces requires this to be false for virtual-hosted style
        }

        this.s3 = new S3Client(s3Config);
    }

    /**
     * Validate file before upload
     */
    private validateFile(file: File): string | null {
        // Check file size
        if (file.size > this.config.maxFileSize!) {
            return `File size exceeds maximum allowed size of ${this.config.maxFileSize! / (1024 * 1024)}MB`;
        }

        // Check MIME type
        if (this.config.allowedMimeTypes && !this.config.allowedMimeTypes.includes(file.type)) {
            return `File type ${file.type} is not allowed. Allowed types: ${this.config.allowedMimeTypes.join(', ')}`;
        }

        return null;
    }

    /**
     * Generate unique filename
     */
    private generateFileName(originalName: string): string {
        const extension = originalName.split('.').pop();
        const uniqueId = uuidv4().slice(0, 6);
        const timestamp = Date.now();
        return `${uniqueId}-${timestamp}.${extension}`;
    }

    /**
     * Upload buffer to S3/DigitalOcean Spaces
     */
    async uploadBuffer(buffer: Buffer, fileName: string, mimeType: string): Promise<UploadResult> {
        try {
            // Generate unique filename
            const uniqueFileName = this.generateFileName(fileName);
            const key = `${this.config.rootFolder}/${this.config.subFolder}/${uniqueFileName}`;

            // Prepare upload
            const upload = new Upload({
                client: this.s3,
                params: {
                    Bucket: this.config.bucketName,
                    Key: key,
                    Body: buffer,
                    ContentType: mimeType,
                    Metadata: {
                        originalName: fileName,
                        uploadedAt: new Date().toISOString(),
                        fileSize: buffer.length.toString()
                    },
                    ACL: this.config.makePublic ? 'public-read' : undefined
                },
            });

            const uploadResult = await upload.done();

            return {
                success: true,
                imageUrl: uploadResult.Location,
                fileName: uniqueFileName,
                fileSize: buffer.length
            };

        } catch (error: any) {
            console.error('Error uploading buffer to Spaces:', error);
            return {
                success: false,
                error: 'Failed to upload file to storage'
            };
        }
    }

    /**
     * Upload file to S3/DigitalOcean Spaces
     */
    async uploadFile(file: File): Promise<UploadResult> {
        try {
            // Validate file
            const validationError = this.validateFile(file);
            if (validationError) {
                return {
                    success: false,
                    error: validationError
                };
            }

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            return this.uploadBuffer(buffer, file.name, file.type);

        } catch (error: any) {
            console.error('Error uploading file to Spaces:', error);
            return {
                success: false,
                error: 'Failed to upload file'
            };
        }
    }

    /**
     * Delete file from S3/DigitalOcean Spaces
     */
    async deleteFile(fileUrl: string): Promise<boolean> {
        try {
            // Extract key from URL
            const url = new URL(fileUrl);
            const key = url.pathname.substring(1); // Remove leading slash

            await this.s3.send(new DeleteObjectCommand({
                Bucket: this.config.bucketName,
                Key: key
            }));

            console.log('File deleted successfully from Spaces:', fileUrl);
            return true;
        } catch (error: any) {
            console.error('Error deleting file from Spaces:', error);
            return false;
        }
    }

    /**
     * Get presigned URL for direct client-side upload
     */
    async getPresignedUploadUrl(fileName: string, fileType: string): Promise<{ url: string, key: string, fileUrl: string }> {
        const uniqueFileName = this.generateFileName(fileName);
        const key = `${this.config.rootFolder}/${this.config.subFolder}/${uniqueFileName}`;

        const command = new PutObjectCommand({
            Bucket: this.config.bucketName,
            Key: key,
            ContentType: fileType,
            ACL: 'public-read',
        });

        const url = await getSignedUrl(this.s3, command, { expiresIn: 300 }); // 5 minutes

        // Construct the final public URL (DigitalOcean Spaces virtual-hosted format)
        const fileUrl = this.config.endpoint?.includes('digitaloceanspaces.com')
            ? `https://${this.config.bucketName}.${this.config.region}.digitaloceanspaces.com/${key}`
            : this.config.endpoint
                ? `${this.config.endpoint}/${this.config.bucketName}/${key}`
                : `https://${this.config.bucketName}.s3.${this.config.region}.amazonaws.com/${key}`;

        return { url, key, fileUrl };
    }
}

