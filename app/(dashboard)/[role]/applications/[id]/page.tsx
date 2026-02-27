"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { ApplicationDetailView } from "@/components/application/ApplicationDetailView";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRolePath } from "@/hooks/use-role-path";

export default function ApplicationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { prefixPath } = useRolePath();
    const [application, setApplication] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchApplication = async () => {
        try {
            console.log("Fetching application with ID:", params.id);
            const response = await axios.get(`/api/applications/${params.id}`);
            console.log("Application fetched successfully:", response.data);
            setApplication(response.data);
        } catch (error: any) {
            console.error("Failed to fetch application:", error);
            if (error.response) {
                console.error("Error Response Data:", error.response.data);
                console.error("Error Response Status:", error.response.status);
                toast.error(`Failed to load: ${error.response.data?.error || "Application not found"} (${error.response.status})`);
            } else {
                toast.error("Failed to load application details (Network Error)");
            }
            router.push(prefixPath("/applications"));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchApplication();
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

    if (!application) return null;

    return (
        <ApplicationDetailView
            application={application}
            onUpdate={fetchApplication}
        />
    );
}
