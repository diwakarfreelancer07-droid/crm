"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    School,
    User,
    Calendar,
    MapPin,
    ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRolePath } from "@/hooks/use-role-path";
import { Plus, History, Eye } from "lucide-react";
import { useState } from "react";
import { OfferLetterModal } from "./OfferLetterModal";
import { ApplicationCommentsModal } from "./ApplicationCommentsModal";
import { Button } from "@/components/ui/button";

export function StudentApplicationsModal({ isOpen, onClose, student }: any) {
    const { prefixPath } = useRolePath();
    const [offerLetterApp, setOfferLetterApp] = useState<any>(null);
    const [commentsApp, setCommentsApp] = useState<any>(null);
    const { data, isLoading } = useQuery({
        queryKey: ['student-applications', student?.id],
        queryFn: async () => {
            if (!student?.id) return [];
            const response = await fetch(`/api/applications?studentId=${student.id}`);
            if (!response.ok) throw new Error('Failed to fetch student applications');
            const result = await response.json();
            return result.applications || [];
        },
        enabled: !!student?.id && isOpen
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto rounded-2xl border-none shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                        <School className="h-5 w-5 text-primary" />
                        Applications for {student?.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-4 space-y-4">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : data?.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 italic">
                            No applications found for this student.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data?.map((app: any) => (
                                <div key={app.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/30 transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="space-y-1">
                                            <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors flex items-center gap-2">
                                                {app.university?.name || "N/A"}
                                            </h4>
                                            <p className="text-sm font-medium text-slate-600">
                                                {app.course?.name || app.intendedCourse || "N/A"}
                                            </p>
                                        </div>
                                        <Badge className={`uppercase text-[10px] font-bold px-2 py-0.5 rounded-md ${app.status === 'FINALIZED' ? 'bg-emerald-100 text-emerald-700' :
                                            app.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {app.status}
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-200/50">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                            <MapPin className="h-3 w-3" />
                                            {app.country?.name || "N/A"}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                            <Calendar className="h-3 w-3" />
                                            {app.intake || "N/A"}
                                        </div>
                                        <Link
                                            href={prefixPath(`/applications/${app.id}`)}
                                            className="ml-auto flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                                            onClick={onClose}
                                        >
                                            View Details
                                            <ExternalLink className="h-3 w-3" />
                                        </Link>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCommentsApp(app);
                                        }}
                                        className="h-8 flex-1 text-[10px] font-bold border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm rounded-xl"
                                    >
                                        <History className="h-3.5 w-3.5 mr-1" /> History
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <OfferLetterModal
                    isOpen={!!offerLetterApp}
                    onClose={() => setOfferLetterApp(null)}
                    application={offerLetterApp}
                    onUpdate={() => {
                        // Refetching is handled by react-query's key
                    }}
                />

                <ApplicationCommentsModal
                    isOpen={!!commentsApp}
                    onClose={() => setCommentsApp(null)}
                    application={commentsApp}
                    onUpdate={() => {
                        // Refetching is handled by react-query's key
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}
