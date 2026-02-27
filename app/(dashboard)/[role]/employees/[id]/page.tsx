"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import EmployeeForm from "@/components/forms/EmployeeForm";
import {
    ArrowLeft,
    UserCheck,
    Pencil,
    UserX,
    TrendingUp,
    Users
} from "lucide-react";
import { toast } from "sonner";

export default function EmployeeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession() as any;
    const [employee, setEmployee] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showEditDialog, setShowEditDialog] = useState(false);

    // Pagination state for assignments
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // Confirm Dialog State
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        description: "",
        confirmText: "Confirm",
        variant: "default" as "default" | "destructive",
        onConfirm: async () => { },
        isLoading: false,
    });

    const openConfirm = (
        title: string,
        description: string,
        onConfirm: () => Promise<void>,
        variant: "default" | "destructive" = "default",
        confirmText = "Confirm"
    ) => {
        setConfirmConfig({
            isOpen: true,
            title,
            description,
            confirmText,
            variant,
            onConfirm,
            isLoading: false,
        });
    };

    const handleConfirmAction = async () => {
        setConfirmConfig(prev => ({ ...prev, isLoading: true }));
        try {
            await confirmConfig.onConfirm();
            setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            console.error("Confirmation action failed", error);
        } finally {
            setConfirmConfig(prev => ({ ...prev, isLoading: false }));
        }
    };

    const fetchEmployee = async () => {
        try {
            const response = await axios.get(`/api/employees/${params.id}`);
            setEmployee(response.data);
        } catch (error) {
            toast.error("Failed to fetch employee details");
            router.push("/employees");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateEmployee = async (e: any) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: formData.get("name"),
            email: formData.get("email"),
            role: formData.get("role"),
            phone: formData.get("phone"),
            department: formData.get("department"),
        };

        try {
            await axios.patch(`/api/employees/${params.id}`, data);
            toast.success("Employee updated successfully");
            setShowEditDialog(false);
            fetchEmployee();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to update employee");
        }
    };

    const handleDeactivateEmployee = () => {
        openConfirm(
            "Deactivate Employee",
            "Are you sure you want to deactivate this employee?",
            async () => {
                try {
                    await axios.delete(`/api/employees/${params.id}`);
                    toast.success("Employee deactivated successfully");
                    router.push("/employees");
                } catch (error: any) {
                    toast.error(error.response?.data?.error || "Failed to deactivate employee");
                }
            },
            "destructive",
            "Deactivate"
        );
    };

    useEffect(() => {
        fetchEmployee();
    }, [params.id]);

    // Check if user has access
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MANAGER" && session?.user?.role !== "AGENT") {
        return (
            <div className="p-10">
                <Card className="border-0 shadow-sm rounded-3xl">
                    <CardContent className="p-16 text-center">
                        <p className="text-gray-500">You don't have permission to view this page.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="p-10">
                <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!employee) return null;

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl h-8 w-8 hover:bg-muted"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold text-foreground">Counselor Details</h1>
                    <p className="text-xs text-muted-foreground">Manage and view counselor information</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Employee Profile Card */}
                <div className="col-span-1 space-y-6">
                    <Card className="border border-border rounded-2xl bg-card shadow-none overflow-hidden">
                        <CardHeader className="pb-3 border-b border-border/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 text-xl font-bold">
                                        {employee.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="space-y-0.5">
                                        <CardTitle className="text-lg font-bold">{employee.name}</CardTitle>
                                        <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider">{employee.role}</p>
                                    </div>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className={`text-[10px] py-0 px-2 rounded-md ${employee.isActive
                                        ? "bg-green-500/10 text-green-600 border-0"
                                        : "bg-muted text-muted-foreground border-0"
                                        }`}
                                >
                                    {employee.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5 space-y-5">
                            <div className="grid gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Contact Information</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Email</span>
                                            <span className="font-semibold">{employee.email}</span>
                                        </div>
                                        {employee.employeeProfile?.phone && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Phone</span>
                                                <span className="font-semibold">{employee.employeeProfile.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Employment Info</p>
                                    <div className="space-y-2">
                                        {employee.employeeProfile?.department && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Department</span>
                                                <span className="font-semibold">{employee.employeeProfile.department}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Joined</span>
                                            <span className="font-semibold">
                                                {new Date(employee.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border/50 flex flex-col gap-2">
                                <Button
                                    className="w-full bg-cyan-600 hover:bg-cyan-700 rounded-xl h-9 text-sm"
                                    onClick={() => setShowEditDialog(true)}
                                    disabled={
                                        session?.user?.role !== "ADMIN" &&
                                        session?.user?.id !== employee.id
                                    }
                                >
                                    <Pencil className="h-3.5 w-3.5 mr-2" />
                                    Edit Profile
                                </Button>
                                {session?.user?.role === "ADMIN" && employee.isActive && (
                                    <Button
                                        variant="ghost"
                                        className="w-full text-destructive hover:text-destructive hover:bg-destructive/5 rounded-xl h-9 text-sm"
                                        onClick={handleDeactivateEmployee}
                                    >
                                        <UserX className="h-3.5 w-3.5 mr-2" />
                                        Deactivate Counselor
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Card */}
                    <Card className="border border-border rounded-2xl bg-card shadow-none">
                        <CardHeader className="pb-2 border-b border-border/50">
                            <CardTitle className="text-xs font-bold flex items-center gap-2">
                                <TrendingUp className="h-3.5 w-3.5 text-cyan-600" />
                                Performance Insight
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Leads</span>
                                <p className="text-lg font-bold text-foreground">
                                    {employee.assignedLeads?.length || 0}
                                </p>
                            </div>
                            <div className="space-y-1 border-l pl-3 border-border/50">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Activities</span>
                                <p className="text-lg font-bold text-foreground">
                                    {employee.activities?.length || 0}
                                </p>
                            </div>
                            <div className="space-y-1 border-l pl-3 border-border/50">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Converted</span>
                                <p className="text-lg font-bold text-foreground">
                                    {employee.onboardedStudents?.length || 0}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Area: Assignments & Converted Customers */}
                <div className="col-span-2 space-y-6">
                    {/* Assigned Leads */}
                    <Card className="border border-border rounded-2xl bg-card shadow-none overflow-hidden">
                        <CardHeader className="pb-2 border-b border-border/50">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-cyan-600" />
                                Current Assignments
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {employee.assignedLeads && employee.assignedLeads.length > 0 ? (
                                <>
                                    <div className="divide-y divide-border/50">
                                        {employee.assignedLeads
                                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                            .map((assignment: any) => (
                                                <div
                                                    key={assignment.id}
                                                    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                                                    onClick={() => router.push(`/leads/${assignment.lead.id}`)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center font-bold text-xs">
                                                            {assignment.lead.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-foreground">
                                                                {assignment.lead.name}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground">
                                                                Since {new Date(assignment.assignedAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            variant="secondary"
                                                            className={`text-[9px] font-bold py-0.5 px-1.5 border-0 ${assignment.lead.status === "NEW"
                                                                ? "bg-blue-500/10 text-blue-600"
                                                                : assignment.lead.status === "IN_PROGRESS"
                                                                    ? "bg-yellow-500/10 text-yellow-600"
                                                                    : assignment.lead.status === "CONVERTED"
                                                                        ? "bg-green-500/10 text-green-600"
                                                                        : "bg-muted text-muted-foreground"
                                                                }`}
                                                        >
                                                            {assignment.lead.status}
                                                        </Badge>
                                                        <Badge
                                                            variant="secondary"
                                                            className={`text-[9px] font-bold py-0.5 px-1.5 border-0 ${assignment.lead.temperature === "HOT"
                                                                ? "bg-red-500/10 text-red-600"
                                                                : assignment.lead.temperature === "WARM"
                                                                    ? "bg-orange-500/10 text-orange-600"
                                                                    : "bg-blue-500/10 text-blue-600"
                                                                }`}
                                                        >
                                                            {assignment.lead.temperature}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                    {/* Pagination Controls */}
                                    {employee.assignedLeads.length > itemsPerPage && (
                                        <div className="flex items-center justify-between p-4 border-t border-border/50">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs text-muted-foreground">Rows per page</p>
                                                <Select
                                                    value={itemsPerPage.toString()}
                                                    onValueChange={(value) => {
                                                        setItemsPerPage(Number(value));
                                                        setCurrentPage(1);
                                                    }}
                                                >
                                                    <SelectTrigger className="h-8 w-[70px]">
                                                        <SelectValue placeholder={itemsPerPage} />
                                                    </SelectTrigger>
                                                    <SelectContent side="top">
                                                        {[5, 10, 20, 50].map((pageSize) => (
                                                            <SelectItem key={pageSize} value={pageSize.toString()}>
                                                                {pageSize}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <p className="text-xs text-muted-foreground">
                                                    Page {currentPage} of {Math.ceil(employee.assignedLeads.length / itemsPerPage)}
                                                </p>
                                                <div className="flex bg-muted/20 rounded-md">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 rounded-l-md"
                                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                        disabled={currentPage === 1}
                                                    >
                                                        &lt;
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 rounded-r-md"
                                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(employee.assignedLeads.length / itemsPerPage)))}
                                                        disabled={currentPage === Math.ceil(employee.assignedLeads.length / itemsPerPage)}
                                                    >
                                                        &gt;
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50">
                                    <UserCheck className="h-10 w-10 mb-3 opacity-10" />
                                    <p className="text-xs font-medium italic tracking-tight">No leads assigned</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Converted Students Section */}
                    <Card className="border border-border rounded-2xl bg-card shadow-none overflow-hidden">
                        <CardHeader className="pb-2 border-b border-border/50 bg-teal-500/5">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Users className="h-4 w-4 text-teal-600" />
                                Converted Students
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {employee.onboardedStudents && employee.onboardedStudents.length > 0 ? (
                                <>
                                    <div className="divide-y divide-border/50">
                                        {employee.onboardedStudents.map((student: any) => (
                                            <div
                                                key={student.id}
                                                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                                                onClick={() => router.push(`/students/${student.id}`)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center font-bold text-xs">
                                                        {student.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-foreground">
                                                            {student.name}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            Converted on {new Date(student.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-medium">{student.phone}</p>
                                                    {student.lead?.source && (
                                                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{student.lead.source}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/50">
                                    <Users className="h-10 w-10 mb-3 opacity-10" />
                                    <p className="text-xs font-medium italic tracking-tight">No students converted yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Edit Employee Sheet */}
            <Sheet open={showEditDialog} onOpenChange={setShowEditDialog}>
                <SheetContent className="overflow-y-auto w-full sm:max-w-md flex flex-col p-0">
                    <div className="p-6 pb-2">
                        <SheetHeader>
                            <SheetTitle>Edit Employee</SheetTitle>
                            <SheetDescription>
                                Update employee details.
                            </SheetDescription>
                        </SheetHeader>
                    </div>
                    <div className="flex-1 px-6">
                        <EmployeeForm
                            formId="edit-employee-form"
                            employee={employee}
                            onSuccess={() => {
                                setShowEditDialog(false);
                                fetchEmployee();
                                toast.success("Employee updated successfully");
                            }}
                        />
                    </div>
                    <div className="p-6 pt-2 mt-auto border-t">
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" form="edit-employee-form" className="bg-cyan-600 hover:bg-cyan-700">
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <ConfirmDialog
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmAction}
                title={confirmConfig.title}
                description={confirmConfig.description}
                confirmText={confirmConfig.confirmText}
                variant={confirmConfig.variant}
                isLoading={confirmConfig.isLoading}
            />
        </div>
    );
}
