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
    CheckSquare,
    StickyNote
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
            id: "status",
            header: "Visa Status",
            cell: ({ row }) => {
                const status = row.original.status as VisaStatus;
                const visaId = row.original.id;

                const getStatusStyle = (s: VisaStatus) => {
                    switch (s) {
                        case "VISA_GRANTED":
                        case "VISA_APPROVED":
                            return "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100";
                        case "VISA_REFUSED":
                        case "VISA_REJECTED":
                            return "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100";
                        case "VISA_APPLICATION_SUBMITTED":
                            return "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100";
                        case "UNDER_REVIEW":
                            return "bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100";
                        case "ENROLLED":
                            return "bg-cyan-50 text-cyan-700 border-cyan-100 hover:bg-cyan-100";
                        case "DEFERRED":
                            return "bg-pink-50 text-pink-700 border-pink-100 hover:bg-pink-100";
                        default:
                            return "bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100";
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
                                variant="outline"
                                className={`cursor-pointer px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-all ${getStatusStyle(status)}`}
                            >
                                {status.replace(/_/g, ' ')}
                            </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64 p-1 rounded-xl shadow-xl border-border bg-popover max-h-[400px] overflow-y-auto">
                            {statusOptionsList.map((s) => (
                                <DropdownMenuItem
                                    key={s.value}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(s.value as VisaStatus);
                                    }}
                                    className={`cursor-pointer py-1.5 rounded-lg m-0.5 text-[10px] font-bold ${status === s.value ? "bg-primary/5 text-primary" : "text-muted-foreground"}`}
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
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 justify-end">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(prefixPath(`/visa-applications/${row.original.id}`));
                        }}
                        className="h-8 w-8 text-primary hover:bg-primary/5"
                        title="View Details"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-xl border-border bg-popover">
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(prefixPath(`/visa-applications/${row.original.id}`));
                                }}
                                className="cursor-pointer py-2 rounded-lg m-0.5 text-xs font-medium"
                            >
                                <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenHistory?.(row.original);
                                }}
                                className="cursor-pointer py-2 rounded-lg m-0.5 text-xs font-medium"
                            >
                                <History className="mr-2 h-4 w-4" /> View History
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenNotes?.(row.original);
                                }}
                                className="cursor-pointer py-2 rounded-lg m-0.5 text-xs font-medium"
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
                                            data: { status: "DEFERRED" }
                                        });
                                        toast.success("Moved to Defer");
                                        onUpdate();
                                    } catch (error) {
                                        toast.error("Failed to defer");
                                    }
                                }}
                                className="cursor-pointer py-2 rounded-lg m-0.5 text-xs font-semibold text-pink-600 hover:bg-pink-50"
                            >
                                <ArrowRightLeft className="mr-2 h-4 w-4" /> Defer Student
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                        await updateMutation.mutateAsync({
                                            id: row.original.id,
                                            data: { status: "ENROLLED" }
                                        });
                                        toast.success("Moved to Enrolled");
                                        onUpdate();
                                    } catch (error) {
                                        toast.error("Failed to enroll");
                                    }
                                }}
                                className="cursor-pointer py-2 rounded-lg m-0.5 text-xs font-semibold text-cyan-600 hover:bg-cyan-50"
                            >
                                <CheckSquare className="mr-2 h-4 w-4" /> Enroll Student
                            </DropdownMenuItem>
                            <div className="h-px bg-border my-1" />
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(row.original.id);
                                }}
                                className="cursor-pointer py-2 rounded-lg m-0.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
