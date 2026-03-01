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
    Plus,
    Upload,
    FileText,
    Download,
    Trash2,
    Clock,
    User,
    CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function OfferLetterModal({ isOpen, onClose, application, onUpdate }: any) {
    const [remark, setRemark] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const { data: offerLetters = [], isLoading } = useQuery({
        queryKey: ['application-offer-letters', application?.id],
        queryFn: async () => {
            if (!application?.id) return [];
            const response = await fetch(`/api/applications/${application.id}/notes?type=OFFER_LETTER`);
            if (!response.ok) throw new Error('Failed to fetch offer letters');
            return response.json();
        },
        enabled: !!application?.id && isOpen
    });

    const addOfferLetterMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch(`/api/applications/${application.id}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    note: data.remark,
                    attachmentUrl: data.attachmentUrl,
                    attachmentName: data.attachmentName,
                    type: 'OFFER_LETTER'
                })
            });
            if (!response.ok) throw new Error('Failed to add offer letter');
            return response.json();
        },
        onSuccess: () => {
            setRemark("");
            setFile(null);
            queryClient.invalidateQueries({ queryKey: ['application-offer-letters', application?.id] });
            onUpdate?.();
            toast.success("Offer letter added successfully");
        },
        onError: () => {
            toast.error("Failed to add offer letter");
        }
    });

    const handleFileUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const uploadRes = await axios.post("/api/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (uploadRes.data.success) {
                await addOfferLetterMutation.mutateAsync({
                    remark,
                    attachmentUrl: uploadRes.data.url,
                    attachmentName: file.name
                });
            } else {
                throw new Error(uploadRes.data.error || "Upload failed");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to upload file");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-2xl">
                <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="h-6 w-6 text-primary" />
                            Add Application Offer Letters
                        </DialogTitle>
                        <p className="text-sm text-slate-500 mt-1">Manage and upload offer letters for this application.</p>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
                    {/* Upload Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                Remark <span className="text-red-500">*</span>
                            </label>
                            <Textarea
                                placeholder="Enter any specific remarks about this offer letter..."
                                value={remark}
                                onChange={(e) => setRemark(e.target.value)}
                                className="min-h-[120px] rounded-xl border-slate-200 focus:ring-primary/20 bg-white shadow-sm"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700">Upload Offer Letter <span className="text-red-500">*</span></label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`
                                    border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all h-[120px]
                                    ${file ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 hover:border-primary/40 hover:bg-slate-50'}
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
                                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                                        <p className="text-[11px] font-bold text-slate-800 truncate max-w-[200px]">{file.name}</p>
                                        <Button variant="ghost" size="sm" className="mt-1 text-red-500 hover:text-red-600 hover:bg-red-50 h-6 text-[9px] px-2 font-bold" onClick={(e) => { e.stopPropagation(); setFile(null); }}>Remove</Button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="h-8 w-8 text-slate-400 mb-2" />
                                        <p className="text-xs font-bold text-slate-600">Click to upload file</p>
                                        <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-wider">PDF, JPG, PNG up to 10MB</p>
                                    </>
                                )}
                            </div>

                            <Button
                                onClick={handleFileUpload}
                                disabled={!file || !remark.trim() || isUploading || addOfferLetterMutation.isPending}
                                className="w-full rounded-xl h-11 font-bold shadow-lg shadow-primary/10 transition-all active:scale-95 bg-primary hover:bg-primary/90 text-white"
                            >
                                {isUploading ? "Uploading..." : "Save Offer Letter"}
                            </Button>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                            Offer Letter History
                            {offerLetters?.length > 0 && (
                                <span className="bg-primary text-white px-2 py-0.5 rounded-full text-[9px] font-black">{offerLetters.length}</span>
                            )}
                        </h3>

                        <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-3 font-black text-[9px] uppercase tracking-widest">S.No.</th>
                                        <th className="px-4 py-3 font-black text-[9px] uppercase tracking-widest">Created Date</th>
                                        <th className="px-4 py-3 font-black text-[9px] uppercase tracking-widest">Remark</th>
                                        <th className="px-4 py-3 font-black text-[9px] uppercase tracking-widest">Offer Letter</th>
                                        <th className="px-4 py-3 font-black text-[9px] uppercase tracking-widest">Commented By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {isLoading ? (
                                        [1, 2].map(i => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={5} className="px-4 py-10 bg-slate-50/20" />
                                            </tr>
                                        ))
                                    ) : (offerLetters?.length ?? 0) === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-16 text-center text-slate-400 italic font-bold">No offer letters uploaded yet.</td>
                                        </tr>
                                    ) : (
                                        offerLetters.map((ol: any, idx: number) => (
                                            <tr key={ol.id} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-4 py-4 font-black text-slate-300 text-[11px]">{String(idx + 1).padStart(2, '0')}</td>
                                                <td className="px-4 py-4 text-[11px] font-bold text-slate-500">
                                                    {format(new Date(ol.createdAt), "dd-MM-yyyy • HH:mm")}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="text-slate-700 text-[11px] font-medium leading-relaxed max-w-[300px] whitespace-pre-wrap">{ol.note}</p>
                                                </td>
                                                <td className="px-4 py-4">
                                                    {ol.attachmentUrl ? (
                                                        <a
                                                            href={ol.attachmentUrl}
                                                            target="_blank"
                                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-black text-[9px] border border-emerald-100 hover:bg-emerald-100 transition-all uppercase tracking-wider"
                                                        >
                                                            <Download className="h-3.5 w-3.5" />
                                                            View File
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-300 text-[9px] font-bold uppercase italic">No file</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-7 w-7 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                                            <AvatarImage src={ol.user?.imageUrl} />
                                                            <AvatarFallback className="text-[10px] font-black bg-slate-100 text-slate-500">{ol.user?.name?.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-black text-slate-800 leading-none">{ol.user?.name}</span>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{ol.user?.role}</span>
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
