"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, Loader2 } from "lucide-react";
import { useApplications } from "@/hooks/useApi";
import { ApplicationsTable } from "@/components/dashboard/ApplicationsTable";
import { useRouter } from "next/navigation";
import { useRolePath } from "@/hooks/use-role-path";
import { OfferLetterModal } from "@/components/applications/OfferLetterModal";
import { ApplicationCommentsModal } from "@/components/applications/ApplicationCommentsModal";
import { ApplicationNotesModal } from "@/components/applications/ApplicationNotesModal";
import { ApplicationHistoryModal } from "@/components/applications/ApplicationHistoryModal";

interface UniversityApplicationsSectionProps {
    studentId: string;
    studentName: string;
}

export function UniversityApplicationsSection({ studentId, studentName }: UniversityApplicationsSectionProps) {
    const router = useRouter();
    const { prefixPath } = useRolePath();
    // Pass studentId to filter specifically for this student
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [offerLetterApp, setOfferLetterApp] = useState<any>(null);
    const [commentsApp, setCommentsApp] = useState<any>(null);
    const [historyApp, setHistoryApp] = useState<any>(null);
    const [notesApp, setNotesApp] = useState<any>(null);

    const { data, isLoading, refetch } = useApplications(page, limit, '', null, studentId);

    return (
        <Card className="border border-border rounded-2xl bg-card shadow-none overflow-hidden hover:border-primary/20 transition-all">
            <CardHeader className="pb-2 border-b border-border/50 flex flex-row items-center justify-between bg-white">
                <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" /> University Applications
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Manage university applications for this student.</p>
                </div>
                <Button
                    size="sm"
                    className="rounded-xl h-9 font-bold px-4"
                    onClick={() => router.push(prefixPath(`/students/${studentId}/applications/add`))}
                >
                    <Plus className="h-4 w-4 mr-2" /> Add Application
                </Button>
            </CardHeader>
            <CardContent className="p-0 bg-white">
                {isLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium italic animate-pulse">Fetching applications...</p>
                    </div>
                ) : (
                    <ApplicationsTable
                        data={data?.applications || []}
                        onUpdate={refetch}
                        onDelete={() => { }} // Disabled in this view or handle appropriately
                        onOpenHistory={(app) => setHistoryApp(app)}
                        onOpenComments={(app) => setCommentsApp(app)}
                        onOpenOfferLetters={(app) => setOfferLetterApp(app)}
                        onOpenNotes={(app) => setNotesApp(app)}
                        pagination={{
                            page: data?.pagination?.page || 1,
                            totalPages: data?.pagination?.totalPages || 1,
                            pageSize: limit,
                            onPageChange: setPage,
                            onPageSizeChange: setLimit
                        }}
                    />
                )}
            </CardContent>

            {/* Modals */}
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

            <OfferLetterModal
                isOpen={!!offerLetterApp}
                onClose={() => setOfferLetterApp(null)}
                application={offerLetterApp}
                onUpdate={refetch}
            />

            <ApplicationCommentsModal
                isOpen={!!commentsApp}
                onClose={() => setCommentsApp(null)}
                application={commentsApp}
                onUpdate={refetch}
            />
        </Card>
    );
}
