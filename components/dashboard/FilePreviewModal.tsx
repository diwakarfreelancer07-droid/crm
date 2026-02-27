"use client";

import { X, Download, FileText, AlertCircle } from "lucide-react";

interface Props {
    fileUrl: string;
    fileName: string;
    onClose: () => void;
}

export default function FilePreviewModal({ fileUrl, fileName, onClose }: Props) {
    const ext = fileUrl.split('.').pop()?.toLowerCase() || '';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
    const isPdf = ext === 'pdf';
    const canPreview = isImage || isPdf;

    const downloadUrl = `/api/file-manager/download?${new URLSearchParams({ file: fileUrl, name: fileName })}`;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-4 md:inset-8 lg:inset-16 z-[115] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header — matches existing dark-header modal style */}
                <div className="flex items-center justify-between px-5 py-3 bg-primary/95 text-white shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="text-sm font-semibold truncate">{fileName}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <Download className="h-3.5 w-3.5" />
                            Download
                        </a>
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Preview Body */}
                <div className="flex-1 overflow-hidden bg-muted/30 flex items-center justify-center p-2">
                    {isPdf ? (
                        <iframe
                            src={fileUrl}
                            className="w-full h-full rounded-lg border border-border/30"
                            title={fileName}
                        />
                    ) : isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={fileUrl}
                            alt={fileName}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-muted-foreground/60">
                            <AlertCircle className="h-12 w-12 opacity-30" />
                            <div className="text-center">
                                <p className="text-sm font-medium">Preview not available</p>
                                <p className="text-xs mt-1 opacity-70">
                                    This file type (.{ext}) cannot be previewed in the browser.
                                </p>
                            </div>
                            <a
                                href={downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                            >
                                <Download className="h-4 w-4" />
                                Download to view
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
