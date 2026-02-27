import { ReactNode } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

interface DashboardLayoutProps {
    children: ReactNode;
    params: Promise<{ role: string }>;
}

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
    const session = await getServerSession(authOptions);
    const { role: urlRole } = await params;

    if (!session) {
        redirect("/login");
    }

    const userRole = session.user.role as string;

    if (!userRole) {
        redirect("/login");
    }

    // Validate that the user is allowed to access this role segment
    const isAdmin = ["ADMIN", "MANAGER"].includes(userRole);
    const isAgent = ["AGENT", "COUNSELOR", "SALES_REP", "SUPPORT_AGENT"].includes(userRole);
    const isStudent = userRole === "STUDENT";

    const allowed = (urlRole === "admin" && isAdmin) ||
        (urlRole === "agent" && isAgent) ||
        (urlRole === "student" && isStudent);

    if (!allowed) {
        // Redirect to the correct role dashboard
        if (isAdmin) redirect("/admin/dashboard");
        if (isAgent) redirect("/agent/dashboard");
        if (isStudent) redirect("/student/dashboard");
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar - persistent across all dashboard pages */}
            <Sidebar />

            {/* Main Content - straight, integrated, full height */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                <div className="bg-background h-full w-full overflow-y-auto scrollbar-hide border-l border-border flex-1">
                    <DashboardHeader />
                    <div className="px-4 md:px-6 pb-6">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
