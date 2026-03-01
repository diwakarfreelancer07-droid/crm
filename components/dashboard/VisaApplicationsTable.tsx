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
    Eye,
    Trash2,
    Calendar,
    Globe,
    School,
    User,
    CheckCircle2,
    Clock,
    XCircle,
    AlertCircle,
    FileDown,
    ChevronLeft,
    ChevronRight,
    MapPin,
    FileText,
    MessageCircle,
    History,
    Plus,
    Share2,
    ArrowRightLeft,
    CheckSquare,
    StickyNote,
    Phone,
    Mail,
    Undo2
} from "lucide-react";
import { VisaStatus } from "@prisma/client";
import { useUpdateVisaApplication } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import { useRolePath } from "@/hooks/use-role-path";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface VisaApplicationsTableProps {
    data: any[];
    onUpdate: () => void;
    onDelete: (id: string) => void;
    onOpenHistory?: (app: any) => void;
    onOpenComments?: (app: any) => void;
    onOpenOfferLetters?: (app: any) => void;
    onOpenNotes?: (app: any) => void;
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

export function VisaApplicationsTable({
    data,
    onUpdate,
    onDelete,
    onOpenHistory,
    onOpenComments,
    onOpenOfferLetters,
    onOpenNotes,
    selectedIds = [],
    onSelectionChange = () => { },
    pagination
}: VisaApplicationsTableProps) {
    const router = useRouter();
    const { prefixPath } = useRolePath();
    const updateMutation = useUpdateVisaApplication();

    const getStatusStyle = (status: VisaStatus) => {
        switch (status) {
            case "VISA_APPROVED":
            case "VISA_GRANTED":
                return "bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm";
            case "VISA_REJECTED":
            case "VISA_REFUSED":
                return "bg-rose-100 text-rose-700 border-rose-200 shadow-sm";
            case "VISA_WITHDRAWN":
                return "bg-slate-100 text-slate-700 border-slate-200";
            case "VISA_APPLICATION_SUBMITTED":
            case "BIOMETRICS_SCHEDULED":
            case "INTERVIEW_SCHEDULED":
                return "bg-amber-100 text-amber-700 border-amber-200 shadow-sm";
            case "UNDER_REVIEW":
            case "VISA_APPLICATION_IN_PROGRESS":
                return "bg-purple-100 text-purple-700 border-purple-200 shadow-sm";
            case "DOCUMENTS_RECEIVED":
            case "DOCUMENTS_VERIFIED":
            case "BIOMETRICS_COMPLETED":
            case "INTERVIEW_COMPLETED":
                return "bg-cyan-100 text-cyan-700 border-cyan-200 shadow-sm";
            case "DOCUMENTS_PENDING":
            case "FINANCIAL_DOCUMENTS_PENDING":
            case "SPONSORSHIP_DOCUMENTS_PENDING":
            case "ADDITIONAL_DOCUMENTS_REQUESTED":
                return "bg-orange-50 text-orange-600 border-orange-100 shadow-sm";
            case "VISA_GUIDANCE_GIVEN":
            case "DOCUMENTS_CHECKLIST_SHARED":
                return "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm";
            default:
                return "bg-blue-50 text-blue-600 border-blue-100";
        }
    };

    const statusOptionsList = Object.values(VisaStatus).map(status => ({
        value: status,
        label: status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
    }));

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

    const columns: ColumnDef<any>[] = [
        {
            id: "select",
            header: () => (
                <Checkbox
                    checked={data.length > 0 && selectedIds.length === data.length}
                    onCheckedChange={(checked) => toggleAll(!!checked)}
                    className="border-slate-300"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={selectedIds.includes(row.original.id)}
                    onCheckedChange={(checked) => toggleOne(row.original.id, !!checked)}
                    onClick={(e) => e.stopPropagation()}
                    className="border-slate-300"
                />
            ),
        },
        {
            id: "student",
            header: "Student",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                        {row.original.student?.name.charAt(0).toUpperCase()}
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
            id: "visa_details",
            header: "Visa Info",
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <div className="text-[10px] font-extrabold text-primary uppercase whitespace-nowrap bg-primary/5 px-2 py-0.5 rounded border border-primary/10 w-fit">
                        {row.original.visaType.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[11px] font-bold text-slate-500">
                        Passport: {row.original.student?.passportNo || "N/A"}
                    </div>
                </div>
            ),
        },
        {
            id: "university",
            header: "University",
            cell: ({ row }) => (
                <div className="flex flex-col gap-0.5">
                    <div className="text-[11px] font-bold text-slate-700 max-w-[150px] truncate" title={row.original.university?.name}>
                        {row.original.university?.name || "N/A"}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400">
                        {row.original.country?.name || "N/A"}
                    </div>
                </div>
            ),
        },
        {
            id: "timeline",
            header: "Timeline",
            cell: ({ row }) => (
                <div className="flex flex-col text-[10px] text-slate-500 font-medium whitespace-nowrap gap-1">
                    <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        App: {format(new Date(row.original.applicationDate), "dd/MM/yyyy")}
                    </span>
                    {row.original.appointmentDate && (
                        <span className="flex items-center gap-1 text-amber-600">
                            <Clock className="h-3 w-3" />
                            Apt: {format(new Date(row.original.appointmentDate), "dd/MM/yyyy")}
                        </span>
                    )}
                </div>
            ),
        },
        {
            id: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status as VisaStatus;
                const visaId = row.original.id;

                const getStatusStyle = (s: VisaStatus) => {
                    switch (s) {
                        case "VISA_GRANTED":
                        case "VISA_APPROVED":
                            return "bg-emerald-100 text-emerald-700 border-emerald-200";
                        case "VISA_REFUSED":
                        case "VISA_REJECTED":
                            return "bg-rose-100 text-rose-700 border-rose-200";
                        case "VISA_APPLICATION_SUBMITTED":
                            return "bg-blue-100 text-blue-700 border-blue-200";
                        case "UNDER_REVIEW":
                            return "bg-purple-100 text-purple-700 border-purple-200";
                        default:
                            return "bg-slate-100 text-slate-700 border-slate-200";
                    }
                };

                const handleStatusChange = async (newStatus: VisaStatus) => {
                    if (newStatus === status) return;
                    try {
                        await updateMutation.mutateAsync({
                            id: visaId,
                            data: { status: newStatus }
                        });
                        toast.success("Status updated successfully");
                        onUpdate();
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
                        <DropdownMenuContent align="start" className="w-64 p-1 rounded-xl shadow-xl max-h-[400px] overflow-y-auto">
                            {statusOptionsList.map((s) => (
                                <DropdownMenuItem
                                    key={s.value}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(s.value as VisaStatus);
                                    }}
                                    className={`cursor-pointer py-1.5 rounded-lg m-0.5 text-[10px] font-bold ${status === s.value ? "bg-primary/5 text-primary" : "text-slate-600"}`}
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
            id: "actions",
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 justify-end">
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
                        className="h-8 px-2 text-[10px] font-bold border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                    >
                        <Eye className="h-3.5 w-3.5 mr-1" /> History
                    </Button>
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
                        className="h-8 px-2 text-[10px] font-bold border-pink-200 text-pink-600 hover:bg-pink-50"
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
                        className="h-8 px-2 text-[10px] font-bold border-cyan-200 text-cyan-600 hover:bg-cyan-50"
                    >
                        <CheckSquare className="h-3 w-3 mr-1" /> Enroll
                    </Button>

                    {["DEFERRED", "ENROLLED"].includes(row.original.status) && (
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
                            className="h-8 px-2 text-[10px] font-bold border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                        >
                            <Undo2 className="h-3.5 w-3.5 mr-1" /> Revert
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(prefixPath(`/visa-applications/${row.original.id}`));
                        }}
                        className="h-8 w-8 text-primary hover:bg-primary/5"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
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
                                    router.push(prefixPath(`/visa-applications/${row.original.id}`));
                                }}
                                className="cursor-pointer"
                            >
                                <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
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
                                <StickyNote className="mr-2 h-4 w-4" /> View Notes
                            </DropdownMenuItem>
                            <div className="h-px bg-border my-1" />
                            <DropdownMenuItem
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
                                className="cursor-pointer font-semibold text-pink-600"
                            >
                                <ArrowRightLeft className="mr-2 h-4 w-4" /> Defer Student
                            </DropdownMenuItem>
                            <DropdownMenuItem
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
                                className="cursor-pointer font-semibold text-cyan-600"
                            >
                                <CheckSquare className="mr-2 h-4 w-4" /> Enroll Student
                            </DropdownMenuItem>
                            <div className="h-px bg-border my-1" />
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(row.original.id);
                                }}
                                className="text-red-600 cursor-pointer"
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
                                    <div className="flex flex-col items-center justify-center opacity-40">
                                        <Globe className="h-12 w-12 text-slate-400 mb-2" />
                                        <p className="text-xs font-bold text-slate-500 italic">No visa applications found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="group hover:bg-muted/50 transition-colors border-b border-border last:border-0 cursor-pointer"
                                    onClick={() => router.push(prefixPath(`/visa-applications/${row.original.id}`))}
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
                            {[10, 25, 50].map((size) => (
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
        </div>
    );
}
