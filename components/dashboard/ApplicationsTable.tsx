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
    UserPlus
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
            id: "created-updated",
            header: "Created - Updated",
            cell: ({ row }) => (
                <div className="flex flex-col text-[10px] text-slate-500 font-medium">
                    <span>{format(new Date(row.original.createdAt), "dd/MM/yyyy hh:mm a")}</span>
                    <span>{format(new Date(row.original.updatedAt), "dd/MM/yyyy hh:mm a")}</span>
                </div>
            ),
        },
        {
            id: "move-to-visa",
            header: "Move to Visa",
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (row.original.status === "FINALIZED") {
                            setMoveToVisaApp(row.original);
                        } else {
                            toast.error("Application must be FINALIZED before moving to Visa stage");
                        }
                    }}
                    disabled={row.original.status === "READY_FOR_VISA"}
                    className={`h-8 px-4 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm ${row.original.status === "FINALIZED"
                        ? "bg-amber-500 text-white hover:bg-amber-600 hover:translate-y-[-1px]"
                        : row.original.status === "READY_FOR_VISA"
                            ? "bg-emerald-500 text-white opacity-80"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                >
                    {row.original.status === "READY_FOR_VISA" ? (
                        <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                        <Plane className="h-3.5 w-3.5" />
                    )}
                    {row.original.status === "READY_FOR_VISA" ? "In Visa Stage" : "Move to Visa"}
                </Button>
            ),
        },
        {
            id: "overview",
            header: "Overview",
            cell: ({ row }) => (
                <div className="flex flex-col gap-1.5 min-w-[130px]">
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenHistory?.(row.original);
                            }}
                            className="h-7 px-2 text-[9px] font-bold border-slate-200 flex gap-1 items-center bg-white shadow-sm"
                        >
                            <History className="h-3 w-3 text-slate-500" />
                            History
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenNotes?.(row.original);
                            }}
                            className="h-7 px-2 text-[9px] font-bold border-slate-200 flex gap-1 items-center bg-white shadow-sm"
                        >
                            <Plus className="h-3 w-3 text-slate-500" />
                            Notes ({row.original._count?.notes || 0})
                        </Button>
                    </div>
                </div>
            ),
        },
        {
            id: "id-name",
            header: "ID - Name",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        {row.original.student?.id?.substring(0, 8) || "N/A"}
                    </span>
                    <span className="font-extrabold text-slate-900 text-[13px] whitespace-nowrap">
                        {row.original.student?.name}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }) => (
                <div className="max-w-[160px] truncate text-[11px] font-bold text-slate-600">
                    {row.original.student?.email || "N/A"}
                </div>
            ),
        },
        {
            accessorKey: "mobile",
            header: "Mobile",
            cell: ({ row }) => (
                <div className="text-[11px] font-bold text-slate-800 whitespace-nowrap">
                    {row.original.student?.phone || "N/A"}
                </div>
            ),
        },
        {
            id: "application",
            header: "Application",
            cell: ({ row }) => (
                <div className="flex flex-col gap-1 items-center min-w-[110px]">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenStudentApps?.(row.original.student);
                        }}
                        className="h-7 px-3 text-[9px] font-bold border-slate-200 bg-slate-50"
                    >
                        {row.original.student?._count?.applications || 0} Application
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddAnother?.({
                                id: row.original.studentId,
                                name: row.original.student?.name || "Student"
                            });
                        }}
                        className="h-7 px-3 text-[9px] font-bold border-slate-200 flex gap-1 bg-white shadow-sm"
                    >
                        <Plus className="h-3 w-3 text-slate-500" />
                        Add Application
                    </Button>
                </div>
            ),
        },
        {
            id: "assigned-by",
            header: "Assigned By",
            cell: ({ row }) => (
                <div className="text-[11px] font-medium text-slate-700 text-center">
                    <div className="font-extrabold text-slate-900 whitespace-nowrap">{row.original.assignedBy?.name || "System"}</div>
                    <div className="text-[9px] text-slate-400 font-bold">({row.original.assignedBy?.role || "Admin"})</div>
                </div>
            ),
        },
        {
            id: "assigned-to",
            header: "Assigned To",
            cell: ({ row }) => (
                <div className="text-[11px] font-medium text-slate-700 text-center">
                    <div className="font-extrabold text-slate-900 whitespace-nowrap">{row.original.assignedTo?.name || "Unassigned"}</div>
                    <div className="text-[9px] text-slate-400 font-bold">({row.original.assignedTo?.role || "Staff"})</div>
                </div>
            ),
        },
        {
            id: "int-country",
            header: "Int. Country",
            cell: ({ row }) => (
                <div className="text-[11px] font-bold text-slate-700 text-center whitespace-nowrap">
                    {row.original.country?.name || "N/A"}
                </div>
            ),
        },
        {
            accessorKey: "intake",
            header: "Intake",
            cell: ({ row }) => (
                <div className="text-[11px] font-extrabold text-slate-800 text-center whitespace-nowrap uppercase">
                    {row.original.intake || "N/A"}
                </div>
            ),
        },
        {
            id: "int-course",
            header: "Int. Course",
            cell: ({ row }) => (
                <div className="text-[11px] font-bold text-slate-700 text-center max-w-[130px] truncate" title={row.original.course?.name || row.original.intendedCourse || "N/A"}>
                    {row.original.course?.name || row.original.intendedCourse || "N/A"}
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
                        case "PENDING": return "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100";
                        case "SUBMITTED": return "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100";
                        case "FINALIZED": return "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100";
                        case "UNDER_REVIEW": return "bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100";
                        case "OFFER_RECEIVED": return "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100";
                        case "READY_FOR_VISA": return "bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100";
                        case "ENROLLED": return "bg-cyan-50 text-cyan-700 border-cyan-100 hover:bg-cyan-100";
                        case "DEFERRED": return "bg-pink-50 text-pink-700 border-pink-100 hover:bg-pink-100";
                        case "REJECTED": return "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100";
                        case "WITHDRAWN": return "bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100";
                        default: return "bg-gray-50 text-gray-700 border-gray-100";
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
                                variant="outline"
                                className={`cursor-pointer px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${getStatusStyle(status)}`}
                            >
                                {status.replace(/_/g, ' ')}
                            </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48 p-1 rounded-xl shadow-xl border-slate-100 bg-white">
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
            accessorKey: "applyLevel",
            header: "Apply Level",
            cell: ({ row }) => (
                <div className="text-[11px] font-bold text-slate-700 text-center whitespace-nowrap">
                    {row.original.applyLevel || "N/A"}
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
                                            py-2 px-4 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground
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
