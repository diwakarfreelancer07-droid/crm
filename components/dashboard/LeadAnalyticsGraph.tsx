"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from 'react';

interface AnalyticsData {
    date: string;
    leads: number;
    students: number;
}

interface LeadAnalyticsGraphProps {
    data: AnalyticsData[];
    isLoading: boolean;
}

export function LeadAnalyticsGraph({ data, isLoading }: LeadAnalyticsGraphProps) {
    const formattedData = useMemo(() => {
        return data.map(item => ({
            ...item,
            formattedDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));
    }, [data]);

    if (isLoading) {
        return (
            <Card className="rounded-xl border-border shadow-none">
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Lead Generation Overview</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="text-muted-foreground">Loading chart...</div>
                </CardContent>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card className="rounded-xl border-border shadow-none">
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Lead Generation Overview</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="text-muted-foreground">No data available</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-xl border-border shadow-none">
            <CardHeader>
                <CardTitle className="text-lg font-medium">Lead Generation Overview</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={formattedData}
                            margin={{
                                top: 10,
                                right: 30,
                                left: 0,
                                bottom: 0,
                            }}
                        >
                            <defs>
                                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(173 80% 40%)" stopOpacity={0.05} />
                                    <stop offset="95%" stopColor="hsl(173 80% 40%)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                            <XAxis
                                dataKey="formattedDate"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                className="text-xs text-muted-foreground"
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                className="text-xs text-muted-foreground"
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: 'none', fontSize: '12px' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="leads"
                                stroke="hsl(var(--primary))"
                                fillOpacity={1}
                                fill="url(#colorLeads)"
                                name="Leads"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="students"
                                stroke="hsl(173 80% 40%)"
                                fillOpacity={1}
                                fill="url(#colorStudents)"
                                name="Students"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
