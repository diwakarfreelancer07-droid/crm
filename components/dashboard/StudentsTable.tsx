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
import { MoreHorizontal, Eye, Pencil, Trash2, Phone, Mail, Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useRolePath } from "@/hooks/use-role-path";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { Student } from "@/types/api";
import { useUpdateStudent } from "@/hooks/useApi";
import { toast } from "sonner";
// import { AddUniversityApplicationModal } from "../student/AddUniversityApplicationModal";

interface StudentsTableProps {
    data: Student[];
    onUpdate: () => void;
    onDelete: (id: string) => void;
    pagination?: {
        page: number;
        totalPages: number;
        pageSize: number;
        onPageChange: (page: number) => void;
        onPageSizeChange: (pageSize: number) => void;
    }
}

export function StudentsTable({ data, onUpdate, onDelete, pagination }: StudentsTableProps) {
    // const [editSheetOpen, setEditSheetOpen] = useState(false);
    // const [editingStudent, setEditingStudent] = useState<Student | undefined>(undefined);
    const updateMutation = useUpdateStudent();
    // const [addAppModalOpen, setAddAppModalOpen] = useState(false);
    // const [selectedStudent, setSelectedStudent] = useState<any>(null);

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: "name",
            header: "Student",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                        {row.original.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-bold text-foreground">{row.original.name}</p>
                        {row.original.lead?.source && (
                            <Badge variant="outline" className="text-[10px] mt-1">
                                {row.original.lead.source}
                            </Badge>
                        )}
                    </div>
                </div>
            ),
        },
        {
            id: "contact",
            header: "Contact",
            cell: ({ row }) => (
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {row.original.phone}
                    </div>
                    {row.original.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            {row.original.email}
                        </div>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "country",
            header: "Country",
            cell: ({ row }) => (
                <p className="text-sm font-medium">{row.original.lead?.interestedCountry || "N/A"}</p>
            ),
        },
        {
            accessorKey: "onboardedBy",
            header: "Onboarded By",
            cell: ({ row }) => (
                <p className="text-sm text-foreground">{row.original.user?.name || "N/A"}</p>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status || "NEW";
                const studentId = row.original.id;

                const statuses = [
                    { value: "NEW", label: "New" },
                    { value: "UNDER_REVIEW", label: "Under Review" },
                    { value: "COUNSELLING_SCHEDULED", label: "Counselling Scheduled" },
                    { value: "COUNSELLING_COMPLETED", label: "Counselling Completed" },
                    { value: "DOCUMENT_PENDING", label: "Document Pending" },
                    { value: "DOCUMENT_VERIFIED", label: "Document Verified" },
                    { value: "INTERESTED", label: "Interested" },
                    { value: "NOT_INTERESTED", label: "Not Interested" },
                    { value: "NOT_ELIGIBLE", label: "Not Eligible" },
                    { value: "ON_HOLD", label: "On Hold" },
                ];

                const handleStatusChange = async (newStatus: string) => {
                    if (newStatus === status) return;
                    try {
                        await updateMutation.mutateAsync({
                            id: studentId,
                            data: { status: newStatus }
                        });
                        onUpdate();
                    } catch (error) {
                        // Error is handled by mutation's onSuccess/onError if configured, 
                        // but here we ensure consistency.
                    }
                };

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Badge className={`
                                cursor-pointer
                                ${status === "NEW" ? "bg-blue-100 text-blue-700 hover:bg-blue-200" :
                                    status === "UNDER_REVIEW" ? "bg-amber-100 text-amber-700 hover:bg-amber-200" :
                                        status === "COUNSELLING_SCHEDULED" ? "bg-purple-100 text-purple-700 hover:bg-purple-200" :
                                            status === "COUNSELLING_COMPLETED" ? "bg-teal-100 text-teal-700 hover:bg-teal-200" :
                                                status === "DOCUMENT_PENDING" ? "bg-orange-100 text-orange-700 hover:bg-orange-200" :
                                                    status === "DOCUMENT_VERIFIED" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" :
                                                        status === "INTERESTED" ? "bg-green-100 text-green-700 hover:bg-green-200" :
                                                            status === "NOT_INTERESTED" ? "bg-slate-100 text-slate-700 hover:bg-slate-200" :
                                                                status === "NOT_ELIGIBLE" ? "bg-rose-100 text-rose-700 hover:bg-rose-200" :
                                                                    status === "ON_HOLD" ? "bg-gray-100 text-gray-700 hover:bg-gray-200" :
                                                                        "bg-gray-100 text-gray-700 hover:bg-gray-200"}
                                border-none rounded-lg font-bold px-3 py-1 transition-all hover:scale-105 active:scale-95
                            `}>
                                {status.replace(/_/g, ' ')}
                            </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 overflow-y-auto max-h-[300px]">
                            {statuses.map((s) => (
                                <DropdownMenuItem
                                    key={s.value}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(s.value);
                                    }}
                                    className={`
                                        cursor-pointer py-2
                                        ${status === s.value ? "bg-primary/5 font-semibold text-primary" : ""}
                                    `}
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
            accessorKey: "createdAt",
            header: "Date",
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(row.original.createdAt).toLocaleDateString()}
                </div>
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(prefixPath(`/students/${row.original.id}/applications/add`));
                        }}
                        className="h-8 px-3 text-[10px] font-bold bg-cyan-50 text-cyan-700 hover:bg-cyan-100 rounded-lg flex items-center gap-1.5 transition-all"
                    >
                        <Plus className="h-3 w-3" />
                        Move to Application
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={prefixPath(`/students/${row.original.id}`)} className="cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" /> View
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(prefixPath(`/students/${row.original.id}/edit`));
                                }}
                                className="cursor-pointer"
                            >
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(prefixPath(`/students/${row.original.id}/applications/add`));
                                }}
                                className="cursor-pointer text-cyan-600 font-bold bg-cyan-50 hover:bg-cyan-100"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Move to Application
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600 cursor-pointer"
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

    const router = useRouter();
    const { prefixPath } = useRolePath();

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
                        <tr className="border-b border-border">
                            {table.getHeaderGroups().map((headerGroup) =>
                                headerGroup.headers.map((header, index) => (
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
                                ))
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr
                                key={row.id}
                                onClick={() => router.push(prefixPath(`/students/${row.original.id}`))}
                                className="group hover:bg-muted/50 transition-colors border-b border-border last:border-0 cursor-pointer"
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
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {pagination && (
                <div className="flex items-center justify-between px-4 py-4 border-t border-border mt-auto">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Rows per page</span>
                        <select
                            value={pagination.pageSize}
                            onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
                            className="h-8 w-16 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            {[5, 10, 20, 50].map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
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
                                onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
                                disabled={pagination.page <= 1}
                                className="rounded-xl h-8 w-8"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="rounded-xl h-8 w-8"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal removed as we now use separate page */}
        </div>
    );
}
