"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Globe, Loader2 } from "lucide-react";
import { VisaApplicationsTable } from "./VisaApplicationsTable";
import { AddVisaApplicationModal } from "./AddVisaApplicationModal";
import { useVisaApplications, useDeleteVisaApplication } from "@/hooks/useApi";
import { toast } from "sonner";
import { OfferLetterModal } from "@/components/applications/OfferLetterModal";
import { ApplicationCommentsModal } from "@/components/applications/ApplicationCommentsModal";
import { ApplicationNotesModal } from "@/components/applications/ApplicationNotesModal";
import { ApplicationHistoryModal } from "@/components/applications/ApplicationHistoryModal";

interface VisaApplicationsSectionProps {
    studentId: string;
    studentName: string;
}

export default function VisaApplicationsSection({ studentId, studentName }: VisaApplicationsSectionProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [offerLetterApp, setOfferLetterApp] = useState<any>(null);
    const [commentsApp, setCommentsApp] = useState<any>(null);
    const [historyApp, setHistoryApp] = useState<any>(null);
    const [notesApp, setNotesApp] = useState<any>(null);

    const { data, isLoading, refetch } = useVisaApplications(studentId);
    const deleteMutation = useDeleteVisaApplication();

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this visa application?")) return;
        try {
            await deleteMutation.mutateAsync(id);
            refetch();
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    return (
        <Card className="border border-border rounded-2xl bg-card shadow-none overflow-hidden hover:border-primary/20 transition-all">
            <CardHeader className="pb-2 border-b border-border/50 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" /> Visa Applications
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Manage visa applications and status for this student.</p>
                </div>
                <Button
                    size="sm"
                    className="rounded-xl h-9 font-bold px-4"
                    onClick={() => setIsModalOpen(true)}
                >
                    <Plus className="h-4 w-4 mr-2" /> Add Visa Application
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm font-medium italic animate-pulse">Fetching visa applications...</p>
                    </div>
                ) : (
                    <VisaApplicationsTable
                        data={data?.visaApplications || []}
                        onUpdate={refetch}
                        onDelete={handleDelete}
                        onOpenHistory={(app) => setHistoryApp(app)}
                        onOpenComments={(app) => setCommentsApp(app)}
                        onOpenOfferLetters={(app) => setOfferLetterApp(app)}
                        onOpenNotes={(app) => setNotesApp(app)}
                    />
                )}
            </CardContent>

            <AddVisaApplicationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                studentId={studentId}
                studentName={studentName}
                onSuccess={() => {
                    refetch();
                    toast.success("Visa application added");
                }}
            />

            {/* Application Modals */}
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
