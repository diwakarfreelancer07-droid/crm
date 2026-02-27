"use client";

import { Bell, ArrowLeft } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

import { useSession } from "next-auth/react";
import { useRolePath } from "@/hooks/use-role-path";

interface DashboardHeaderProps {
    title?: string;
    description?: string;
    action?: React.ReactNode;
}


export function DashboardHeader({ title, description, action }: DashboardHeaderProps) {
    const { data: session } = useSession() as any;
    const { rolePrefix, prefixPath } = useRolePath();
    const pathname = usePathname();
    const router = useRouter();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    const getTitle = () => {
        if (title) return title;
        if (pathname.includes("/leads/new")) return "Add New Lead";
        if (pathname.includes("/edit")) return "Edit Lead";
        if (pathname.includes("/leads")) return "Lead Management";
        if (pathname.includes("/employees")) return "Counselors Management";
        if (pathname.includes("/students")) return "Student Records";
        if (pathname.includes("/roles")) return "Role & Permission Management";
        if (pathname.includes("/master/countries")) return "Country Management";
        if (pathname.includes("/master/qualifications")) return "Qualification Management";
        if (pathname.includes("/master/websites")) return "Website Management";
        if (pathname.includes("/profile")) return "Account Profile";
        if (pathname.includes("/dashboard")) return `${getGreeting()}, ${session?.user?.name || 'User'}`;
        return "Control Panel";
    };

    const getDescription = () => {
        if (description) return description;
        if (pathname.includes("/leads/new")) return "Create a comprehensive profile for your potential student";
        if (pathname.includes("/master/countries")) return "Manage available countries for leads and admissions";
        if (pathname.includes("/master/qualifications")) return "Manage academic qualifications for tracking";
        if (pathname.includes("/master/websites")) return "Manage source websites for tracking leads";
        return null;
    };

    const isSubPage = pathname.split('/').length > 3 && !pathname.endsWith('/dashboard');

    return (
        <header className="flex items-center justify-between px-2 py-4 mb-4 border-b border-border sticky top-0 z-50 bg-background dark:bg-sidebar">
            {/* Greeting */}
            <div className="flex items-center gap-4 min-w-[180px]">
                {isSubPage && (
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-muted rounded-xl transition-colors shrink-0"
                    >
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </button>
                )}
                <div>
                    <h2 suppressHydrationWarning className="font-bold text-[18px] leading-none tracking-normal font-sans text-foreground">
                        {getTitle()}
                    </h2>
                    {getDescription() && (
                        <p className="text-sm text-muted-foreground mt-1">{getDescription()}</p>
                    )}
                </div>
            </div>

            {/* Centered Search - Removed as per user request */}
            <div className="mx-auto w-[456px]">
                {/* Search bar removed */}
            </div>

            {/* Right side: Actions, Notifications, Profile */}
            <div className="flex items-center gap-4 justify-end">
                <ThemeToggle />

                {/* Custom Action (replaces hardcoded button) */}
                {action}

                {/* Notifications */}
                {/* Notifications */}
                <NotificationBell />

                {/* User Avatar Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button suppressHydrationWarning className="w-10 h-10 rounded-full overflow-hidden hover:ring-2 hover:ring-ring transition-all outline-none">
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary">
                                {session?.user?.imageUrl ? (
                                    <img
                                        src={session.user.imageUrl}
                                        alt={session.user.name || "User"}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="font-semibold text-sm">
                                        {session?.user?.name?.charAt(0) || "U"}
                                    </span>
                                )}
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href={prefixPath("/profile")} className="cursor-pointer w-full">Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => signOut({ callbackUrl: '/login' })}
                        >
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
