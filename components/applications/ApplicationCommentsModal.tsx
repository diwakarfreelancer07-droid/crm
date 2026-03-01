"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    MessageSquare,
    Upload,
    FileText,
    Download,
    Clock,
    User,
    CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ApplicationCommentsModal({ isOpen, onClose, application, onUpdate }: any) {
    const [comment, setComment] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const { data: comments = [], isLoading } = useQuery({
        queryKey: ['application-comments', application?.id],
        queryFn: async () => {
            if (!application?.id) return [];
            const response = await fetch(`/api/applications/${application.id}/notes?type=COMMENT`);
            if (!response.ok) throw new Error('Failed to fetch comments');
            return response.json();
        },
        enabled: !!application?.id && isOpen
    });

    const addCommentMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch(`/api/applications/${application.id}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    note: data.comment,
                    attachmentUrl: data.attachmentUrl,
                    attachmentName: data.attachmentName,
                    type: 'COMMENT'
                })
            });
            if (!response.ok) throw new Error('Failed to add comment');
            return response.json();
        },
        onSuccess: () => {
            setComment("");
            setFile(null);
            queryClient.invalidateQueries({ queryKey: ['application-comments', application?.id] });
            onUpdate?.();
            toast.success("Comment added successfully");
        },
        onError: () => {
            toast.error("Failed to add comment");
        }
    });

    const handleFileUpload = async () => {
        if (!comment.trim() && !file) {
            toast.error("Please enter a comment or upload a file");
            return;
        }

        setIsUploading(true);
        try {
            let attachmentUrl = null;
            let attachmentName = null;

            if (file) {
                const formData = new FormData();
                formData.append("file", file);

                const uploadRes = await axios.post("/api/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });

                if (uploadRes.data.success) {
                    attachmentUrl = uploadRes.data.url;
                    attachmentName = file.name;
                } else {
                    throw new Error(uploadRes.data.error || "Upload failed");
                }
            }

            await addCommentMutation.mutateAsync({
                comment,
                attachmentUrl,
                attachmentName
            });
        } catch (error: any) {
            toast.error(error.message || "Failed to save comment");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-2xl">
                <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
                    <DialogTitle className="text-xl font-extrabold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                        <MessageSquare className="h-6 w-6 text-primary" />
                        Application Comment
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
                    {/* Add Comment Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                Comment <span className="text-red-500 text-sm">*</span>
                            </label>
                            <Textarea
                                placeholder="Type your comment here..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="min-h-[140px] rounded-xl border-slate-200 focus:ring-primary/20 bg-white shadow-sm font-medium text-slate-700"
                            />
                        </div>

                        <div className="space-y-4 flex flex-col justify-between">
                            <div>
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Optional Attachment</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`
                                        mt-3 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all h-[140px]
                                        ${file ? 'border-primary/40 bg-primary/5 shadow-sm' : 'border-slate-200 hover:border-primary/40 hover:bg-white'}
                                    `}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                    {file ? (
                                        <div className="flex flex-col items-center animate-in zoom-in-95">
                                            <CheckCircle2 className="h-8 w-8 text-primary mb-2" />
                                            <p className="text-[11px] font-black text-slate-800 truncate max-w-[200px]">{file.name}</p>
                                            <Button variant="ghost" size="sm" className="mt-1 text-red-500 hover:text-red-600 hover:bg-white h-6 text-[9px] px-2 font-black uppercase" onClick={(e) => { e.stopPropagation(); setFile(null); }}>Remove</Button>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="h-8 w-8 text-slate-300 mb-2" />
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-tight">Upload File</p>
                                            <p className="text-[9px] text-slate-300 mt-1 font-bold">PDF, DOC, IMG up to 5MB</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <Button
                                onClick={handleFileUpload}
                                disabled={isUploading || addCommentMutation.isPending}
                                className="w-full rounded-xl h-12 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98] bg-primary hover:bg-primary/90 text-white"
                            >
                                {isUploading ? "Processing..." : "Submit Comment"}
                            </Button>
                        </div>
                    </div>

                    {/* Comments History Table */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Clock className="h-3 w-3" /> Previous Comments
                            </h3>
                            {comments?.length > 0 && (
                                <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">{comments.length} Entries</span>
                            )}
                        </div>

                        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm ring-1 ring-slate-100/50">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 border-b border-slate-100">
                                        <th className="px-5 py-3.5 font-black text-[9px] uppercase tracking-widest">S.No.</th>
                                        <th className="px-5 py-3.5 font-black text-[9px] uppercase tracking-widest">Created Date</th>
                                        <th className="px-5 py-3.5 font-black text-[9px] uppercase tracking-widest">Comment</th>
                                        <th className="px-5 py-3.5 font-black text-[9px] uppercase tracking-widest text-center">Attachment</th>
                                        <th className="px-5 py-3.5 font-black text-[9px] uppercase tracking-widest">Commented By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {isLoading ? (
                                        [1, 2, 3].map(i => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={5} className="px-5 py-12 bg-slate-50/10" />
                                            </tr>
                                        ))
                                    ) : (comments?.length ?? 0) === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-20 text-center text-slate-300 italic font-black text-xs uppercase tracking-tighter">No comments recorded yet.</td>
                                        </tr>
                                    ) : (
                                        comments.map((c: any, idx: number) => (
                                            <tr key={c.id} className="hover:bg-slate-50/50 transition-all group">
                                                <td className="px-5 py-5 font-black text-slate-300 text-[10px] tabular-nums">{String(idx + 1).padStart(2, '0')}</td>
                                                <td className="px-5 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-slate-700">{format(new Date(c.createdAt), "dd MMM yyyy")}</span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tabular-nums mt-0.5">{format(new Date(c.createdAt), "HH:mm")}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-5">
                                                    <p className="text-slate-600 text-[11px] font-medium leading-relaxed max-w-[320px] whitespace-pre-wrap group-hover:text-slate-900 transition-colors">{c.note || "—"}</p>
                                                </td>
                                                <td className="px-5 py-5 text-center">
                                                    {c.attachmentUrl ? (
                                                        <a
                                                            href={c.attachmentUrl}
                                                            target="_blank"
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-primary font-black text-[9px] border border-slate-100 hover:bg-primary hover:text-white hover:border-primary transition-all uppercase tracking-widest group/btn"
                                                        >
                                                            <FileText className="h-3 w-3 group-hover/btn:scale-110 transition-transform" />
                                                            View
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-200">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <Avatar className="h-8 w-8 border-2 border-white shadow-sm ring-1 ring-slate-100 grayscale-[0.5] group-hover:grayscale-0 transition-all">
                                                                <AvatarImage src={c.user?.imageUrl} />
                                                                <AvatarFallback className="text-[10px] font-black bg-slate-50 text-slate-400">{c.user?.name?.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-black text-slate-800 leading-tight">{c.user?.name}</span>
                                                            <span className="text-[9px] font-black text-primary/70 uppercase tracking-tighter mt-0.5">{c.user?.role}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
