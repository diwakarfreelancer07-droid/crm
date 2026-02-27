"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRolePath } from "@/hooks/use-role-path";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface Task {
    id: string;
    title: string;
    description: string | null;
    dueAt: string;
    lead: {
        name: string;
    };
}

interface UpcomingTasksProps {
    tasks: Task[];
    isLoading: boolean;
}

export function UpcomingTasks({ tasks, isLoading }: { tasks: any[], isLoading: boolean }) {
    const { prefixPath } = useRolePath();
    if (isLoading) {
        return (
            <Card className="rounded-xl border-border shadow-none h-full">
                <CardHeader>
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <CalendarClock className="w-5 h-5 text-primary" />
                        Upcoming Tasks
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3">
                            <Skeleton className="w-4 h-4 rounded-full mt-1" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-xl border-border shadow-none h-full flex flex-col">
            <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-primary" />
                    Upcoming Tasks
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
                <div className="space-y-4 flex-1">
                    {tasks.length > 0 ? (
                        tasks.map((task) => (
                            <div key={task.id} className="flex gap-3 group">
                                <div className="mt-1">
                                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary transition-colors cursor-pointer" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                        {task.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                        <span className="font-medium text-primary/80">{task.lead.name}</span>
                                        <span>•</span>
                                        <span>{new Date(task.dueAt).toLocaleDateString()} {new Date(task.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-8">
                            <CheckCircle2 className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm">No upcoming tasks</p>
                        </div>
                    )}
                </div>
                <div className="pt-4 mt-auto border-t border-border/50">
                    <Link href={prefixPath("/leads")} className="text-sm font-semibold text-primary hover:opacity-80 transition-opacity flex items-center gap-1">
                        View all tasks <span className="text-lg leading-none">›</span>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
