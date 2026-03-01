"use client";
import { toast } from "sonner";

import {
    useReactTable,
    getCoreRowModel,
    ColumnDef,
    flexRender,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Trash2, Calendar, Globe, School, User, CheckCircle2, Clock, XCircle, AlertCircle, Plus, History, Undo2, CheckSquare, ArrowRightLeft } from "lucide-react";
import { VisaStatus, VisaType } from "@prisma/client";
import { useUpdateVisaApplication } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useRolePath } from "@/hooks/use-role-path";

interface VisaApplicationsTableProps {
    data: any[];
    onUpdate: () => void;
    onDelete: (id: string) => void;
    onOpenHistory?: (app: any) => void;
    onOpenComments?: (app: any) => void;
    onOpenOfferLetters?: (app: any) => void;
    onOpenNotes?: (app: any) => void;
}

export function VisaApplicationsTable({
    data,
    onUpdate,
    onDelete,
    onOpenHistory,
    onOpenComments,
    onOpenOfferLetters,
    onOpenNotes
}: VisaApplicationsTableProps) {
    const router = useRouter();
    const { prefixPath } = useRolePath();
    const updateMutation = useUpdateVisaApplication();

    const getStatusStyle = (status: VisaStatus) => {
        switch (status) {
            case "VISA_APPROVED":
            case "VISA_GRANTED":
                return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "VISA_REJECTED":
            case "VISA_REFUSED":
                return "bg-red-100 text-red-700 border-red-200";
            case "VISA_WITHDRAWN":
                return "bg-slate-100 text-slate-700 border-slate-200";
            case "VISA_APPLICATION_SUBMITTED":
            case "BIOMETRICS_SCHEDULED":
            case "INTERVIEW_SCHEDULED":
                return "bg-amber-100 text-amber-700 border-amber-200";
            case "UNDER_REVIEW":
            case "VISA_APPLICATION_IN_PROGRESS":
                return "bg-purple-100 text-purple-700 border-purple-200";
            case "DOCUMENTS_RECEIVED":
            case "DOCUMENTS_VERIFIED":
            case "BIOMETRICS_COMPLETED":
            case "INTERVIEW_COMPLETED":
                return "bg-cyan-100 text-cyan-700 border-cyan-200";
            case "DOCUMENTS_PENDING":
            case "FINANCIAL_DOCUMENTS_PENDING":
            case "SPONSORSHIP_DOCUMENTS_PENDING":
            case "ADDITIONAL_DOCUMENTS_REQUESTED":
                return "bg-rose-50 text-rose-600 border-rose-100";
            case "VISA_GUIDANCE_GIVEN":
            case "DOCUMENTS_CHECKLIST_SHARED":
                return "bg-indigo-50 text-indigo-600 border-indigo-100";
            default:
                return "bg-blue-50 text-blue-600 border-blue-100";
        }
    };

    const statusOptions: { value: VisaStatus; label: string }[] = [
        { value: "VISA_GUIDANCE_GIVEN", label: "Visa Guidance Given" },
        { value: "DOCUMENTS_CHECKLIST_SHARED", label: "Documents Checklist Shared" },
        { value: "DOCUMENTS_PENDING", label: "Documents Pending" },
        { value: "DOCUMENTS_RECEIVED", label: "Documents Received" },
        { value: "DOCUMENTS_VERIFIED", label: "Documents Verified" },
        { value: "FINANCIAL_DOCUMENTS_PENDING", label: "Financial Documents Pending" },
        { value: "SPONSORSHIP_DOCUMENTS_PENDING", label: "Sponsorship Documents Pending" },
        { value: "VISA_APPLICATION_IN_PROGRESS", label: "Visa Application In Progress" },
        { value: "VISA_APPLICATION_SUBMITTED", label: "Visa Application Submitted" },
        { value: "BIOMETRICS_SCHEDULED", label: "Biometrics Scheduled" },
        { value: "BIOMETRICS_COMPLETED", label: "Biometrics Completed" },
        { value: "UNDER_REVIEW", label: "Under Review" },
        { value: "ADDITIONAL_DOCUMENTS_REQUESTED", label: "Additional Documents Requested" },
        { value: "INTERVIEW_SCHEDULED", label: "Interview Scheduled" },
        { value: "INTERVIEW_COMPLETED", label: "Interview Completed" },
        { value: "VISA_APPROVED", label: "Visa Approved" },
        { value: "VISA_GRANTED", label: "Visa Granted" },
        { value: "VISA_REFUSED", label: "Visa Refused" },
        { value: "VISA_REJECTED", label: "Visa Rejected" },
        { value: "VISA_WITHDRAWN", label: "Visa Withdrawn" },
        { value: "PENDING", label: "Pending" },
    ];

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "timestamps",
            header: "Created - Updated",
            cell: ({ row }) => (
                <div className="flex flex-col text-[11px] font-medium text-muted-foreground">
                    <span>{new Date(row.original.createdAt).toLocaleString()}</span>
                    <span>{new Date(row.original.updatedAt).toLocaleString()}</span>
                </div>
            ),
        },
        {
            accessorKey: "student",
            header: "Name",
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <span className="font-bold text-slate-700">{row.original.student?.name}</span>
                    <Button variant="outline" size="xs" className="h-6 w-fit px-2 text-[10px] font-bold rounded-md bg-slate-50 border-slate-200">
                        + Notes
                    </Button>
                </div>
            ),
        },
        {
            accessorKey: "contact",
            header: "Email / Mobile",
            cell: ({ row }) => (
                <div className="flex flex-col text-xs font-medium text-slate-600">
                    <span className="text-primary">{row.original.student?.email || "-"}</span>
                    <span>{row.original.student?.phone || "-"}</span>
                </div>
            ),
        },
        {
            accessorKey: "appliedAt",
            header: "Applied Country / University",
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <Badge variant="outline" className="w-fit h-5 px-1.5 text-[9px] font-bold uppercase rounded bg-slate-100 border-slate-200 text-slate-600">
                        {row.original.country?.name}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-700">
                        {row.original.university?.name || row.original.universityApplication?.university?.name || "-"}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "course",
            header: "Course",
            cell: ({ row }) => (
                <span className="text-xs font-semibold text-slate-700">
                    {row.original.course?.name || row.original.courseName || row.original.universityApplication?.courseName || "-"}
                </span>
            ),
        },
        {
            accessorKey: "intake",
            header: "Intake",
            cell: ({ row }) => (
                <span className="text-xs font-semibold text-slate-600">
                    {row.original.intake || row.original.universityApplication?.intake || "-"}
                </span>
            ),
        },
        {
            accessorKey: "status",
            header: "Visa Status",
            cell: ({ row }) => {
                const status = row.original.status as VisaStatus;
                const visaId = row.original.id;

                const handleStatusChange = async (newStatus: VisaStatus) => {
                    if (newStatus === status) return;
                    try {
                        await updateMutation.mutateAsync({
                            id: visaId,
                            data: { status: newStatus }
                        });
                        onUpdate();
                    } catch (error) {
                        console.error("Failed to update status", error);
                    }
                };

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div className={`flex items-center justify-between w-52 h-9 px-3 py-1 border rounded-md cursor-pointer transition-colors shadow-sm font-bold ${getStatusStyle(status)}`}>
                                <span className="text-[11px]">
                                    {statusOptions.find(o => o.value === status)?.label || status.replace(/_/g, ' ')}
                                </span>
                                <MoreHorizontal className="h-3 w-3 opacity-50 rotate-90" />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 h-[300px] overflow-y-auto rounded-md shadow-xl p-0 border-slate-200 bg-white">
                            {statusOptions.map((s) => (
                                <DropdownMenuItem
                                    key={s.value}
                                    onClick={() => handleStatusChange(s.value)}
                                    className={`cursor-pointer py-2 px-3 text-xs leading-none transition-colors ${status === s.value ? "bg-[#3e3a8e] text-white" : "hover:bg-slate-50 text-slate-700"}`}
                                >
                                    {s.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            }
        },
        {
            accessorKey: "reason",
            header: "Reason",
            cell: ({ row }) => (
                <div className="w-32 h-9 border border-slate-200 rounded bg-white" />
            ),
        },
        {
            accessorKey: "assignedOfficer",
            header: "Created By",
            cell: ({ row }) => (
                <div className="flex flex-col text-[11px] font-medium leading-tight">
                    <span className="text-slate-800 font-bold">{row.original.assignedOfficer?.name || "System"}</span>
                    <span className="text-muted-foreground">({row.original.assignedOfficer?.role || "Admin"})</span>
                </div>
            ),
        },
        {
            id: "management",
            header: "Management",
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (row.original.universityApplication) {
                                onOpenComments?.(row.original.universityApplication);
                            } else {
                                toast.error("No linked university application found");
                            }
                        }}
                        className="h-7 px-2 text-[9px] font-bold border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm rounded-lg"
                    >
                        <History className="h-3 w-3 mr-1" /> History
                    </Button>

                    {!["DEFERRED", "ENROLLED"].includes(row.original.status) ? (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                        await updateMutation.mutateAsync({
                                            id: row.original.id,
                                            data: { status: "DEFERRED" as any }
                                        });
                                        toast.success("Moved to Defer");
                                        onUpdate();
                                    } catch (error) {
                                        toast.error("Failed to defer");
                                    }
                                }}
                                className="h-7 px-2 text-[9px] font-bold border-pink-200 text-pink-600 hover:bg-pink-50 rounded-lg"
                            >
                                <ArrowRightLeft className="h-3 w-3 mr-1" /> Defer
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                        await updateMutation.mutateAsync({
                                            id: row.original.id,
                                            data: { status: "ENROLLED" as any }
                                        });
                                        toast.success("Moved to Enrolled");
                                        onUpdate();
                                    } catch (error) {
                                        toast.error("Failed to enroll");
                                    }
                                }}
                                className="h-7 px-2 text-[9px] font-bold border-cyan-200 text-cyan-600 hover:bg-cyan-50 rounded-lg"
                            >
                                <CheckSquare className="h-3 w-3 mr-1" /> Enroll
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                    await updateMutation.mutateAsync({
                                        id: row.original.id,
                                        data: { status: "VISA_APPLICATION_IN_PROGRESS" as any }
                                    });
                                    toast.success("Reverted to Visa stage");
                                    onUpdate();
                                } catch (error) {
                                    toast.error("Failed to revert");
                                }
                            }}
                            className="h-7 px-2 text-[9px] font-bold border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm rounded-lg"
                        >
                            <Undo2 className="h-3 w-3 mr-1" /> Revert
                        </Button>
                    )}
                </div>
            )
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="flex items-center justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg group-hover:bg-white transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreHorizontal className="h-4 w-4 text-slate-400" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-none p-1 bg-white">
                            <DropdownMenuItem
                                className="cursor-pointer py-2 rounded-lg"
                                onClick={() => router.push(prefixPath(`/visa-applications/${row.original.id}`))}
                            >
                                <Eye className="mr-2 h-4 w-4 text-primary" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer py-2 rounded-lg"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (row.original.universityApplication) {
                                        onOpenComments?.(row.original.universityApplication);
                                    }
                                }}
                            >
                                <History className="mr-2 h-4 w-4 text-slate-500" /> View History
                            </DropdownMenuItem>
                            <div className="h-px bg-slate-100 my-1" />
                            <DropdownMenuItem
                                className="text-destructive cursor-pointer py-2 rounded-lg hover:bg-destructive/5"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(row.original.id);
                                }}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ),
        },
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="w-full overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0">
                    <thead>
                        <tr className="bg-muted/30">
                            {table.getHeaderGroups().map((headerGroup) =>
                                headerGroup.headers.map((header, index) => (
                                    <th
                                        key={header.id}
                                        className={`py-4 px-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 border-b border-border ${index === 0 ? "pl-6 rounded-tl-xl" : ""} ${index === headerGroup.headers.length - 1 ? "pr-6 rounded-tr-xl" : ""}`}
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="py-16 text-center">
                                    <Globe className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                                    <p className="text-xs font-medium text-muted-foreground italic">No visa applications recorded.</p>
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="group hover:bg-primary/5 transition-colors duration-200 cursor-pointer"
                                    onClick={() => router.push(prefixPath(`/visa-applications/${row.original.id}`))}
                                >
                                    {row.getVisibleCells().map((cell, index) => (
                                        <td
                                            key={cell.id}
                                            className={`py-4 px-4 align-middle ${index === 0 ? "pl-6" : ""} ${index === row.getVisibleCells().length - 1 ? "pr-6" : ""}`}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
