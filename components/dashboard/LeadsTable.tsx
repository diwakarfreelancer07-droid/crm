"use client";

import {
    useReactTable,
    getCoreRowModel,
    ColumnDef,
    flexRender,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
    MoreHorizontal,
    Eye,
    Pencil,
    Trash2,
    UserPlus,
    ChevronLeft,
    ChevronRight,
    Zap,
    Phone
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AssignLeadSheet } from "./AssignLeadSheet";
import { useSession } from "next-auth/react";
import { useRolePath } from "@/hooks/use-role-path";
import { ConvertToStudentModal } from "./ConvertToStudentModal";

import { toast } from "sonner";
import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { LeadForm } from "./LeadForm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useUpdateLead, useDeleteLead } from "@/hooks/use-leads";
import type { Lead as PrismaLead } from '@/lib/prisma';

// Extended Lead type to include assignments (if not in PrismaLead)
// PrismaLead usually has basic fields. We need to match what useLeads returns.
interface Lead extends Omit<PrismaLead, "createdAt" | "updatedAt"> {
    createdAt: string | Date;
    updatedAt: string | Date;
    assignments?: {
        employee: {
            name: string;
            email: string;
        }
    }[];
}

const statusOptions = [
    "NEW",
    "UNDER_REVIEW",
    "CONTACTED",
    "COUNSELLING_SCHEDULED",
    "COUNSELLING_COMPLETED",
    "FOLLOWUP_REQUIRED",
    "INTERESTED",
    "NOT_INTERESTED",
    "ON_HOLD",
    "CLOSED",
    "CONVERTED"
];
const tempOptions = ["COLD", "WARM", "HOT"];

export function LeadsTable({
    data,
    onUpdate,
    pagination
}: {
    data: Lead[]; // Use the local extended Lead type
    onUpdate: () => void;
    pagination?: {
        page: number;
        totalPages: number;
        pageSize: number;
        onPageChange: (page: number) => void;
        onPageSizeChange: (pageSize: number) => void;
    }
}) {
    const { prefixPath } = useRolePath();
    const { data: session } = useSession() as any;
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<{ id: string; name: string } | null>(null);
    const [editSheetOpen, setEditSheetOpen] = useState(false);
    const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
    const [convertModalOpen, setConvertModalOpen] = useState(false);
    const [convertingLead, setConvertingLead] = useState<any>(null);

    // Mutations
    const updateLeadMutation = useUpdateLead();
    const deleteLeadMutation = useDeleteLead();

    // Call state
    const [isCalling, setIsCalling] = useState<string | null>(null);

    // Delete Dialog State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

    const handleCall = async (lead: Lead) => {
        setIsCalling(lead.id);
        try {
            const res = await axios.post('/api/exotel/call', {
                employeeId: session?.user?.id,
                targetType: 'lead',
                targetId: lead.id,
            });
            toast.success(`Call initiated! SID: ${res.data.callSid}`);
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to initiate call');
        } finally {
            setIsCalling(null);
        }
    };

    const handleUpdate = async (id: string, field: string, value: string) => {
        try {
            await updateLeadMutation.mutateAsync({ id, data: { [field]: value } });
            toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated`);
            onUpdate();
        } catch (error) {
            toast.error("Failed to update lead");
        }
    };

    const handleDeleteClick = (id: string) => {
        setLeadToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!leadToDelete) return;

        try {
            await deleteLeadMutation.mutateAsync(leadToDelete);
            toast.success("Lead deleted successfully");
            onUpdate();
        } catch (error) {
            toast.error("Failed to delete lead");
        } finally {
            setDeleteDialogOpen(false);
            setLeadToDelete(null);
        }
    };

    const handleAssignClick = (lead: Lead) => {
        setSelectedLead({ id: lead.id, name: lead.name });
        setAssignDialogOpen(true);
    };

    const columns: ColumnDef<Lead>[] = [
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => (
                <div>
                    <p className="text-sm font-semibold text-foreground">{row.getValue("name")}</p>
                    <p className="text-xs text-muted-foreground">{row.original.phone}</p>
                </div>
            ),
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }) => (
                <div className="text-sm text-muted-foreground">{row.getValue("email") || "N/A"}</div>
            ),
        },
        {
            accessorKey: "source",
            header: "Source",
            cell: ({ row }) => (
                <Badge variant="outline" className="text-[10px] font-medium uppercase">
                    {row.getValue("source")}
                </Badge>
            ),
        },
        {
            accessorKey: "assignedTo",
            header: "Counselor",
            cell: ({ row }) => {
                const assignments = row.original.assignments;
                const assignee = assignments && assignments.length > 0 ? assignments[0].employee.name : "Unassigned";
                return (
                    <div className="text-sm font-medium text-foreground">
                        {assignee}
                    </div>
                );
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                const [isOpen, setIsOpen] = useState(false);

                return (
                    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                        <DropdownMenuTrigger asChild onMouseEnter={() => setIsOpen(true)}>
                            <div className={`
                                cursor-pointer hover:bg-gray-100 transition-all
                                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
                                ${status === "NEW" ? "text-blue-600" :
                                    status === "UNDER_REVIEW" ? "text-amber-600" :
                                        status === "CONTACTED" ? "text-purple-600" :
                                            status === "COUNSELLING_SCHEDULED" ? "text-cyan-600" :
                                                status === "COUNSELLING_COMPLETED" ? "text-teal-600" :
                                                    status === "FOLLOWUP_REQUIRED" ? "text-rose-600" :
                                                        status === "INTERESTED" ? "text-emerald-600" :
                                                            status === "NOT_INTERESTED" ? "text-slate-500" :
                                                                status === "ON_HOLD" ? "text-orange-500" :
                                                                    status === "CLOSED" ? "text-gray-900" :
                                                                        status === "CONVERTED" ? "text-emerald-600" : "text-gray-600"}
                            `}>
                                <div className={`w-1.5 h-1.5 rounded-full 
                                    ${status === "NEW" ? "bg-blue-600" :
                                        status === "UNDER_REVIEW" ? "bg-amber-600" :
                                            status === "CONTACTED" ? "bg-purple-600" :
                                                status === "COUNSELLING_SCHEDULED" ? "bg-cyan-600" :
                                                    status === "COUNSELLING_COMPLETED" ? "bg-teal-600" :
                                                        status === "FOLLOWUP_REQUIRED" ? "bg-rose-600" :
                                                            status === "INTERESTED" ? "bg-emerald-600" :
                                                                status === "NOT_INTERESTED" ? "bg-slate-500" :
                                                                    status === "ON_HOLD" ? "bg-orange-500" :
                                                                        status === "CLOSED" ? "bg-black" :
                                                                            status === "CONVERTED" ? "bg-emerald-600" : "bg-gray-400"}
                                `} />
                                {status.replace(/_/g, ' ')}
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent onMouseLeave={() => setIsOpen(false)}>
                            {statusOptions.map((opt) => (
                                <DropdownMenuItem
                                    key={opt}
                                    onClick={() => handleUpdate(row.original.id, "status", opt)}
                                    className={opt === status ? "bg-primary/10 text-primary font-medium" : ""}
                                >
                                    {opt}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
        {
            accessorKey: "temperature",
            header: "Temp",
            cell: ({ row }) => {
                const temp = row.getValue("temperature") as string;
                const [isOpen, setIsOpen] = useState(false);

                return (
                    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                        <DropdownMenuTrigger asChild onMouseEnter={() => setIsOpen(true)}>
                            <div className={`
                                cursor-pointer hover:bg-gray-100 transition-all
                                inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border
                                ${temp === "HOT" ? "border-orange-200 text-orange-600" :
                                    temp === "WARM" ? "border-yellow-200 text-yellow-600 ml-3" : "border-blue-200 text-blue-600 ml-3"}
                            `}>
                                {temp}
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent onMouseLeave={() => setIsOpen(false)}>
                            {tempOptions.map((opt) => (
                                <DropdownMenuItem
                                    key={opt}
                                    onClick={() => handleUpdate(row.original.id, "temperature", opt)}
                                    className={opt === temp ? "bg-primary/10 text-primary font-medium" : ""}
                                >
                                    {opt}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2">
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCall(row.original);
                            }}
                            className={`h-8 w-8 p-0 ${isCalling === row.original.id ? 'text-orange-500' : 'text-primary hover:bg-primary/5'}`}
                            title="Call Lead"
                            disabled={!!isCalling}
                        >
                            <Phone className={`h-4 w-4 ${isCalling === row.original.id ? 'animate-pulse' : ''}`} />
                        </Button>
                        {(session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER" || session?.user?.role === "AGENT") && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAssignClick(row.original);
                                    }}
                                    className="h-8 w-8 p-0 text-primary hover:bg-primary/5"
                                    title="Assign Lead"
                                >
                                    <UserPlus className="h-4 w-4" />
                                </Button>
                                {row.original.status !== 'CONVERTED' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setConvertingLead(row.original);
                                            setConvertModalOpen(true);
                                        }}
                                        className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50"
                                        title="Convert to Student"
                                    >
                                        <Zap className="h-4 w-4" />
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            {(session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER" || session?.user?.role === "AGENT") && (
                                <DropdownMenuItem
                                    onClick={() => handleAssignClick(row.original)}
                                    className="cursor-pointer text-primary"
                                >
                                    <UserPlus className="mr-2 h-4 w-4" /> Assign Lead
                                </DropdownMenuItem>
                            )}
                            {row.original.status !== 'CONVERTED' && (
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setConvertingLead(row.original);
                                        setConvertModalOpen(true);
                                    }}
                                    className="cursor-pointer text-emerald-600 font-bold bg-emerald-50 hover:bg-emerald-100"
                                >
                                    <UserPlus className="mr-2 h-4 w-4" /> Convert to Student
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                                <Link href={prefixPath(`/leads/${row.original.id}`)} className="cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" /> View
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    setEditingLeadId(row.original.id);
                                    setEditSheetOpen(true);
                                }}
                                className="cursor-pointer"
                            >
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-600 cursor-pointer"
                                onClick={() => handleDeleteClick(row.original.id)}
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
                        {table.getRowModel().rows.length > 0 ? (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    onClick={() => router.push(prefixPath(`/leads/${row.original.id}`))}
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
                                                // Prevent row click if the click is on an interactive element inside the cell
                                                // This is a safety measure, though specific buttons should also call stopPropagation
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
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </td>
                            </tr>
                        )}
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
                                className="rounded-xl h-8 w-8 border-primary/20 text-primary hover:bg-primary/5 shadow-sm"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="rounded-xl h-8 w-8 border-primary/20 text-primary hover:bg-primary/5 shadow-sm"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <AssignLeadSheet
                isOpen={assignDialogOpen}
                onClose={() => setAssignDialogOpen(false)}
                leadId={selectedLead?.id || null}
                leadName={selectedLead?.name || null}
                onAssign={onUpdate}
            />

            <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
                <SheetContent className="overflow-y-auto w-full sm:max-w-sm">
                    <SheetHeader>
                        <SheetTitle>Edit Lead</SheetTitle>
                        <SheetDescription>
                            Update the lead details below.
                        </SheetDescription>
                    </SheetHeader>
                    {editingLeadId && (
                        <LeadForm
                            leadId={editingLeadId}
                            onSuccess={() => {
                                setEditSheetOpen(false);
                                onUpdate();
                            }}
                        />
                    )}
                </SheetContent>
            </Sheet>

            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setLeadToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Lead"
                description="Are you sure you want to delete this lead? This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
            />

            <ConvertToStudentModal
                isOpen={convertModalOpen}
                onClose={() => setConvertModalOpen(false)}
                lead={convertingLead}
                onSuccess={(studentId) => {
                    setConvertModalOpen(false);
                    onUpdate();
                    toast.success("Lead converted successfully");
                    router.push(prefixPath(`/students/${studentId}`));
                }}
            />
        </div>
    );
}
