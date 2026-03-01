"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    Search, Download, Eye, ChevronLeft, ChevronRight,
    FolderOpen, FileText, Star, Loader2, Users,
    Package, ArrowLeft, MoreVertical, LayoutGrid, List,
    Filter, MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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

export default function FileManagerPage() {
    const { data: session } = useSession() as any;
    const [search, setSearch] = useState("");
    const [source, setSource] = useState("ALL"); // ALL, PARTNER, CRM
    const [students, setStudents] = useState<StudentSummary[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(25);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
    const [documents, setDocuments] = useState<Record<string, StudentDocument[]>>({});
    const [isLoadingDocs, setIsLoadingDocs] = useState<Record<string, boolean>>({});
    const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchStudents = useCallback(async (q: string, p: number, l: number, s: string) => {
        setIsLoadingStudents(true);
        try {
            const params = new URLSearchParams({
                search: q,
                page: p.toString(),
                limit: l.toString(),
                source: s
            });
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
            fetchStudents(search, 1, limit, source);
        }, 350);
        return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
    }, [search, fetchStudents, limit, source]);

    useEffect(() => {
        fetchStudents(search, page, limit, source);
    }, [page, fetchStudents, limit, source]);

    const fetchDocuments = async (studentId: string) => {
        if (documents[studentId]) {
            setExpandedStudentId(studentId);
            return;
        }
        setIsLoadingDocs(prev => ({ ...prev, [studentId]: true }));
        try {
            const res = await axios.get(`/api/file-manager/students/${studentId}/documents`);
            setDocuments(prev => ({ ...prev, [studentId]: res.data }));
            setExpandedStudentId(studentId);
        } catch {
            toast.error("Failed to load documents");
        } finally {
            setIsLoadingDocs(prev => ({ ...prev, [studentId]: false }));
        }
    };

    const handleSingleDownload = (doc: StudentDocument) => {
        const params = new URLSearchParams({ file: doc.fileUrl, name: `${doc.documentName}_${doc.fileName}` });
        window.open(`/api/file-manager/download?${params}`, "_blank");
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-slate-600">Student Document</h1>
                <div className="flex items-center gap-2">
                    <div className="flex bg-white rounded-md border border-slate-200 p-1">
                        <Button
                            variant={source === "ALL" ? "default" : "ghost"}
                            size="sm"
                            className={`h-7 px-3 text-[10px] font-bold uppercase rounded-sm ${source === "ALL" ? "bg-[#3B4264] hover:bg-[#2D3350]" : "text-slate-500 hover:bg-slate-50"}`}
                            onClick={() => setSource("ALL")}
                        >
                            All
                        </Button>
                        <Button
                            variant={source === "PARTNER" ? "default" : "ghost"}
                            size="sm"
                            className={`h-7 px-3 text-[10px] font-bold uppercase rounded-sm ${source === "PARTNER" ? "bg-[#3B4264] hover:bg-[#2D3350]" : "text-slate-500 hover:bg-slate-50"}`}
                            onClick={() => setSource("PARTNER")}
                        >
                            Partner Student
                        </Button>
                        <Button
                            variant={source === "CRM" ? "default" : "ghost"}
                            size="sm"
                            className={`h-7 px-3 text-[10px] font-bold uppercase rounded-sm ${source === "CRM" ? "bg-[#3B4264] hover:bg-[#2D3350]" : "text-slate-500 hover:bg-slate-50"}`}
                            onClick={() => setSource("CRM")}
                        >
                            CRM Student
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
                            <SelectTrigger className="w-[180px] h-10 border-slate-200">
                                <SelectValue placeholder="Records Per Page" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10 Records Per Page</SelectItem>
                                <SelectItem value="25">25 Records Per Page</SelectItem>
                                <SelectItem value="50">50 Records Per Page</SelectItem>
                                <SelectItem value="100">100 Records Per Page</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="relative w-full md:w-[400px]">
                        <Input
                            placeholder="Name / Email / Mobile / Student ID"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-10 pl-4 pr-10 border-slate-200 placeholder:text-slate-400 placeholder:text-sm"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                </div>
            </div>

            {/* Student Grid */}
            <div className="min-h-[500px]">
                {isLoadingStudents ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <Loader2 className="h-10 w-10 text-[#3B4264] animate-spin" />
                        <p className="text-slate-400 font-medium">Loading students...</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center text-slate-400 bg-white rounded-xl border-2 border-dashed border-slate-100">
                        <FolderOpen className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">No results found for your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                        {students.map((student) => (
                            <motion.div
                                key={student.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                                onClick={() => fetchDocuments(student.id)}
                            >
                                <div className="p-6 flex flex-col items-center text-center gap-4">
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Download className="h-4 w-4 text-slate-400 hover:text-[#3B4264]" />
                                    </div>

                                    <div className="relative">
                                        <div className="bg-yellow-400/10 p-3 rounded-full group-hover:bg-yellow-400/20 transition-colors">
                                            <svg className="w-16 h-16 text-[#FFD43B]" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="font-bold text-slate-700 text-sm group-hover:text-[#3B4264] transition-colors line-clamp-1 px-2">
                                            {student.name}
                                        </h3>
                                        <p className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">
                                            {student.id.split('-')[0]} / {student.phone.slice(-4)}
                                        </p>
                                    </div>
                                </div>
                                {isLoadingDocs[student.id] && (
                                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 text-[#3B4264] animate-spin" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination & Footer Info */}
            <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-slate-200 gap-4">
                <div className="text-sm font-semibold text-slate-600">
                    Total Records - {total}
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="h-8 w-8 rounded-md border-slate-200 disabled:opacity-30"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center gap-1 px-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                                .map((p, i, arr) => (
                                    <span key={p} className="flex items-center gap-1">
                                        {i > 0 && p !== arr[i - 1] + 1 && <span className="text-slate-400">...</span>}
                                        <button
                                            onClick={() => setPage(p)}
                                            className={`h-8 w-8 rounded-md text-xs font-bold transition-all ${page === p ? "bg-[#3B4264] text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}
                                        >
                                            {p}
                                        </button>
                                    </span>
                                ))
                            }
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="h-8 w-8 rounded-md border-slate-200 disabled:opacity-30"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Documents Modal or Selection View */}
            <AnimatePresence>
                {expandedStudentId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setExpandedStudentId(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="hidden sm:flex h-12 w-12 rounded-xl bg-yellow-400/20 items-center justify-center text-yellow-600 font-bold">
                                        {students.find(s => s.id === expandedStudentId)?.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">
                                            {students.find(s => s.id === expandedStudentId)?.name}'s Documents
                                        </h2>
                                        <p className="text-sm text-slate-500 font-medium">Manage and view uploaded files</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setExpandedStudentId(null)} className="rounded-full">
                                    <ChevronRight className="h-6 w-6 rotate-45" />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {documents[expandedStudentId]?.map(doc => (
                                        <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-slate-200">
                                                    <FileText className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-700 text-sm">{doc.documentName}</p>
                                                    <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{doc.fileName}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-9 w-9 text-slate-400 hover:text-[#3B4264] hover:bg-white"
                                                    onClick={() => setPreviewFile({ url: doc.fileUrl, name: doc.documentName })}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-9 w-9 text-slate-400 hover:text-emerald-600 hover:bg-white"
                                                    onClick={() => handleSingleDownload(doc)}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!documents[expandedStudentId] || documents[expandedStudentId].length === 0) && (
                                        <div className="col-span-full py-12 text-center text-slate-400 font-medium">
                                            No documents found for this student.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
