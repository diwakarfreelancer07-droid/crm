import { ReactNode } from "react";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    iconBgColor?: string;
    detail?: string;
    subValue?: string;
}

export function StatsCard({
    title,
    value,
    icon,
    iconBgColor = "bg-primary/10",
    detail,
    subValue,
}: StatsCardProps) {
    return (
        <div className="flex items-center justify-between p-3.5 bg-card shadow-[0_4px_12px_-4px_rgba(0,0,0,0.03)] rounded-2xl hover:shadow-md transition-shadow border border-border/40">
            <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
                    {detail && (
                        <span className="text-[10px] font-bold text-teal-600 bg-teal-500/10 px-1.5 py-0.5 rounded-md">
                            {detail}
                        </span>
                    )}
                </div>
                <div className="flex flex-col gap-0.5 mt-1">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate">{title}</p>
                    {subValue && <p className="text-[9px] text-muted-foreground/70 font-medium">{subValue}</p>}
                </div>
            </div>
            <div className={`w-8 h-8 ${iconBgColor} rounded-lg flex items-center justify-center shrink-0 shadow-sm ml-1.5 opacity-90`}>
                {icon}
            </div>
        </div>
    );
}
