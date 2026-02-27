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
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const debouncedSearch = useDebounce(search, 500);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Modal states
    const [historyApp, setHistoryApp] = useState<any>(null);
    const [notesApp, setNotesApp] = useState<any>(null);

    const { data, isLoading, refetch } = useVisaApplications(undefined, page, limit);
    const deleteMutation = useDeleteVisaApplication();

    const visaApplications = data?.visaApplications || [];
    const pagination = data?.pagination || { page: 1, limit: 10, totalPages: 1, total: 0 };

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
        <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-50/50">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-xl">
                            <Plane className="h-6 w-6 text-primary" />
                        </div>
                        Visa Applications
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium italic">
                        Track and manage visa processes for all students
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="h-10 px-4 rounded-xl border-slate-200 bg-white shadow-sm font-bold text-slate-600 gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        {pagination.total} Total Records
                    </Badge>
                </div>
            </div>

            {/* Main Content Card */}
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm border border-white/20">
                <CardContent className="p-0">
                    {/* Filters Bar */}
                    <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-white/50">
                        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search student or country..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 h-11 border-slate-200 rounded-2xl bg-white focus:ring-primary/20 transition-all font-medium text-slate-700"
                                />
                            </div>
                            <Button variant="outline" className="h-11 rounded-2xl border-slate-200 gap-2 font-bold text-slate-600 bg-white">
                                <Filter className="h-4 w-4" />
                                Filter
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl border-slate-200 text-slate-600 bg-white">
                                <SlidersHorizontal className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="p-2">
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
                    </div>
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
