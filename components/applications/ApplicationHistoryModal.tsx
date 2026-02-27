"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    Clock,
    User,
    Calendar,
    ArrowRight
} from "lucide-react";
import { format } from "date-fns";

export function ApplicationHistoryModal({ isOpen, onClose, application }: any) {
    const { data: history, isLoading } = useQuery({
        queryKey: ['application-history', application?.id],
        queryFn: async () => {
            if (!application?.id) return [];
            const response = await fetch(`/api/audit-logs?entityId=${application.id}&module=APPLICATIONS`);
            if (!response.ok) throw new Error('Failed to fetch history');
            return response.json();
        },
        enabled: !!application?.id && isOpen
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border-none shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                        <Clock className="h-5 w-5 text-primary" />
                        Application History
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-6 space-y-6">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : history?.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 italic">
                            No history records found for this application.
                        </div>
                    ) : (
                        <div className="relative pl-6 space-y-8 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                            {history?.map((log: any) => (
                                <div key={log.id} className="relative">
                                    <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-primary shadow-sm" />

                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                                                {log.action.replace('_', ' ')}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md uppercase">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(log.createdAt), "MMM d, yyyy • HH:mm")}
                                            </span>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <User className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="text-xs font-semibold text-slate-600">
                                                    {log.user?.name || "System"} ({log.user?.role})
                                                </span>
                                            </div>

                                            {log.metadata?.action === 'STATUS_CHANGED' && (
                                                <div className="flex items-center gap-3 text-sm">
                                                    <span className="px-2 py-1 rounded-md bg-slate-200 text-slate-600 font-bold text-xs">
                                                        {log.metadata.oldValue}
                                                    </span>
                                                    <ArrowRight className="h-4 w-4 text-slate-400" />
                                                    <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-bold text-xs">
                                                        {log.metadata.newValue}
                                                    </span>
                                                </div>
                                            )}

                                            {log.metadata?.action === 'NOTE_ADDED' && (
                                                <p className="text-sm text-slate-600 italic">
                                                    Added a new note.
                                                </p>
                                            )}

                                            {log.metadata?.action === 'LEAD_ASSIGNED' && (
                                                <p className="text-sm text-slate-600 italic">
                                                    Assigned to {log.metadata.assignedToName}.
                                                </p>
                                            )}

                                            {!log.metadata?.action && (
                                                <p className="text-sm text-slate-600 italic">
                                                    {log.action === 'CREATED' ? 'Application created.' : 'Application details updated.'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
