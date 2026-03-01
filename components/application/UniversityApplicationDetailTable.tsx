"use client";

import { useState } from "react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Pencil,
    Trash2,
    ExternalLink,
    FileDown,
    Plus,
    Search,
    CheckCircle,
    Plane
} from "lucide-react";
import { Application } from "@/types/api";
import axios from "axios";
import { toast } from "sonner";
import { MoveToVisaModal } from "@/components/applications/MoveToVisaModal";
import { OfferLetterModal } from "@/components/applications/OfferLetterModal";
import { ApplicationCommentsModal } from "@/components/applications/ApplicationCommentsModal";
import { Eye, History } from "lucide-react";

interface UniversityApplicationDetailTableProps {
    applications: Application[];
    onEdit?: (application: Application) => void;
    onDelete?: (id: string) => void;
    onUpdate?: () => void;
    onAdd?: () => void;
}

export function UniversityApplicationDetailTable({
    applications,
    onEdit,
    onDelete,
    onUpdate,
    onAdd
}: UniversityApplicationDetailTableProps) {
    const [isMoveToVisaOpen, setIsMoveToVisaOpen] = useState(false);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [offerLetterApp, setOfferLetterApp] = useState<any>(null);
    const [commentsApp, setCommentsApp] = useState<any>(null);

    const handleMoveToVisaClick = (app: Application) => {
        setSelectedApp(app);
        setIsMoveToVisaOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "NEW": return "bg-blue-500/10 text-blue-600 border-blue-200";
            case "SUBMITTED": return "bg-amber-500/10 text-amber-600 border-amber-200";
            case "FINALIZED": return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
            case "DEFERRED": return "bg-pink-500/10 text-pink-600 border-pink-200";
            default: return "bg-slate-500/10 text-slate-600 border-slate-200";
        }
    };

    const handleFinalize = async (appId: string) => {
        try {
            await axios.put(`/api/applications/${appId}`, { status: "FINALIZED" });
            toast.success("Application finalized successfully");
            onUpdate?.();
        } catch (error) {
            console.error("Failed to finalize application:", error);
            toast.error("Failed to finalize application");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground/80">University Application</h3>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[11px] font-semibold flex items-center gap-1.5 rounded-lg border-primary/20 hover:bg-primary/5 text-primary"
                        onClick={onAdd}
                    >
                        <Plus className="h-3 w-3" />
                        Add University Application
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-[11px] font-semibold flex items-center gap-1.5 rounded-lg border-emerald-600/20 hover:bg-emerald-50 text-emerald-700">
                        <Search className="h-3 w-3" />
                        Apply Through Course Finder
                    </Button>
                </div>
            </div>

            <div className="rounded-xl border border-border/60 overflow-hidden bg-white shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3">Action</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3">Created - Updated</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3">Country</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3">University</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3">Course</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3">Intake</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3">Associate</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3">Deadline Date</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3">Status</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3 text-right pr-6">Management</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applications.filter(app => !["READY_FOR_VISA", "DEFERRED", "ENROLLED"].includes(app.status)).length > 0 ? (
                            applications.filter(app => !["READY_FOR_VISA", "DEFERRED", "ENROLLED"].includes(app.status)).map((app) => (
                                <TableRow key={app.id} className="hover:bg-muted/20 border-border/40">
                                    <TableCell className="py-3">
                                        <div className="flex items-center gap-1">
                                            {app.status !== "FINALIZED" && app.status !== "READY_FOR_VISA" && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-md text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                    onClick={() => handleFinalize(app.id)}
                                                    title="Finalize Application"
                                                >
                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5"
                                                onClick={() => onEdit?.(app)}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                                onClick={() => onDelete?.(app.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>

                                            {(app.status === "FINALIZED" || app.status === "OFFER_RECEIVED") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-md text-primary hover:text-primary hover:bg-primary/5"
                                                    onClick={() => handleMoveToVisaClick(app)}
                                                    title="Move to Visa"
                                                >
                                                    <Plane className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[11px] font-medium text-foreground">{new Date(app.createdAt).toLocaleDateString()}</span>
                                            <span className="text-[10px] text-muted-foreground">{new Date(app.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <span className="text-[11px] font-semibold text-foreground/80">{app.country?.name || 'N/A'}</span>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <span className="text-[11px] font-bold text-primary truncate max-w-[150px] block">{(app as any).universityName || app.university?.name || 'N/A'}</span>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <span className="text-[11px] font-medium text-foreground">{(app as any).courseName || (app as any).course?.name || 'N/A'}</span>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <span className="text-[10px] text-muted-foreground italic">{app.intake || 'N/A'}</span>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <span className="text-[11px] font-medium text-slate-600">{app.associate?.name || 'Not Assigned'}</span>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <span className="text-[11px] font-medium text-rose-600">
                                            {app.deadlineDate ? new Date(app.deadlineDate).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <Badge className={`text-[9px] font-bold px-2 py-0.5 rounded-md border shadow-none ${getStatusColor(app.status)}`}>
                                            {app.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-3 text-right pr-6">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCommentsApp(app)}
                                                className="h-8 px-2 text-[10px] font-bold border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                                            >
                                                <History className="h-3.5 w-3.5 mr-1" /> History
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={10} className="h-32 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground/40">
                                        <Plus className="h-8 w-8 mb-2 opacity-20" />
                                        <p className="text-xs font-medium italic">No university applications tracked yet</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <MoveToVisaModal
                isOpen={isMoveToVisaOpen}
                onClose={() => setIsMoveToVisaOpen(false)}
                application={selectedApp}
                onSuccess={() => {
                    onUpdate?.();
                    setIsMoveToVisaOpen(false);
                }}
            />

            <OfferLetterModal
                isOpen={!!offerLetterApp}
                onClose={() => setOfferLetterApp(null)}
                application={offerLetterApp}
                onUpdate={onUpdate}
            />

            <ApplicationCommentsModal
                isOpen={!!commentsApp}
                onClose={() => setCommentsApp(null)}
                application={commentsApp}
                onUpdate={onUpdate}
            />
        </div >
    );
}
