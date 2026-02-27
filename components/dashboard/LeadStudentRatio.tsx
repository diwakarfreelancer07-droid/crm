"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LeadStudentRatioProps {
    totalLeads: number;
    totalStudents: number;
    isLoading: boolean;
}

export function LeadStudentRatio({ totalLeads, totalStudents, isLoading }: LeadStudentRatioProps) {
    if (isLoading) {
        return (
            <Card className="rounded-xl border-border shadow-none">
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse h-20 bg-muted rounded"></div>
                </CardContent>
            </Card>
        );
    }

    const ratio = totalLeads > 0 ? (totalStudents / totalLeads) * 100 : 0;

    return (
        <Card className="rounded-xl border-border shadow-none h-full flex flex-col justify-center bg-card/50 backdrop-blur-sm">
            <CardHeader className="p-3.5 pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 pt-0">
                <div className="flex items-end justify-between mb-2">
                    <div>
                        <div className="text-xl font-bold leading-none">{ratio.toFixed(1)}%</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium mb-0.5">
                        <span className="flex items-center gap-0.5"><UserCheck className="w-3 h-3 text-teal-600" /> {totalStudents}</span>
                        <span>/</span>
                        <span className="flex items-center gap-0.5"><Users className="w-3 h-3 text-primary" /> {totalLeads}</span>
                    </div>
                </div>
                <Progress value={ratio} className="h-1.5" indicatorClassName="bg-teal-600 shadow-sm" />
            </CardContent>
        </Card>
    );
}
