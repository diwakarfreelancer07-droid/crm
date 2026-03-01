"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, Loader2 } from "lucide-react";
import { useApplications } from "@/hooks/useApi";
import { ApplicationsTable } from "@/components/dashboard/ApplicationsTable";
import { useRouter } from "next/navigation";
import { useRolePath } from "@/hooks/use-role-path";

interface UniversityApplicationsSectionProps {
    studentId: string;
    studentName: string;
}

export function UniversityApplicationsSection({ studentId, studentName }: UniversityApplicationsSectionProps) {
    const router = useRouter();
    const { prefixPath } = useRolePath();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    // We need an API endpoint that filters by studentId. 
    // Assuming useApplications can take a studentId or we can filter the result.
    // Let's check if the API supports it.
    const { data, isLoading, refetch } = useApplications(page, limit, studentName); // Using studentName as search for now if studentId is not supported

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
                        pagination={{
                            page: data?.pagination.page || 1,
                            totalPages: data?.pagination.totalPages || 1,
                            pageSize: limit,
                            onPageChange: setPage,
                            onPageSizeChange: setLimit
                        }}
                    />
                )}
            </CardContent>
        </Card>
    );
}
