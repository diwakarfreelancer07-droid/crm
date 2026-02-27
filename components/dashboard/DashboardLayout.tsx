import { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

interface DashboardLayoutProps {
    children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen flex">
            {/* Sidebar - persistent across all dashboard pages */}
            <Sidebar />

            {/* Main Content - integrated and full height (Straight Model) */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <div className="bg-background h-full w-full overflow-y-auto scrollbar-hide border-l border-border">
                    <DashboardHeader />
                    <div className="p-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}