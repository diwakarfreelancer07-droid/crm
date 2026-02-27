"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone } from "lucide-react";
import { CallLogCard } from "./CallLogCard";

interface CallHistoryListProps {
    leadId?: string;
    studentId?: string;
}

interface Pagination {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
}

export function CallHistoryList({ leadId, studentId }: CallHistoryListProps) {
    const [callLogs, setCallLogs] = useState<any[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        totalPages: 1,
        total: 0,
        limit: 10,
    });
    const [isLoading, setIsLoading] = useState(false);

    const fetchCallLogs = useCallback(
        async (page = 1, limit = 10) => {
            if (!leadId && !studentId) return;

            setIsLoading(true);
            try {
                const params = new URLSearchParams({
                    page: String(page),
                    limit: String(limit),
                });
                if (leadId) params.set("leadId", leadId);
                if (studentId) params.set("studentId", studentId);

                const response = await axios.get(`/api/calls?${params.toString()}`);
                setCallLogs(response.data.callLogs);
                setPagination(response.data.pagination);
            } catch (error) {
                console.error("Failed to fetch call logs:", error);
            } finally {
                setIsLoading(false);
            }
        },
        [leadId, studentId]
    );

    useEffect(() => {
        fetchCallLogs(1, pagination.limit);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leadId, studentId]);

    return (
        <Card className="border border-border rounded-2xl bg-card shadow-none overflow-hidden">
            <CardHeader className="pb-2 border-b border-border/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    Call History
                    {pagination.total > 0 && (
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                            ({pagination.total})
                        </span>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                ) : callLogs.length > 0 ? (
                    <div className="divide-y divide-border/50">
                        {callLogs.map((log) => (
                            <CallLogCard key={log.id} callLog={log} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-14 text-muted-foreground/50">
                        <Phone className="h-10 w-10 mb-3 opacity-10" />
                        <p className="text-xs font-medium italic tracking-tight">No call history yet</p>
                    </div>
                )}

                {/* Pagination footer */}
                <div className="p-4 border-t border-border/50 bg-muted/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground font-medium">Rows per page</p>
                        <Select
                            value={String(pagination.limit)}
                            onValueChange={(val) => {
                                const newLimit = Number(val);
                                setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
                                fetchCallLogs(1, newLimit);
                            }}
                        >
                            <SelectTrigger className="h-8 w-[60px] text-xs bg-background border-border/50">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[5, 10, 20, 50].map((n) => (
                                    <SelectItem key={n} value={String(n)} className="text-xs">
                                        {n}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-4">
                        <p className="text-xs text-muted-foreground font-medium">
                            {pagination.total > 0
                                ? `${(pagination.page - 1) * pagination.limit + 1}–${Math.min(
                                    pagination.page * pagination.limit,
                                    pagination.total
                                )} of ${pagination.total}`
                                : "No calls"}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-lg text-xs border-primary/20 text-primary hover:bg-primary/5"
                                onClick={() => fetchCallLogs(pagination.page - 1, pagination.limit)}
                                disabled={pagination.page <= 1 || isLoading}
                            >
                                &lt;
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-lg text-xs border-primary/20 text-primary hover:bg-primary/5"
                                onClick={() => fetchCallLogs(pagination.page + 1, pagination.limit)}
                                disabled={pagination.page >= pagination.totalPages || isLoading}
                            >
                                &gt;
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
