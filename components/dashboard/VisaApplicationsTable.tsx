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
    Clock,
    ChevronLeft,
    ChevronRight,
    MapPin,
    FileText,
    MessageCircle,
    History,
    Plus,
    Share2,
    ArrowRightLeft,
    CheckSquare
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
            case "PENDING": return "bg-blue-100 text-blue-700 border-blue-200";
            case "DOCUMENTS_COLLECTED": return "bg-sky-100 text-sky-700 border-sky-200";
            case "SUBMITTED": return "bg-amber-100 text-amber-700 border-amber-200";
            case "UNDER_REVIEW": return "bg-purple-100 text-purple-700 border-purple-200";
            case "APPROVED": return "bg-emerald-100 text-emerald-700 border-emerald-200";
            case "REJECTED": return "bg-red-100 text-red-700 border-red-200";
            case "WITHDRAWN": return "bg-slate-100 text-slate-700 border-slate-200";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const statusOptionsList: { value: VisaStatus; label: string }[] = [
        { value: "PENDING", label: "Pending" },
        { value: "DOCUMENTS_COLLECTED", label: "Docs Collected" },
        { value: "SUBMITTED", label: "Submitted" },
        { value: "UNDER_REVIEW", label: "Under Review" },
        { value: "APPROVED", label: "Approved" },
        { value: "REJECTED", label: "Rejected" },
        { value: "WITHDRAWN", label: "Withdrawn" },
    ];

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
            id: "timeline",
            header: "Timeline",
            cell: ({ row }) => (
                <div className="flex flex-col text-[10px] text-slate-500 font-medium whitespace-nowrap">
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
            id: "action",
            header: "Action",
            cell: ({ row }) => (
                <div className="flex flex-col gap-1.5 items-center">
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 bg-emerald-500 text-white hover:bg-emerald-600 rounded shadow-sm"
                            title="Share"
                        >
                            <Share2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(row.original.id);
                            }}
                            className="h-7 w-7 bg-rose-500 text-white hover:bg-rose-600 rounded shadow-sm"
                            title="Delete"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-[10px] font-bold w-full flex gap-1.5 items-center justify-center shadow-md transition-all active:scale-95"
                    >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Whatsapp
                    </Button>
                </div>
            ),
        },
        {
            id: "overview",
            header: "Overview",
            cell: ({ row }) => (
                <div className="grid grid-cols-2 gap-1.5 min-w-[150px]">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenHistory?.(row.original);
                        }}
                        className="h-7 px-2 text-[9px] font-bold border-slate-200 flex gap-1 items-center bg-white shadow-sm hover:bg-slate-50 transition-colors"
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
                        className="h-7 px-2 text-[9px] font-bold border-slate-200 flex gap-1 items-center bg-white shadow-sm hover:bg-slate-50 transition-colors"
                    >
                        <Plus className="h-3 w-3 text-slate-500" />
                        Notes ({row.original.universityApplication?._count?.applicationNotes || 0})
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[9px] font-bold border-slate-200 flex gap-1 items-center bg-white shadow-sm hover:bg-slate-50 transition-colors"
                    >
                        <ArrowRightLeft className="h-3 w-3 text-slate-500" />
                        Defer
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-[9px] font-bold border-slate-200 flex gap-1 items-center bg-white shadow-sm hover:bg-slate-50 transition-colors"
                    >
                        <CheckSquare className="h-3 w-3 text-slate-500" />
                        Enrolled
                    </Button>
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
            accessorKey: "visaType",
            header: "Visa Type",
            cell: ({ row }) => (
                <div className="text-[10px] font-extrabold text-primary uppercase whitespace-nowrap bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                    {row.original.visaType.replace(/_/g, ' ')}
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
            id: "applied-country",
            header: "Applied Country",
            cell: ({ row }) => (
                <Badge variant="outline" className="text-[10px] font-bold px-2 py-0 border-slate-200 text-slate-600 bg-slate-50/50">
                    {row.original.country?.name || "N/A"}
                </Badge>
            ),
        },
        {
            accessorKey: "university",
            header: "University",
            cell: ({ row }) => (
                <div className="text-[11px] font-bold text-slate-700 max-w-[150px] truncate" title={row.original.university?.name}>
                    {row.original.university?.name || "N/A"}
                </div>
            ),
        },
        {
            id: "status",
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
                    <Select value={status} onValueChange={(val) => handleStatusChange(val as VisaStatus)}>
                        <SelectTrigger className="h-9 min-w-[130px] rounded-lg border-slate-200 text-[11px] font-bold bg-white focus:ring-1 focus:ring-primary/20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl">
                            {statusOptionsList.map((s) => (
                                <SelectItem key={s.value} value={s.value} className="text-[11px] font-medium">
                                    {s.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            }
        },
        {
            id: "course",
            header: "Course",
            cell: ({ row }) => (
                <div className="text-[11px] font-bold text-slate-600 max-w-[120px] truncate" title={row.original.course?.name}>
                    {row.original.course?.name || "N/A"}
                </div>
            ),
        },
        {
            accessorKey: "intake",
            header: "Intake",
            cell: ({ row }) => (
                <div className="text-[11px] font-extrabold text-slate-800 uppercase whitespace-nowrap">
                    {row.original.intake || "N/A"}
                </div>
            ),
        },
        {
            id: "passport-no",
            header: "Passport No",
            cell: ({ row }) => (
                <div className="text-[11px] font-bold text-slate-600">
                    {row.original.student?.passportNo || "N/A"}
                </div>
            ),
        },
        {
            id: "assigned-by",
            header: "Assigned By",
            cell: ({ row }) => (
                <div className="text-[10px] font-medium text-slate-700 w-[140px]">
                    <div className="font-extrabold text-slate-900 truncate">
                        {row.original.universityApplication?.assignedBy?.name || "System"}
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold italic">
                        ({row.original.universityApplication?.assignedBy?.role || "Admin"})
                    </div>
                </div>
            ),
        },
        {
            id: "assigned-to",
            header: "Assigned To",
            cell: ({ row }) => (
                <div className="text-[10px] font-medium text-slate-700 w-[140px]">
                    <div className="font-extrabold text-slate-900 truncate">
                        {row.original.universityApplication?.assignedTo?.name || "Unassigned"}
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold italic">
                        ({row.original.universityApplication?.assignedTo?.role || "Staff"})
                    </div>
                </div>
            ),
        },
        {
            id: "branch",
            header: "Branch",
            cell: () => (
                <div className="text-[11px] font-bold text-slate-600">
                    Head Office
                </div>
            ),
        },
        {
            id: "partner",
            header: "Partner",
            cell: () => (
                <div className="text-[11px] font-bold text-slate-400 italic">
                    N/A
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
        <div className="w-full">
            <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white shadow-sm">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100">
                            {table.getHeaderGroups().map((headerGroup) =>
                                headerGroup.headers.map((header, index) => (
                                    <th
                                        key={header.id}
                                        className={`py-4 px-3 text-center text-[10px] font-extrabold uppercase tracking-wider text-slate-600 border-x border-slate-200 ${index === 0 ? "pl-6" : ""} ${index === headerGroup.headers.length - 1 ? "pr-6" : ""}`}
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="py-20 text-center">
                                    <div className="flex flex-col items-center justify-center opacity-40">
                                        <Globe className="h-12 w-12 text-slate-400 mb-2" />
                                        <p className="text-xs font-bold text-slate-500 italic">No visa applications found.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map((row) => (
                                <tr key={row.id} className="group hover:bg-slate-50/50 transition-all duration-200">
                                    {row.getVisibleCells().map((cell, index) => (
                                        <td
                                            key={cell.id}
                                            className={`py-3 px-3 align-middle border-x border-slate-200 ${index === 0 ? "pl-6" : ""} ${index === row.getVisibleCells().length - 1 ? "pr-6" : ""}`}
                                        >
                                            <div className="flex justify-center w-full">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && (
                <div className="flex items-center justify-between px-2 py-6">
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Rows per page</span>
                        <select
                            value={pagination.pageSize}
                            onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
                            className="h-8 w-16 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            {[10, 25, 50].map((size) => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                            Page {pagination.page} / {pagination.totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
                                disabled={pagination.page <= 1}
                                className="rounded-xl h-8 w-8 border-slate-200"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="rounded-xl h-8 w-8 border-slate-200"
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
