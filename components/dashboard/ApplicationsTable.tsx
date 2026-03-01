"use client";

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
import {
    MoreHorizontal,
    Trash2,
    Plane,
    CheckCircle,
    CircleDashed,
    ExternalLink,
    MessageCircle,
    History,
    Plus,
    ChevronLeft,
    ChevronRight,
    Clock,
    User,
    Mail,
    Phone,
    Globe,
    Download,
    StickyNote,
    UserPlus,
    Calendar,
    Eye,
    Undo2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRolePath } from "@/hooks/use-role-path";
import axios from "axios";
import { toast } from "sonner";
import { Application } from "@/types/api";
import { ApplicationStatus } from "@prisma/client";
import { useUpdateApplication } from "@/hooks/useApi";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { useState } from "react";
import { MoveToVisaModal } from "@/components/applications/MoveToVisaModal";

interface ApplicationsTableProps {
    data: Application[];
    onUpdate: () => void;
    onDelete: (id: string) => void;
    onAddAnother?: (student: { id: string, name: string }) => void;
    onConvertToVisa?: (application: Application) => void;
    onOpenHistory?: (application: Application) => void;
    onOpenComments?: (application: Application) => void;
    onOpenOfferLetters?: (application: Application) => void;
    onOpenNotes?: (application: Application) => void;
    onOpenStudentApps?: (student: any) => void;
    selectedIds?: string[];
    onSelectionChange?: (ids: string[]) => void;
    pagination?: {
        page: number;
        totalPages: number;
        pageSize: number;
        onPageChange: (page: number) => void;
        onPageSizeChange: (pageSize: number) => void;
    }
}

export function ApplicationsTable({
    data,
    onUpdate,
    onDelete,
    onAddAnother,
    onConvertToVisa,
    onOpenHistory,
    onOpenComments,
    onOpenOfferLetters,
    onOpenNotes,
    onOpenStudentApps,
    selectedIds = [],
    onSelectionChange = () => { },
    pagination
}: ApplicationsTableProps) {
    const router = useRouter();
    const { prefixPath } = useRolePath();
    const updateMutation = useUpdateApplication();
    const [promotingId, setPromotingId] = useState<string | null>(null);
    const [moveToVisaApp, setMoveToVisaApp] = useState<Application | null>(null);

    const handleReadyForVisa = async (appId: string) => {
        try {
            setPromotingId(appId);
            await axios.post(`/api/applications/${appId}/ready-for-visa`);
            toast.success("Application moved to Visa stage");
            onUpdate?.();
        } catch (error: any) {
            console.error("Promotion failed:", error);
            toast.error(error.response?.data?.error || "Failed to move to Visa stage");
        } finally {
            setPromotingId(null);
        }
    };

    const handleRevert = async (appId: string) => {
        try {
            await axios.post(`/api/applications/${appId}/revert-from-visa`);
            toast.success("Application reverted to Visa stage");
            onUpdate?.();
        } catch (error: any) {
            console.error("Revert failed:", error);
            toast.error(error.response?.data?.error || "Failed to revert application");
        }
    };

    const toggleAll = (checked: boolean) => {
        if (checked) {
            onSelectionChange(data.map(app => app.id));
        } else {
            onSelectionChange([]);
        }
    };

    const toggleOne = (id: string, checked: boolean) => {
        if (checked) {
            onSelectionChange([...selectedIds, id]);
        } else {
            onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
        }
    };

    const columns: ColumnDef<Application>[] = [
        {
            id: "student",
            header: "Student",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold shrink-0">
                        {row.original.student?.name?.charAt(0).toUpperCase() || "S"}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                            {row.original.student?.id?.substring(0, 8) || "N/A"}
                        </span>
                        <span className="font-bold text-foreground text-[13px] whitespace-nowrap">
                            {row.original.student?.name}
                        </span>
                    </div>
                </div>
            ),
        },
        {
            id: "contact",
            header: "Contact",
            cell: ({ row }) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
                        <Phone className="h-3.5 w-3.5" />
                        {row.original.student?.phone || "N/A"}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground truncate max-w-[150px]">
                        <Mail className="h-3.5 w-3.5" />
                        {row.original.student?.email || "N/A"}
                    </div>
                </div>
            ),
        },
        {
            id: "course",
            header: "Course",
            cell: ({ row }) => (
                <div className="text-[11px] font-bold text-slate-700 max-w-[150px] truncate" title={row.original.course?.name || row.original.intendedCourse || "N/A"}>
                    {row.original.course?.name || row.original.intendedCourse || "N/A"}
                </div>
            ),
        },
        {
            id: "country_intake",
            header: "Country / Intake",
            cell: ({ row }) => (
                <div className="flex flex-col gap-0.5">
                    <div className="text-[11px] font-medium text-slate-600">
                        {row.original.country?.name || "N/A"}
                    </div>
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase">
                        {row.original.intake || "N/A"}
                    </div>
                </div>
            ),
        },
        {
            id: "assigned",
            header: "Assigned To/By",
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <div className="text-[11px] font-medium">
                        <span className="text-muted-foreground mr-1 italic text-[10px]">To:</span>
                        <span className="font-bold text-slate-900">{row.original.assignedTo?.name || "Unassigned"}</span>
                    </div>
                    <div className="text-[11px] font-medium">
                        <span className="text-muted-foreground mr-1 italic text-[10px]">By:</span>
                        <span className="font-bold text-slate-700">{row.original.assignedBy?.name || "System"}</span>
                    </div>
                </div>
            ),
        },
        {
            id: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status as ApplicationStatus;
                const appId = row.original.id;

                const getStatusStyle = (s: ApplicationStatus) => {
                    switch (s) {
                        case "PENDING": return "bg-blue-100 text-blue-700 hover:bg-blue-200";
                        case "SUBMITTED": return "bg-amber-100 text-amber-700 hover:bg-amber-200";
                        case "FINALIZED": return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200";
                        case "UNDER_REVIEW": return "bg-purple-100 text-purple-700 hover:bg-purple-200";
                        case "OFFER_RECEIVED": return "bg-indigo-100 text-indigo-700 hover:bg-indigo-200";
                        case "READY_FOR_VISA": return "bg-orange-100 text-orange-700 hover:bg-orange-200";
                        case "ENROLLED": return "bg-cyan-100 text-cyan-700 hover:bg-cyan-200";
                        case "DEFERRED": return "bg-pink-100 text-pink-700 hover:bg-pink-200";
                        case "REJECTED": return "bg-rose-100 text-rose-700 hover:bg-rose-200";
                        case "WITHDRAWN": return "bg-slate-100 text-slate-700 hover:bg-slate-200";
                        default: return "bg-gray-100 text-gray-700 hover:bg-gray-200";
                    }
                };

                const handleStatusChange = async (newStatus: string) => {
                    if (newStatus === status) return;
                    try {
                        await updateMutation.mutateAsync({
                            id: appId,
                            data: { status: newStatus as ApplicationStatus }
                        });
                        onUpdate?.();
                        toast.success("Status updated successfully");
                    } catch (error) {
                        console.error("Failed to update status", error);
                        toast.error("Failed to update status");
                    }
                };

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Badge
                                className={`cursor-pointer border-none rounded-lg font-bold px-3 py-1 transition-all hover:scale-105 active:scale-95 ${getStatusStyle(status)}`}
                            >
                                {status.replace(/_/g, ' ')}
                            </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 p-1 rounded-xl shadow-xl">
                            {["PENDING", "SUBMITTED", "FINALIZED", "UNDER_REVIEW", "OFFER_RECEIVED", "READY_FOR_VISA", "ENROLLED", "DEFERRED", "REJECTED", "WITHDRAWN"].map((s) => (
                                <DropdownMenuItem
                                    key={s}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(s);
                                    }}
                                    className={`cursor-pointer py-2 rounded-lg m-0.5 text-[10px] font-bold ${status === s ? "bg-primary/5 text-primary" : "text-slate-600"}`}
                                >
                                    {s.replace(/_/g, ' ')}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            }
        },
        {
            id: "date",
            header: "Date",
            cell: ({ row }) => (
                <div className="flex flex-col text-[11px] text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(row.original.createdAt), "dd/MM/yyyy")}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] opacity-70">
                        <Clock className="h-3 w-3" />
                        {format(new Date(row.original.updatedAt), "hh:mm a")}
                    </div>
                </div>
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2">

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenComments?.(row.original);
                        }}
                        className="h-8 px-3 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                    >
                        <Eye className="h-3.5 w-3.5" /> View History
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (row.original.status === "FINALIZED") {
                                setMoveToVisaApp(row.original);
                            } else if (row.original.status === "READY_FOR_VISA") {
                                toast.info("Application is already in Visa stage");
                            } else {
                                toast.error("Application must be FINALIZED before moving to Visa stage");
                            }
                        }}
                        className={`h-8 px-3 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all
                            ${row.original.status === "FINALIZED"
                                ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
                                : row.original.status === "READY_FOR_VISA"
                                    ? "bg-emerald-500 text-white"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            }`}
                    >
                        {row.original.status === "READY_FOR_VISA" ? <CheckCircle className="h-3 w-3" /> : <Plane className="h-3 w-3" />}
                        {row.original.status === "READY_FOR_VISA" ? "Visa Active" : "Move to Visa"}
                    </Button>

                    {["DEFERRED", "ENROLLED"].includes(row.original.status) && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRevert(row.original.id);
                            }}
                            className="h-8 px-3 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                        >
                            <Undo2 className="h-3 w-3" /> Revert
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenHistory?.(row.original);
                                }}
                                className="cursor-pointer"
                            >
                                <History className="mr-2 h-4 w-4" /> View History
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenNotes?.(row.original);
                                }}
                                className="cursor-pointer"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Notes ({row.original._count?.notes || 0})
                            </DropdownMenuItem>
                            <div className="h-px bg-slate-100 my-1" />
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenStudentApps?.(row.original.student);
                                }}
                                className="cursor-pointer"
                            >
                                <Eye className="mr-2 h-4 w-4" /> Student Applications ({row.original.student?._count?.applications || 0})
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddAnother?.({
                                        id: row.original.studentId,
                                        name: row.original.student?.name || "Student"
                                    });
                                }}
                                className="cursor-pointer text-cyan-600 font-bold"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add Application
                            </DropdownMenuItem>
                            <div className="h-px bg-slate-100 my-1" />
                            <DropdownMenuItem
                                className="text-red-600 cursor-pointer"
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
                <table className="w-full border-collapse">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className="border-b border-border">
                                {headerGroup.headers.map((header, index) => (
                                    <th
                                        key={header.id}
                                        className={`
                                            py-2 px-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground
                                            ${index === 0 ? "pl-6" : ""}
                                            ${index === headerGroup.headers.length - 1 ? "pr-6" : ""}
                                        `}
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="py-24 text-center">
                                    <p className="text-sm font-bold text-slate-400 italic">No applications found.</p>
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="group hover:bg-muted/50 transition-colors border-b border-border last:border-0 cursor-pointer"
                                    onClick={() => {
                                        router.push(prefixPath(`/applications/${row.original.id}`));
                                    }}
                                >
                                    {row.getVisibleCells().map((cell, index) => (
                                        <td
                                            key={cell.id}
                                            className={`
                                                py-3 px-4 align-middle 
                                                ${index === 0 ? "pl-6" : ""}
                                                ${index === row.getVisibleCells().length - 1 ? "pr-6" : ""}
                                            `}
                                            onClick={(e) => {
                                                if ((e.target as HTMLElement).closest('button, a, [role="menuitem"], [role="button"]')) {
                                                    e.stopPropagation();
                                                }
                                            }}
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

            {pagination && (
                <div className="flex items-center justify-between px-4 py-4 border-t border-border mt-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Rows per page</span>
                        <select
                            value={pagination.pageSize}
                            onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
                            className="h-8 w-16 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            {[10, 20, 50, 100].map((size) => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="text-xs font-medium text-muted-foreground">
                            Page {pagination.page} of {pagination.totalPages}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    pagination.onPageChange(Math.max(1, pagination.page - 1));
                                }}
                                disabled={pagination.page <= 1}
                                className="rounded-xl h-8 w-8 border-primary/20 text-primary hover:bg-primary/5 shadow-sm"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    pagination.onPageChange(Math.min(pagination.totalPages, pagination.page + 1));
                                }}
                                disabled={pagination.page >= pagination.totalPages}
                                className="rounded-xl h-8 w-8 border-primary/20 text-primary hover:bg-primary/5 shadow-sm"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <MoveToVisaModal
                isOpen={!!moveToVisaApp}
                onClose={() => setMoveToVisaApp(null)}
                application={moveToVisaApp}
                onSuccess={onUpdate}
            />
        </div>
    );
}
