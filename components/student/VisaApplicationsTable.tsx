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
import { MoreHorizontal, Eye, Trash2, Calendar, Globe, School, User, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { VisaStatus, VisaType } from "@prisma/client";
import { useUpdateVisaApplication } from "@/hooks/useApi";

interface VisaApplicationsTableProps {
    data: any[];
    onUpdate: () => void;
    onDelete: (id: string) => void;
}

export function VisaApplicationsTable({ data, onUpdate, onDelete }: VisaApplicationsTableProps) {
    const updateMutation = useUpdateVisaApplication();

    const getStatusStyle = (status: VisaStatus) => {
        switch (status) {
            case "PENDING": return "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200";
            case "DOCUMENTS_COLLECTED": return "bg-sky-100 text-sky-700 hover:bg-sky-200 border-sky-200";
            case "SUBMITTED": return "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200";
            case "UNDER_REVIEW": return "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200";
            case "APPROVED": return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200";
            case "REJECTED": return "bg-red-100 text-red-700 hover:bg-red-200 border-red-200";
            case "WITHDRAWN": return "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const statusOptions: { value: VisaStatus; label: string }[] = [
        { value: "PENDING", label: "Pending" },
        { value: "DOCUMENTS_COLLECTED", label: "Docs Collected" },
        { value: "SUBMITTED", label: "Submitted" },
        { value: "UNDER_REVIEW", label: "Under Review" },
        { value: "APPROVED", label: "Approved" },
        { value: "REJECTED", label: "Rejected" },
        { value: "WITHDRAWN", label: "Withdrawn" },
    ];

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "visaType",
            header: "Visa Type",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold text-foreground capitalize">{row.original.visaType.toLowerCase().replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{row.original.country?.name}</span>
                </div>
            ),
        },
        {
            accessorKey: "university",
            header: "University & Intake",
            cell: ({ row }) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <School className="h-3.5 w-3.5 text-primary" />
                        {row.original.university?.name || "N/A"}
                    </div>
                    {row.original.intake && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                            <Calendar className="h-3 w-3" />
                            {row.original.intake}
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "dates",
            header: "Key Dates",
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <div className="text-xs font-semibold flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-blue-500" />
                        Applied: {new Date(row.original.applicationDate).toLocaleDateString()}
                    </div>
                    {row.original.appointmentDate && (
                        <div className="text-xs font-semibold flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-amber-500" />
                            Appt: {new Date(row.original.appointmentDate).toLocaleDateString()}
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
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
                            <Badge variant="outline" className={`cursor-pointer rounded-lg font-bold px-3 py-1 border ${getStatusStyle(status)}`}>
                                {status.replace(/_/g, ' ')}
                            </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 rounded-xl shadow-xl p-1 border-none bg-white">
                            {statusOptions.map((s) => (
                                <DropdownMenuItem
                                    key={s.value}
                                    onClick={() => handleStatusChange(s.value)}
                                    className={`cursor-pointer py-2 rounded-lg m-1 ${status === s.value ? "bg-primary/5 font-bold text-primary" : ""}`}
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
            accessorKey: "assignedOfficer",
            header: "Officer",
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {row.original.assignedOfficer?.name || "Unassigned"}
                </div>
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="flex items-center justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-none p-1 bg-white">
                            <DropdownMenuItem className="cursor-pointer py-2 rounded-lg">
                                <Eye className="mr-2 h-4 w-4 text-primary" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-destructive cursor-pointer py-2 rounded-lg hover:bg-destructive/5"
                                onClick={() => onDelete(row.original.id)}
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
                                <tr key={row.id} className="group hover:bg-primary/5 transition-colors duration-200">
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
