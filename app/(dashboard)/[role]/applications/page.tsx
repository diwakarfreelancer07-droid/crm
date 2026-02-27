"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, FileSpreadsheet, Trash2, UserPlus, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { ApplicationsTable } from "@/components/dashboard/ApplicationsTable";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useApplications, useDeleteApplication, useBulkDeleteApplications } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useRolePath } from "@/hooks/use-role-path";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { Application } from "@/types/api";

// New Modals
import { ApplicationHistoryModal } from "@/components/applications/ApplicationHistoryModal";
import { ApplicationNotesModal } from "@/components/applications/ApplicationNotesModal";
import { AssignApplicationsModal } from "@/components/applications/AssignApplicationsModal";
import { EmailComposeModal } from "@/components/applications/EmailComposeModal";
import { WhatsappMessageModal } from "@/components/applications/WhatsappMessageModal";
import { StudentApplicationsModal } from "@/components/applications/StudentApplicationsModal";

export default function ApplicationsPage() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [status, setStatus] = useState<string | null>(null);
    const router = useRouter();
    const { prefixPath } = useRolePath();

    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading, refetch } = useApplications(page, limit, debouncedSearch, status);
    const deleteMutation = useDeleteApplication();
    const bulkDeleteMutation = useBulkDeleteApplications();

    // Selection state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Modal states
    const [historyApp, setHistoryApp] = useState<any>(null);
    const [notesApp, setNotesApp] = useState<any>(null);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
    const [studentAppsModal, setStudentAppsModal] = useState<any>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // Reset page on search/filter changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, status]);

    const applications = data?.applications || [];
    const pagination = data?.pagination || { page: 1, limit: 10, totalPages: 1, total: 0 };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        try {
            await bulkDeleteMutation.mutateAsync(selectedIds);
            toast.success("Applications deleted successfully");
            setSelectedIds([]);
            refetch();
        } catch (error) {
            toast.error("Failed to delete applications");
        } finally {
            setDeleteConfirmOpen(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            const response = await axios.get("/api/applications/export", {
                params: { search, status },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Applications_${new Date().toISOString()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toast.error("Failed to export Excel");
        }
    };

    const handleAddAnother = (student: { id: string, name: string }) => {
        router.push(prefixPath(`/applications/new?studentId=${student.id}&studentName=${encodeURIComponent(student.name)}`));
    };


    if (isLoading && page === 1) {
        return <div className="p-10 animate-pulse bg-muted/20 h-screen rounded-2xl" />;
    }

    return (
        <div className="flex flex-col gap-4 p-4 min-h-screen bg-slate-50/50">
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-0">
                    {/* Top Action Bar */}
                    <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-500">Show</span>
                            <select
                                value={limit}
                                onChange={(e) => setLimit(Number(e.target.value))}
                                className="h-9 w-16 rounded-lg border border-slate-200 bg-white px-2 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <span className="text-sm font-medium text-slate-500">entries</span>

                            <div className="h-6 w-[1px] bg-slate-200 mx-2" />

                            <Button variant="outline" size="sm" onClick={handleExportExcel} className="h-9 gap-2 border-slate-200 hover:bg-slate-50 text-slate-700">
                                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                <span className="hidden sm:inline">Excel</span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteConfirmOpen(true)}
                                disabled={selectedIds.length === 0}
                                className="h-9 gap-2 border-slate-200 hover:bg-red-50 text-red-600 disabled:opacity-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Delete</span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAssignModalOpen(true)}
                                disabled={selectedIds.length === 0}
                                className="h-9 gap-2 border-slate-200 hover:bg-blue-50 text-blue-600 disabled:opacity-50"
                            >
                                <UserPlus className="h-4 w-4" />
                                <span className="hidden sm:inline">Assign</span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEmailModalOpen(true)}
                                disabled={selectedIds.length === 0}
                                className="h-9 gap-2 border-slate-200 hover:bg-amber-50 text-amber-600 disabled:opacity-50"
                            >
                                <Mail className="h-4 w-4" />
                                <span className="hidden sm:inline">Email</span>
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setWhatsappModalOpen(true)}
                                disabled={selectedIds.length === 0}
                                className="h-9 gap-2 border-slate-200 hover:bg-green-50 text-green-600 disabled:opacity-50"
                            >
                                <MessageSquare className="h-4 w-4" />
                                <span className="hidden sm:inline">Whatsapp</span>
                            </Button>
                        </div>

                        <div className="flex items-center gap-4 flex-1 justify-end">
                            <div className="flex items-center gap-3 mr-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                    <span className="text-xs font-semibold text-slate-600">Submitted</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    <span className="text-xs font-semibold text-slate-600">Finalized</span>
                                </div>
                            </div>

                            <div className="relative max-w-xs w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search Name / Email / ID..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-9 border-slate-200 rounded-lg bg-slate-50 focus:bg-white transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <ApplicationsTable
                        data={applications}
                        onUpdate={refetch}
                        onDelete={(id) => {
                            setSelectedIds([id]);
                            setDeleteConfirmOpen(true);
                        }}
                        onOpenHistory={(app) => setHistoryApp(app)}
                        onOpenNotes={(app) => setNotesApp(app)}
                        onOpenStudentApps={(student) => setStudentAppsModal(student)}
                        onAddAnother={handleAddAnother}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        pagination={{
                            page: pagination.page,
                            totalPages: pagination.totalPages,
                            pageSize: limit,
                            onPageChange: setPage,
                            onPageSizeChange: setLimit
                        }}
                    />
                </CardContent>
            </Card>

            {/* Modals */}
            <ApplicationHistoryModal
                isOpen={!!historyApp}
                onClose={() => setHistoryApp(null)}
                application={historyApp}
            />

            <ApplicationNotesModal
                isOpen={!!notesApp}
                onClose={() => setNotesApp(null)}
                application={notesApp}
                onUpdate={refetch}
            />

            <AssignApplicationsModal
                isOpen={assignModalOpen}
                onClose={() => setAssignModalOpen(false)}
                selectedIds={selectedIds}
                selectedNames={applications.filter((a: Application) => selectedIds.includes(a.id)).map((a: Application) => a.student?.name || "Unknown")}
                onSuccess={() => {
                    setSelectedIds([]);
                    refetch();
                }}
            />

            <EmailComposeModal
                isOpen={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                selectedEmails={applications.filter((a: Application) => selectedIds.includes(a.id)).map((a: Application) => a.student?.email).filter((email: any): email is string => !!email)}
            />

            <WhatsappMessageModal
                isOpen={whatsappModalOpen}
                onClose={() => setWhatsappModalOpen(false)}
                selectedStudents={applications.filter((a: Application) => selectedIds.includes(a.id)).map((a: Application) => ({
                    id: a.studentId,
                    name: a.student?.name || "Unknown",
                    phone: a.student?.phone || "No Phone",
                    leadId: a.student?.leadId
                }))}
            />

            <StudentApplicationsModal
                isOpen={!!studentAppsModal}
                onClose={() => setStudentAppsModal(null)}
                student={studentAppsModal}
                onUpdate={refetch}
            />

            <ConfirmDialog
                isOpen={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleBulkDelete}
                title="Confirm Deletion"
                description={`Are you sure you want to delete ${selectedIds.length} application(s)? This action cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
            />
        </div>
    );
}
