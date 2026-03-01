"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRolePath } from "@/hooks/use-role-path";
import { VisaApplicationDetailView } from "@/components/visa/VisaApplicationDetailView";
import { ApplicationHistoryModal } from "@/components/applications/ApplicationHistoryModal";
import { ApplicationNotesModal } from "@/components/applications/ApplicationNotesModal";

export default function VisaApplicationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { prefixPath } = useRolePath();
    const [visaApp, setVisaApp] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Modal states
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isNotesOpen, setIsNotesOpen] = useState(false);

    const fetchVisaApplication = async () => {
        try {
            const response = await axios.get(`/api/visa-applications/${params.id}`);
            setVisaApp(response.data);
        } catch (error: any) {
            console.error("Failed to fetch visa application:", error);
            toast.error("Failed to load visa application details");
            router.push(prefixPath("/visa-applications"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) {
            fetchVisaApplication();
        }
    }, [params.id]);

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-64 rounded-2xl" />
                    <Skeleton className="h-64 rounded-2xl" />
                    <Skeleton className="h-64 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!visaApp) return null;

    return (
        <>
            <VisaApplicationDetailView
                visaApplication={visaApp}
                onUpdate={fetchVisaApplication}
                onOpenHistory={() => setIsHistoryOpen(true)}
                onOpenNotes={() => setIsNotesOpen(true)}
            />

            <ApplicationHistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                applicationId={visaApp.id}
                application={visaApp}
            />

            <ApplicationNotesModal
                isOpen={isNotesOpen}
                onClose={() => setIsNotesOpen(false)}
                applicationId={visaApp.id}
                onUpdate={fetchVisaApplication}
            />
        </>
    );
}
