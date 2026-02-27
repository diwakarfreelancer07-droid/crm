"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { EmployeesTable } from "@/components/dashboard/EmployeesTable";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CreateEmployeeSheet } from "@/components/dashboard/CreateEmployeeSheet"; // We might want to customize this or pass a default role prop if supported
import { useEmployees, useDeleteEmployee, useToggleEmployeeStatus, useEmployeeStats } from "@/hooks/use-employees";
import { Skeleton } from "@/components/ui/skeleton";

export default function AgentsPage() {
    const { data: session } = useSession() as any;
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // Query Hook - Fetch only AGENTs
    const { data, isLoading } = useEmployees(statusFilter, page, limit, "AGENT");

    const employees = data?.agents || [];
    const pagination = data?.pagination || { page: 1, limit: 10, totalPages: 1, total: 0 };

    // Mutations
    const deleteEmployeeMutation = useDeleteEmployee();
    const toggleEmployeeStatusMutation = useToggleEmployeeStatus();
    const { data: employeeStats } = useEmployeeStats("AGENT");

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [statusId, setStatusId] = useState<string | null>(null);
    const [currentStatus, setCurrentStatus] = useState<boolean>(false);

    const filteredEmployees = employees.filter((emp: any) =>
    (emp.name?.toLowerCase().includes(search.toLowerCase()) ||
        emp.email?.toLowerCase().includes(search.toLowerCase()))
    );

    const handleToggleStatus = (id: string, status: boolean) => {
        setStatusId(id);
        setCurrentStatus(status);
    };

    const confirmStatusChange = async () => {
        if (!statusId) return;
        try {
            await toggleEmployeeStatusMutation.mutateAsync({ id: statusId, isActive: !currentStatus });
            toast.success(`Agent ${currentStatus ? 'deactivated' : 'activated'} successfully`);
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to update agent status");
        } finally {
            setStatusId(null);
        }
    };

    const handleDeleteEmployee = (employeeId: string) => {
        setDeleteId(employeeId);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteEmployeeMutation.mutateAsync(deleteId);
            toast.success("Agent deleted successfully");
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to delete agent");
        } finally {
            setDeleteId(null);
        }
    };

    // Check if user has access
    if (session?.user?.role !== "ADMIN") {
        return (
            <div className="p-10">
                <Card className="border-0 rounded-3xl">
                    <CardContent className="p-16 text-center">
                        <p className="text-gray-500">You don't have permission to view this page.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2 px-1">
                <h1 className="text-xl font-bold tracking-tight">Agents Management</h1>
            </div>

            {/* Employees Table Card */}
            <Card className="border-0 rounded-3xl overflow-hidden bg-card">
                <CardContent className="p-4">
                    {/* Integrated Search and Action Row */}
                    <div className="flex flex-row items-center justify-between gap-4">
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                            <Input
                                placeholder="Search agents..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-[13px] placeholder:text-muted-foreground/40 font-sans w-full"
                            />
                        </div>
                        {session?.user?.role === "ADMIN" && (
                            <CreateEmployeeSheet
                                onEmployeeCreated={() => { }}
                                defaultRole="AGENT"
                                title="Agent"
                            />
                        )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap gap-2 mt-3 mb-4">
                        {[
                            { id: "all", label: "Total", color: "text-red-500", bg: "bg-red-500/10", border: "" },
                            { id: "active", label: "Active", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "" },
                            { id: "inactive", label: "Inactive", color: "text-gray-500", bg: "bg-gray-500/10", border: "" },
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setStatusFilter(f.id)}
                                className={`
                                    px-3 py-1 rounded-lg flex items-center gap-2 transition-all
                                    ${statusFilter === f.id
                                        ? `${f.bg} shadow-sm border-0`
                                        : "bg-muted/50 hover:bg-muted text-muted-foreground"
                                    }
                                `}
                            >
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${statusFilter === f.id ? f.color : "text-muted-foreground"}`}>
                                        {f.label}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {isLoading ? (
                        <div className="p-8 space-y-4">
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                            <Skeleton className="h-12 w-full rounded-xl" />
                        </div>
                    ) : (
                        <EmployeesTable
                            data={filteredEmployees}
                            onUpdate={() => { }}
                            onDelete={handleDeleteEmployee}
                            onToggleStatus={handleToggleStatus}
                            title="Agent"
                            pagination={{
                                page: pagination.page,
                                totalPages: pagination.totalPages,
                                pageSize: limit,
                                onPageChange: setPage,
                                onPageSizeChange: (newLimit) => {
                                    setLimit(newLimit);
                                    setPage(1);
                                }
                            }}
                        />
                    )}
                </CardContent>
            </Card>

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Agent"
                description="Are you sure you want to delete this agent? This will unassign all their leads."
                confirmText="Delete"
                variant="destructive"
            />

            <ConfirmDialog
                isOpen={!!statusId}
                onClose={() => setStatusId(null)}
                onConfirm={confirmStatusChange}
                title={currentStatus ? "Deactivate Agent" : "Activate Agent"}
                description={
                    currentStatus
                        ? "Are you sure you want to deactivate this agent?"
                        : "Are you sure you want to activate this agent?"
                }
                confirmText={currentStatus ? "Deactivate" : "Activate"}
                variant={currentStatus ? "destructive" : "default"}
            />
        </div>
    );
}
