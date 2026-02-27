"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    Search, Download, Eye, ChevronDown, ChevronRight,
    FolderOpen, FileText, Star, Loader2, Users,
    CheckSquare, Square, Package, ArrowLeft, MoreVertical
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import FilePreviewModal from "@/components/dashboard/FilePreviewModal";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

interface StudentSummary {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    createdAt: string;
    _count: { documents: number };
}

interface StudentDocument {
    id: string;
    fileName: string;
    fileUrl: string;
    documentName: string;
    isMandatory: boolean;
    documentFor: string;
    createdAt: string;
    uploader: { name: string; role: string };
    country: { name: string } | null;
}

const ROLE_LABELS: Record<string, string> = {
    ADMIN: "Admin",
    MANAGER: "Manager",
    COUNSELOR: "Counselor",
    AGENT: "Agent",
    SALES_REP: "Sales Rep",
    SUPPORT_AGENT: "Support Agent",
    EMPLOYEE: "Employee",
};

export default function FileManagerPage() {
    const { data: session } = useSession() as any;
    const [search, setSearch] = useState("");
    const [students, setStudents] = useState<StudentSummary[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
    const [documents, setDocuments] = useState<Record<string, StudentDocument[]>>({});
    const [isLoadingDocs, setIsLoadingDocs] = useState<Record<string, boolean>>({});
    const [selectedDocs, setSelectedDocs] = useState<Record<string, Set<string>>>({});
    const [isDownloadingZip, setIsDownloadingZip] = useState<Record<string, boolean>>({});

    const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchStudents = useCallback(async (q: string, p: number) => {
        setIsLoadingStudents(true);
        try {
            const params = new URLSearchParams({ search: q, page: p.toString(), limit: "15" });
            const res = await axios.get(`/api/file-manager/students?${params}`);
            setStudents(res.data.students);
            setTotal(res.data.pagination.total);
            setTotalPages(res.data.pagination.totalPages);
        } catch {
            toast.error("Failed to load students");
        } finally {
            setIsLoadingStudents(false);
        }
    }, []);

    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setPage(1);
            fetchStudents(search, 1);
        }, 350);
        return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
    }, [search, fetchStudents]);

    useEffect(() => {
        fetchStudents(search, page);
    }, [page, fetchStudents]);

    const fetchDocuments = async (studentId: string) => {
        if (documents[studentId]) return; // cached
        setIsLoadingDocs(prev => ({ ...prev, [studentId]: true }));
        try {
            const res = await axios.get(`/api/file-manager/students/${studentId}/documents`);
            setDocuments(prev => ({ ...prev, [studentId]: res.data }));
        } catch {
            toast.error("Failed to load documents");
        } finally {
            setIsLoadingDocs(prev => ({ ...prev, [studentId]: false }));
        }
    };

    const toggleStudent = (studentId: string) => {
        if (expandedStudentId === studentId) {
            setExpandedStudentId(null);
        } else {
            setExpandedStudentId(studentId);
            fetchDocuments(studentId);
        }
    };

    const toggleDocSelection = (studentId: string, docId: string) => {
        setSelectedDocs(prev => {
            const set = new Set(prev[studentId] || []);
            if (set.has(docId)) set.delete(docId);
            else set.add(docId);
            return { ...prev, [studentId]: set };
        });
    };

    const toggleAllDocs = (studentId: string) => {
        const docs = documents[studentId] || [];
        const selected = selectedDocs[studentId] || new Set();
        if (selected.size === docs.length) {
            setSelectedDocs(prev => ({ ...prev, [studentId]: new Set() }));
        } else {
            setSelectedDocs(prev => ({ ...prev, [studentId]: new Set(docs.map(d => d.id)) }));
        }
    };

    const handleDownloadZip = async (studentId: string, studentName: string) => {
        const docs = documents[studentId] || [];
        const selected = selectedDocs[studentId];
        const filesToDownload = selected && selected.size > 0
            ? docs.filter(d => selected.has(d.id))
            : docs;

        if (!filesToDownload.length) {
            toast.info("No documents to download");
            return;
        }

        setIsDownloadingZip(prev => ({ ...prev, [studentId]: true }));
        try {
            const res = await axios.post(
                `/api/file-manager/download`,
                { files: filesToDownload.map(d => ({ url: d.fileUrl, name: `${d.documentName}_${d.fileName}` })) },
                { responseType: "blob" }
            );
            const url = URL.createObjectURL(new Blob([res.data], { type: "application/zip" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = `${studentName.replace(/\s+/g, "_")}_documents.zip`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error("Download failed");
        } finally {
            setIsDownloadingZip(prev => ({ ...prev, [studentId]: false }));
        }
    };

    const handleSingleDownload = (fileUrl: string, fileName: string, documentName: string) => {
        const params = new URLSearchParams({ file: fileUrl, name: `${documentName}_${fileName}` });
        window.open(`/api/file-manager/download?${params}`, "_blank");
    };

    const formatRole = (role: string) => ROLE_LABELS[role] || role;

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header section with back button and search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
                            <FolderOpen className="h-7 w-7" />
                        </div>
                        File Manager
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Access and manage all student documents with quick search and batch downloads.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Find students..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-11 pr-4 h-12 w-full md:w-[320px] bg-white border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Quick Stats/Filters (Optional but adds value) */}
            <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="px-3 py-1.5 rounded-xl border-slate-200 bg-white text-slate-600 font-semibold gap-2">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    {total} Total Students
                </Badge>
                {search && (
                    <Badge variant="secondary" className="px-3 py-1.5 rounded-xl bg-primary/5 text-primary font-bold border-0">
                        Results for "{search}"
                    </Badge>
                )}
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="min-h-[400px]">
                    {isLoadingStudents ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <div className="relative">
                                <div className="h-16 w-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                                <FolderOpen className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
                            </div>
                            <p className="text-slate-400 font-bold animate-pulse text-sm">Searching records...</p>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto">
                                <Users className="h-12 w-12 text-slate-200" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">No students found</h3>
                                <p className="text-slate-400 mt-1 max-w-xs mx-auto">Try adjusting your search or filters to find what you're looking for.</p>
                            </div>
                            <Button variant="outline" onClick={() => setSearch("")} className="rounded-xl px-6">
                                Clear search
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {students.map((student, index) => {
                                const isExpanded = expandedStudentId === student.id;
                                const docs = documents[student.id] || [];
                                const isLoadingD = isLoadingDocs[student.id];
                                const selected = selectedDocs[student.id] || new Set();
                                const isZipping = isDownloadingZip[student.id];

                                return (
                                    <div key={student.id} className={`group transition-all duration-300 ${isExpanded ? "bg-slate-50/50" : "hover:bg-slate-50"}`}>
                                        <div
                                            className="flex items-center gap-4 px-6 py-5 cursor-pointer"
                                            onClick={() => toggleStudent(student.id)}
                                        >
                                            <div className="relative shrink-0">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black transition-all duration-300 ${isExpanded ? "bg-primary text-white scale-110 shadow-lg shadow-primary/30" : "bg-slate-100 text-slate-400 group-hover:bg-primary/20 group-hover:text-primary group-hover:scale-105"}`}>
                                                    {student.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full border-2 border-slate-50 flex items-center justify-center shadow-sm">
                                                    <span className="text-[10px] font-bold text-slate-600">{student._count.documents}</span>
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-bold text-slate-800 truncate leading-tight">{student.name}</h3>
                                                    {isExpanded && (
                                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-[10px] px-2 h-5 rounded-lg capitalize font-bold">
                                                            Active Session
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 font-medium">
                                                    <span>{student.email || "No email"}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                    <span>{student.phone}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 shrink-0">
                                                <div className="hidden sm:flex flex-col items-end mr-4">
                                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Created</span>
                                                    <span className="text-sm font-semibold text-slate-700">
                                                        {new Date(student.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                                                    </span>
                                                </div>
                                                <div className={`p-2 rounded-xl transition-all duration-300 ${isExpanded ? "bg-primary/10 text-primary rotate-180" : "bg-slate-100/50 text-slate-400"}`}>
                                                    <ChevronDown className="h-5 w-5" />
                                                </div>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                    className="overflow-hidden bg-white border-t border-slate-100"
                                                >
                                                    <div className="p-6">
                                                        {/* Document Controls */}
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                                                            <div className="flex items-center gap-3">
                                                                <Checkbox
                                                                    id={`select-all-${student.id}`}
                                                                    checked={docs.length > 0 && selected.size === docs.length}
                                                                    onCheckedChange={() => toggleAllDocs(student.id)}
                                                                    className="h-5 w-5 rounded-lg border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                                />
                                                                <label htmlFor={`select-all-${student.id}`} className="text-sm font-bold text-slate-700 cursor-pointer">
                                                                    {selected.size > 0 ? `${selected.size} items selected` : "Select all documents"}
                                                                </label>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    onClick={() => handleDownloadZip(student.id, student.name)}
                                                                    disabled={isZipping || docs.length === 0}
                                                                    className="h-10 px-5 bg-primary hover:bg-primary/90 rounded-xl gap-2 shadow-lg shadow-primary/20 font-bold"
                                                                >
                                                                    {isZipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                                                                    {selected.size > 0 ? `Download Selected (${selected.size})` : "Download All Records"}
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* Documents Table/List */}
                                                        {isLoadingD ? (
                                                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                                                <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                                                                <p className="text-xs font-bold text-slate-400">Fetching documents...</p>
                                                            </div>
                                                        ) : docs.length === 0 ? (
                                                            <div className="text-center py-16 bg-slate-50/30 rounded-3xl border-2 border-dashed border-slate-100">
                                                                <FileText className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                                                <p className="text-slate-400 font-medium">This student doesn't have any documents yet.</p>
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                {docs.map(doc => (
                                                                    <div key={doc.id} className={`relative flex flex-col p-4 rounded-2xl border transition-all duration-300 ${selected.has(doc.id) ? "bg-primary/5 border-primary/20 ring-1 ring-primary/20 shadow-lg shadow-primary/5" : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-md"}`}>
                                                                        <div className="flex items-start justify-between gap-2 mb-3">
                                                                            <div className="p-2.5 bg-slate-100 rounded-xl">
                                                                                <FileText className={`h-6 w-6 ${selected.has(doc.id) ? "text-primary" : "text-slate-400"}`} />
                                                                            </div>
                                                                            <Checkbox
                                                                                checked={selected.has(doc.id)}
                                                                                onCheckedChange={() => toggleDocSelection(student.id, doc.id)}
                                                                                className="h-5 w-5 rounded-lg border-slate-300 data-[state=checked]:bg-primary"
                                                                            />
                                                                        </div>

                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-1.5 mb-1 min-w-0">
                                                                                <h4 className="font-bold text-slate-800 text-sm truncate">{doc.documentName}</h4>
                                                                                {doc.isMandatory && (
                                                                                    <div className="shrink-0 h-4 w-4 rounded-full bg-red-100 flex items-center justify-center" title="Mandatory">
                                                                                        <Star className="h-2.5 w-2.5 text-red-600 fill-red-600" />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <p className="text-[11px] text-slate-400 truncate mb-4">{doc.fileName}</p>

                                                                            <div className="flex flex-wrap gap-2 mb-4">
                                                                                <Badge variant="outline" className="text-[9px] py-0 px-1.5 rounded-lg border-slate-200 text-slate-500 font-bold bg-slate-50">
                                                                                    {doc.documentFor}
                                                                                </Badge>
                                                                                {doc.country && (
                                                                                    <Badge variant="outline" className="text-[9px] py-0 px-1.5 rounded-lg border-slate-200 text-slate-500 font-bold">
                                                                                        {doc.country.name}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                                                    Upload By
                                                                                </span>
                                                                                <span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">
                                                                                    {doc.uploader.name}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5">
                                                                                <Button
                                                                                    size="icon"
                                                                                    variant="ghost"
                                                                                    onClick={() => setPreviewFile({ url: doc.fileUrl, name: doc.documentName })}
                                                                                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                                                                >
                                                                                    <Eye className="h-4 w-4" />
                                                                                </Button>
                                                                                <Button
                                                                                    size="icon"
                                                                                    variant="ghost"
                                                                                    onClick={() => handleSingleDownload(doc.fileUrl, doc.fileName, doc.documentName)}
                                                                                    className="h-8 w-8 rounded-lg hover:bg-emerald-50 hover:text-emerald-600"
                                                                                >
                                                                                    <Download className="h-4 w-4" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-8 py-6 bg-slate-50 border-t border-slate-100 flex-wrap gap-4">
                        <div className="text-sm font-bold text-slate-500">
                            Showing page <span className="text-primary">{page}</span> of <span className="text-slate-800">{totalPages}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                                className="h-10 px-5 rounded-xl border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all font-bold"
                            >
                                Previous
                            </Button>

                            {/* Page numbers (Simplified) */}
                            <div className="flex items-center gap-1 px-2">
                                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                    const pageNum = i + 1; // Basic logic, could be improved for many pages
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setPage(pageNum)}
                                            className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${page === pageNum ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-slate-800 hover:bg-slate-100"}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                {totalPages > 5 && <span className="text-slate-400 mx-1">...</span>}
                            </div>

                            <Button
                                variant="outline"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                                className="h-10 px-5 rounded-xl border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all font-bold"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* File Preview Modal */}
            {previewFile && (
                <FilePreviewModal
                    fileUrl={previewFile.url}
                    fileName={previewFile.name}
                    onClose={() => setPreviewFile(null)}
                />
            )}
        </div>
    );
}
