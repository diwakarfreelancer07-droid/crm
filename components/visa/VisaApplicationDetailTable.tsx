"use client";

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
    Plus,
    FileText,
    History,
    MessageSquare,
    Globe,
    School
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { VisaStatus } from "@prisma/client";
import { useUpdateVisaApplication } from "@/hooks/useApi";
import { ArrowRightLeft, CheckSquare } from "lucide-react";

interface VisaApplicationDetailTableProps {
    applications: any[];
    onUpdate?: () => void;
    onOpenHistory?: (app: any) => void;
    onOpenNotes?: (app: any) => void;
}

export function VisaApplicationDetailTable({
    applications,
    onUpdate,
    onOpenHistory,
    onOpenNotes
}: VisaApplicationDetailTableProps) {

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "VISA_APPROVED":
            case "VISA_GRANTED":
                return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "VISA_REJECTED":
            case "VISA_REFUSED":
                return "bg-rose-100 text-rose-700 border-rose-200";
            case "VISA_WITHDRAWN":
                return "bg-slate-100 text-slate-700 border-slate-200";
            case "VISA_APPLICATION_SUBMITTED":
            case "BIOMETRICS_SCHEDULED":
            case "INTERVIEW_SCHEDULED":
                return "bg-amber-100 text-amber-700 border-amber-200";
            case "UNDER_REVIEW":
            case "VISA_APPLICATION_IN_PROGRESS":
                return "bg-purple-100 text-purple-700 border-purple-200";
            default:
                return "bg-blue-50 text-blue-600 border-blue-100";
        }
    };

    const updateMutation = useUpdateVisaApplication();

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await updateMutation.mutateAsync({
                id,
                data: { status: newStatus }
            });
            toast.success("Visa status updated");
            onUpdate?.();
        } catch (error) {
            console.error("Failed to update status:", error);
            toast.error("Failed to update status");
        }
    };

    const statusOptions = Object.values(VisaStatus);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground/80 lowercase first-letter:uppercase">Visa Application</h3>
                </div>
            </div>

            <div className="rounded-xl border border-border/60 overflow-hidden bg-white shadow-sm overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3">Created - Updated</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3">Name</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3">Email / Mobile</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3">Applied Country / University</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3">Course</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3 text-center">Intake</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3">Visa Status</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3">Reason</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3">Created By</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-3 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applications.length > 0 ? (
                            applications.map((app) => (
                                <TableRow key={app.id} className="hover:bg-muted/20 border-border/40">
                                    <TableCell className="py-3">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[11px] font-medium text-foreground">{new Date(app.createdAt).toLocaleDateString()} {new Date(app.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className="text-[10px] text-muted-foreground">{new Date(app.updatedAt).toLocaleDateString()} {new Date(app.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-[11px] font-bold text-slate-700">{app.student?.name}</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 px-2 text-[10px] font-bold gap-1 rounded-md border-slate-200"
                                                onClick={() => onOpenNotes?.(app)}
                                            >
                                                <Plus className="h-3 w-3" /> Notes
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[11px] font-medium text-slate-600">{app.student?.email}</span>
                                            <span className="text-[11px] font-medium text-slate-600">{app.student?.phone}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="flex flex-col gap-1">
                                            <Badge variant="outline" className="w-fit text-[9px] font-bold border-slate-200 bg-slate-50 text-slate-600">
                                                {app.country?.name}
                                            </Badge>
                                            <span className="text-[11px] font-medium text-slate-600">{app.university?.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <span className="text-[11px] font-medium text-slate-700">{app.course?.name || app.universityApplication?.intendedCourse || "N/A"}</span>
                                    </TableCell>
                                    <TableCell className="py-3 text-center">
                                        <span className="text-[11px] font-medium text-slate-600">{app.intake || "N/A"}</span>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <Select
                                            value={app.status}
                                            onValueChange={(val) => handleStatusUpdate(app.id, val)}
                                        >
                                            <SelectTrigger className={`h-8 w-[160px] text-[10px] font-bold rounded-lg border-none shadow-none ${getStatusStyle(app.status)}`}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px]">
                                                {statusOptions.map((status) => (
                                                    <SelectItem key={status} value={status} className="text-[10px] font-medium">
                                                        {status.replace(/_/g, ' ')}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <span className="text-[11px] text-slate-500 italic">{app.remarks || "—"}</span>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[11px] font-medium text-slate-700">{app.assignedOfficer?.name || "System"}</span>
                                            <span className="text-[10px] text-muted-foreground">({app.assignedOfficer?.role?.toLowerCase() || "system"})</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    handleStatusUpdate(app.id, "DEFERRED");
                                                }}
                                                className="h-7 px-2 text-[10px] font-bold border-pink-200 text-pink-600 hover:bg-pink-50"
                                            >
                                                <ArrowRightLeft className="h-3 w-3 mr-1" /> Defer
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    handleStatusUpdate(app.id, "ENROLLED");
                                                }}
                                                className="h-7 px-2 text-[10px] font-bold border-cyan-200 text-cyan-600 hover:bg-cyan-50"
                                            >
                                                <CheckSquare className="h-3 w-3 mr-1" /> Enroll
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground italic text-xs">
                                    No visa application details found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
