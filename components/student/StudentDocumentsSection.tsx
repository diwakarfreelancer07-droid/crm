"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Upload,
    Trash2,
    FileText,
    Download,
    AlertCircle,
    FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface ChecklistItem {
    id: string;
    name: string;
    type: string;
    isMandatory: boolean;
    countryId: string | null;
}

interface Country {
    id: string;
    name: string;
}

interface DocumentRecord {
    id: string;
    fileName: string;
    fileUrl: string;
    documentName: string;
    createdAt: string;
    uploader: { name: string };
    country: { name: string } | null;
}

interface Props {
    studentId: string;
    interestedCountry?: string | null;
}

export default function StudentDocumentsSection({ studentId, interestedCountry }: Props) {
    const [documents, setDocuments] = useState<DocumentRecord[]>([]);
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedCountryId, setSelectedCountryId] = useState<string>("all");
    const [selectedChecklistId, setSelectedChecklistId] = useState<string>("");
    const [selectedDocName, setSelectedDocName] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchDocuments();
        fetchChecklist();
        fetchCountries();
    }, [studentId]);

    const fetchDocuments = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`/api/students/${studentId}/documents`);
            setDocuments(res.data);
        } catch (e) {
            console.error("Failed to load documents", e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchChecklist = async () => {
        try {
            const res = await axios.get(`/api/master/checklist?limit=100`);
            setChecklist(res.data.items || []);
        } catch (e) {
            console.error("Failed to load checklist", e);
        }
    };

    const fetchCountries = async () => {
        try {
            const res = await axios.get(`/api/master/countries`);
            setCountries(res.data);
        } catch (e) {
            console.error("Failed to load countries", e);
        }
    };

    // Filter checklist by selected country
    const filteredChecklist = checklist.filter(
        (item) =>
            item.countryId === null ||
            selectedCountryId === "all" ||
            item.countryId === selectedCountryId
    );

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!selectedDocName && !selectedChecklistId) {
            toast.error("Please select a document type from the checklist first.");
            fileInputRef.current!.value = "";
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append(
            "documentName",
            selectedDocName ||
            filteredChecklist.find((c) => c.id === selectedChecklistId)?.name ||
            "Document"
        );
        if (selectedCountryId && selectedCountryId !== "all") {
            formData.append("countryId", selectedCountryId);
        }
        if (selectedChecklistId) {
            formData.append("checklistId", selectedChecklistId);
        }

        setIsUploading(true);
        try {
            await axios.post(`/api/students/${studentId}/documents`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("Document uploaded successfully!");
            setSelectedChecklistId("");
            setSelectedDocName("");
            fileInputRef.current!.value = "";
            fetchDocuments();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (docId: string) => {
        if (!confirm("Delete this document?")) return;
        try {
            await axios.delete(`/api/students/${studentId}/documents?docId=${docId}`);
            toast.success("Document deleted");
            fetchDocuments();
        } catch {
            toast.error("Failed to delete document");
        }
    };

    const handleChecklistSelect = (id: string) => {
        setSelectedChecklistId(id);
        const found = filteredChecklist.find((c) => c.id === id);
        if (found) setSelectedDocName(found.name);
    };

    return (
        <div className="space-y-4">
            {/* Header Banner */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-xs">
                        Allowed formats: <span className="font-semibold text-foreground">pdf, xls, xlsx, doc, docx, jpeg, jpg, png</span> &nbsp;&bull;&nbsp; Max size: <span className="font-semibold text-foreground">3MB</span>
                    </span>
                </div>
            </div>

            {/* Country Selector */}
            <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Country</span>
                <Select value={selectedCountryId} onValueChange={setSelectedCountryId}>
                    <SelectTrigger className="h-8 w-[180px] text-xs border-border/50 rounded-lg">
                        <SelectValue placeholder="All Countries" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all" className="text-xs">All Countries</SelectItem>
                        {countries.map((c) => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Checklist Tags */}
            {filteredChecklist.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {filteredChecklist.map((item) => {
                        const isSelected = selectedChecklistId === item.id;
                        const isUploaded = documents.some((d) => d.documentName === item.name);
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleChecklistSelect(item.id)}
                                className={`
                                    inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all
                                    ${isSelected
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                                        : isUploaded
                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                            : "bg-background text-foreground border-border/60 hover:border-primary/40 hover:bg-primary/5"
                                    }
                                `}
                            >
                                {item.name}
                                {item.isMandatory && (
                                    <span className={`text-[10px] font-bold ${isSelected ? "text-primary-foreground/70" : "text-destructive"}`}>*</span>
                                )}
                                {isUploaded && !isSelected && (
                                    <span className="text-[8px] text-emerald-500">✓</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Upload Controls */}
            <div className="flex items-center gap-3 flex-wrap">
                <Select
                    value={selectedChecklistId}
                    onValueChange={handleChecklistSelect}
                >
                    <SelectTrigger className="h-9 w-[260px] text-xs border-border/50 rounded-lg">
                        <SelectValue placeholder="Select document type..." />
                    </SelectTrigger>
                    <SelectContent>
                        {filteredChecklist.map((item) => (
                            <SelectItem key={item.id} value={item.id} className="text-xs">
                                {item.name}
                                <span className={`ml-1 text-[10px] ${item.isMandatory ? "text-destructive" : "text-muted-foreground"}`}>
                                    ({item.isMandatory ? "Mandatory" : "Optional"})
                                </span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.xls,.xlsx,.doc,.docx,.jpeg,.jpg,.png"
                    onChange={handleUpload}
                />

                <Button
                    size="sm"
                    className="h-9 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold shadow-sm shadow-primary/20"
                    disabled={isUploading}
                    onClick={() => {
                        if (!selectedChecklistId) {
                            toast.error("Select a document type first");
                            return;
                        }
                        fileInputRef.current?.click();
                    }}
                >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    {isUploading ? "Uploading..." : "Upload Document"}
                </Button>
            </div>

            {/* Uploaded Files Table */}
            <div className="mt-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Uploaded Documents
                    {documents.length > 0 && (
                        <span className="ml-2 bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-bold">{documents.length}</span>
                    )}
                </p>
                {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
                    </div>
                ) : documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-border/60 bg-muted/20">
                        <FolderOpen className="h-10 w-10 text-muted-foreground/30 mb-3" />
                        <p className="text-xs text-muted-foreground font-medium italic">No documents uploaded yet</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">Select a document type and upload a file above</p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-border/60 overflow-hidden">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-muted/40 border-b border-border/60">
                                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-tight text-[10px]">#</th>
                                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-tight text-[10px]">Document Name</th>
                                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-tight text-[10px]">File Name</th>
                                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-tight text-[10px]">Country</th>
                                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-tight text-[10px]">Uploaded By</th>
                                    <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-tight text-[10px]">Date</th>
                                    <th className="text-right px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-tight text-[10px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {documents.map((doc, idx) => (
                                    <tr key={doc.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-3 text-muted-foreground font-medium">{idx + 1}</td>
                                        <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-2">
                                            <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                                            {doc.documentName}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground truncate max-w-[160px]">{doc.fileName}</td>
                                        <td className="px-4 py-3">
                                            {doc.country ? (
                                                <Badge className="text-[10px] font-semibold bg-primary/10 text-primary border-0 rounded-lg py-0 px-2">
                                                    {doc.country.name}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{doc.uploader?.name || "—"}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {new Date(doc.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <a
                                                    href={doc.fileUrl}
                                                    download={doc.fileName}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                                                    title="Download"
                                                >
                                                    <Download className="h-3 w-3" />
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
