"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Plane, Filter, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { VisaApplicationsTable } from "@/components/dashboard/VisaApplicationsTable";
import { useVisaApplications, useDeleteVisaApplication } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApplicationHistoryModal } from "@/components/applications/ApplicationHistoryModal";
import { ApplicationNotesModal } from "@/components/applications/ApplicationNotesModal";

export default function VisaApplicationsPage() {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("ALL");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const debouncedSearch = useDebounce(search, 500);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Modal states
    const [historyApp, setHistoryApp] = useState<any>(null);
    const [notesApp, setNotesApp] = useState<any>(null);

    const { data, isLoading, refetch } = useVisaApplications(undefined, page, limit, debouncedSearch, status);
    const deleteMutation = useDeleteVisaApplication();

    const visaApplications = data?.visaApplications || [];
    const pagination = data?.pagination || { page: 1, limit: 10, totalPages: 1, total: 0 };

    // Reset page on search/filter changes
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, status]);

    const handleDelete = async (id: string) => {
        try {
            await deleteMutation.mutateAsync(id);
            refetch();
        } catch (error) {
            console.error(error);
        }
    };

    if (isLoading && page === 1) {
        return <div className="p-10 animate-pulse bg-muted/20 h-screen rounded-3xl" />;
    }

    return (
        <div className="flex flex-col gap-3 p-3 sm:p-4 bg-slate-50/50 min-h-screen">
            <Card className="border-0 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm shadow-sm ring-1 ring-slate-200/50">
                <CardContent className="p-4">
                    {/* Integrated Header Row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                        <div className="relative max-w-sm w-full">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                            <Input
                                placeholder="Search student or country..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 bg-slate-50 border-0 focus-visible:ring-1 focus-visible:ring-primary/20 h-10 text-[13px] placeholder:text-muted-foreground/40 font-sans w-full rounded-xl transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="h-9 px-4 rounded-xl border-slate-200 bg-white/50 font-bold text-slate-600 gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                {pagination.total} Records
                            </Badge>
                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {[
                            { id: "ALL", label: "All", color: "text-primary", bg: "bg-primary/10" },
                            { id: "PENDING", label: "Pending", color: "text-amber-600", bg: "bg-amber-600/10" },
                            { id: "FILE_SUBMITTED", label: "Submitted", color: "text-blue-600", bg: "bg-blue-600/10" },
                            { id: "PROCESS", label: "In Process", color: "text-indigo-600", bg: "bg-indigo-600/10" },
                            { id: "VISA_APPROVED", label: "Approved", color: "text-emerald-600", bg: "bg-emerald-600/10" },
                            { id: "VISA_REJECTED", label: "Rejected", color: "text-rose-600", bg: "bg-rose-600/10" },
                            { id: "VISA_REFUSED", label: "Refused", color: "text-red-700", bg: "bg-red-700/10" },
                            { id: "DEFERRED", label: "Deferred", color: "text-pink-600", bg: "bg-pink-600/10" },
                            { id: "ENROLLED", label: "Enrolled", color: "text-cyan-600", bg: "bg-cyan-600/10" },
                        ].map((f) => (
                            <button
                                key={f.id}
                                onClick={() => setStatus(f.id)}
                                className={`
                                    px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all border
                                    ${status === f.id
                                        ? `${f.bg} border-transparent shadow-sm ring-1 ring-inset ${f.color.replace('text-', 'ring-')}/30`
                                        : "bg-white hover:bg-slate-50 text-slate-500 border-slate-200"
                                    }
                                `}
                            >
                                <span className={`text-[10px] font-extrabold uppercase tracking-widest ${status === f.id ? f.color : ""}`}>
                                    {f.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    {isLoading ? (
                        <div className="space-y-4 p-4">
                            <div className="h-10 bg-slate-50 animate-pulse rounded-xl w-full" />
                            <div className="h-40 bg-slate-50 animate-pulse rounded-xl w-full" />
                        </div>
                    ) : (
                        <VisaApplicationsTable
                            data={visaApplications}
                            onUpdate={refetch}
                            onDelete={handleDelete}
                            selectedIds={selectedIds}
                            onSelectionChange={setSelectedIds}
                            onOpenHistory={(app) => setHistoryApp(app)}
                            onOpenNotes={(app) => setNotesApp(app)}
                            pagination={{
                                page: pagination.page,
                                totalPages: pagination.totalPages,
                                pageSize: limit,
                                onPageChange: setPage,
                                onPageSizeChange: setLimit
                            }}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Modals - using existing components from applications folder */}
            <ApplicationHistoryModal
                isOpen={!!historyApp}
                onClose={() => setHistoryApp(null)}
                applicationId={historyApp?.id}
                application={historyApp}
            />

            <ApplicationNotesModal
                isOpen={!!notesApp}
                onClose={() => setNotesApp(null)}
                applicationId={notesApp?.id}
                onUpdate={refetch}
            />
        </div>
    );
}
