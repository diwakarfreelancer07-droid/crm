"use client";

import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentLeadsTable } from "@/components/dashboard/RecentLeadsTable";
import { MapPin, Users, TrendingUp, Briefcase, UserCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { LeadAnalyticsGraph } from "@/components/dashboard/LeadAnalyticsGraph";
import { LeadStudentRatio } from "@/components/dashboard/LeadStudentRatio";
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks";
import { LeadStatusDistribution } from "@/components/dashboard/LeadStatusDistribution";
import { useRolePath } from "@/hooks/use-role-path";

interface DashboardData {
    stats: {
        totalLeads: number;
        totalStudents: number;
        totalEmployees: number;
        totalWebsites: number;
        activeWebsites: number;
        newLeadsToday: number;
        newStudentsToday: number;
        pendingTasksCount: number;
        isAdmin: boolean;
    };
    recentLeads: any[];
    upcomingTasks: any[];
    leadStatusCounts: any[];
    analytics: any[];
}

export default function DashboardPage() {
    const { prefixPath } = useRolePath();
    const { data, isLoading } = useQuery<DashboardData>({
        queryKey: ["dashboard-stats"],
        queryFn: async () => {
            const { data } = await axios.get("/api/dashboard");
            return data;
        },
    });

    const stats = data?.stats || {
        totalLeads: 0,
        totalStudents: 0,
        totalEmployees: 0,
        totalWebsites: 0,
        activeWebsites: 0,
        newLeadsToday: 0,
        newStudentsToday: 0,
        pendingTasksCount: 0,
        isAdmin: false
    };

    const recentLeads = data?.recentLeads || [];
    const isAdmin = stats.isAdmin;

    return (
        <div className="space-y-4 px-2">
            {/* ROW 1: Stats */}
            <div>
                <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-[16px] font-semibold text-foreground/80">Dashboard Overview</h2>
                    <span className="text-[10px] text-muted-foreground font-medium badge bg-muted/30 px-2 py-0.5 rounded-full border border-border/30">Last updated: Just now</span>
                </div>
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${isAdmin ? 'xl:grid-cols-6' : 'xl:grid-cols-5'} gap-3`}>
                    <StatsCard
                        title="Total Leads"
                        value={isLoading ? "..." : (stats.totalLeads ?? 0).toString()}
                        icon={<MapPin className="w-4 h-4" />}
                        iconBgColor="bg-blue-500/10 text-blue-600"
                        detail={stats.newLeadsToday > 0 ? `+${stats.newLeadsToday}` : undefined}
                        subValue="Qualified growth targets"
                    />
                    <StatsCard
                        title="Total Students"
                        value={isLoading ? "..." : (stats.totalStudents ?? 0).toString()}
                        icon={<Users className="w-4 h-4" />}
                        iconBgColor="bg-teal-500/10 text-teal-600"
                        detail={stats.newStudentsToday > 0 ? `+${stats.newStudentsToday}` : undefined}
                        subValue="Active conversions"
                    />
                    <StatsCard
                        title="Pending Tasks"
                        value={isLoading ? "..." : (stats.pendingTasksCount ?? 0).toString()}
                        icon={<Briefcase className="w-4 h-4" />}
                        iconBgColor="bg-amber-500/10 text-amber-600"
                        subValue="Needs attention"
                    />
                    {isAdmin && (
                        <StatsCard
                            title="Total Employees"
                            value={isLoading ? "..." : (stats.totalEmployees ?? 0).toString()}
                            icon={<UserCheck className="w-4 h-4" />}
                            iconBgColor="bg-indigo-500/10 text-indigo-600"
                            subValue="Admin & Sales staff"
                        />
                    )}
                    <StatsCard
                        title="Total Websites"
                        value={isLoading ? "..." : (stats.totalWebsites ?? 0).toString()}
                        icon={<TrendingUp className="w-4 h-4" />}
                        iconBgColor="bg-rose-500/10 text-rose-600"
                        subValue={`${stats.activeWebsites} Active / ${stats.totalWebsites - stats.activeWebsites} Inactive`}
                    />
                    <div className="h-full">
                        <LeadStudentRatio
                            totalLeads={stats.totalLeads}
                            totalStudents={stats.totalStudents}
                            isLoading={isLoading}
                        />
                    </div>
                </div>
            </div>

            {/* ROW 2: Charts (Graph + Pipeline) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[350px]">
                <div className="lg:col-span-2 h-full">
                    <LeadAnalyticsGraph
                        data={data?.analytics || []}
                        isLoading={isLoading}
                    />
                </div>
                <div className="lg:col-span-1 h-full">
                    <LeadStatusDistribution
                        data={data?.leadStatusCounts || []}
                        isLoading={isLoading}
                    />
                </div>
            </div>

            {/* ROW 3: Activities (Tasks + Recent Leads) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-6">
                <div className="h-full min-h-[350px]">
                    <UpcomingTasks
                        tasks={data?.upcomingTasks || []}
                        isLoading={isLoading}
                    />
                </div>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold text-foreground/80">Latest Leads Activity</h2>
                        <Link href={prefixPath("/leads")} className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity flex items-center gap-1">
                            View All <span className="text-sm leading-none">›</span>
                        </Link>
                    </div>
                    {isLoading ? (
                        <Skeleton className="h-[300px] w-full rounded-xl" />
                    ) : (
                        <div className="border border-border/50 rounded-xl overflow-hidden bg-card">
                            <RecentLeadsTable data={recentLeads} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
