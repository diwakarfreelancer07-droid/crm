"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { menuItems } from "./menuItems";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentStatus = searchParams.get("status");
    const { data: session, status } = useSession() as any;
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

    // Compute the URL namespace prefix based on user role
    const rolePrefix = (() => {
        if (status !== "authenticated") return null; // session not ready yet
        const role = session?.user?.role as string | undefined;
        if (!role) return null;
        if (["ADMIN", "MANAGER"].includes(role)) return "/admin";
        if (["AGENT", "COUNSELOR", "SALES_REP", "SUPPORT_AGENT"].includes(role)) return "/agent";
        if (role === "STUDENT") return "/student";
        return null;
    })();

    // Prefix a path with the role namespace — returns "#" if session not ready
    const prefixHref = (href: string) => rolePrefix ? `${rolePrefix}${href}` : "#";

    // Filter menu items based on user role
    const filteredMenuItems = menuItems.filter((item) => {
        if (!item.roles) return true;
        if (!session?.user?.role) return false;
        return item.roles.includes(session.user.role);
    });

    // Auto-expand parent menu on initial load if current path matches a submenu item
    useEffect(() => {
        const parentMenu = filteredMenuItems.find(item =>
            item.submenu?.some(sub => pathname === prefixHref(sub.href).split('?')[0])
        );
        if (parentMenu && expandedMenu === null) {
            setExpandedMenu(parentMenu.label);
        }
    }, [pathname, filteredMenuItems]);

    const toggleSubmenu = (label: string, firstSubmenuHref?: string) => {
        // If menu is currently collapsed, expand it and navigate to first submenu
        if (expandedMenu !== label && firstSubmenuHref) {
            setExpandedMenu(label);
            router.push(prefixHref(firstSubmenuHref));
        } else if (expandedMenu === label) {
            // If already expanded, just close it (toggle off)
            setExpandedMenu(null);
        } else {
            // Expand without navigation (shouldn't happen with current logic)
            setExpandedMenu(label);
        }
    };

    // Auto-collapse sidebar on submenu navigation (only on screens below XL)
    const handleSubmenuClick = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 1280) {
            setExpandedMenu(null);
        }
    };

    const isActive = (href?: string, submenu?: { href: string }[]) => {
        if (href) {
            const [base, query] = href.split('?');
            const urlParams = new URLSearchParams(query);
            const hrefStatus = urlParams.get("status");

            const isPathMatch = pathname === prefixHref(base);
            const isStatusMatch = currentStatus === hrefStatus;

            return isPathMatch && isStatusMatch;
        }
        if (submenu) return submenu.some((item) => {
            const [base] = item.href.split('?');
            return pathname === prefixHref(base);
        });
        return false;
    };

    return (
        <>
            {/* Spacer to reserve layout space on all screens */}
            <div className="hidden xl:block w-[252px] shrink-0" />
            <div className="block xl:hidden w-[78px] shrink-0" />

            {/* Floating/Fixed Sidebar */}
            <aside className="fixed left-0 top-0 h-screen bg-sidebar text-white overflow-hidden flex flex-col transition-all duration-300 w-[78px] hover:w-[252px] xl:w-[252px] group z-50 shadow-2xl">
                {/* Logo - Sticky */}
                <div className="px-4 xl:px-6 py-4 flex justify-center shrink-0">
                    <Link href={`${rolePrefix}/dashboard`} className="relative w-8 group-hover:w-48 xl:w-48 h-10 transition-all duration-300 overflow-hidden flex items-center">
                        {/* Icon always visible */}
                        <div className="shrink-0 w-9 h-9 rounded-full overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/intered-icon.png" alt="InterEd" width={36} height={36} className="object-cover w-full h-full" />
                        </div>
                        {/* Text shown when expanded */}
                        <span className="ml-2.5 text-xl font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 xl:opacity-100 transition-opacity duration-300 hidden group-hover:inline xl:inline">
                            InterEd
                        </span>
                    </Link>
                </div>

                {/* MAIN MENU Text - Sticky */}
                <div className="pl-0 xl:pl-5 group-hover:pl-5 pr-2 shrink-0 text-center xl:text-left group-hover:text-left transition-all">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-4 px-0 opacity-0 group-hover:opacity-100 xl:opacity-100 transition-opacity duration-300 whitespace-nowrap hidden group-hover:block xl:block">
                        Main Menu
                    </p>
                    {/* Divider for collapsed state */}
                    <div className="h-[1px] bg-white/10 mx-4 mb-4 block group-hover:hidden xl:hidden"></div>
                </div>

                {/* Scrollable Menu */}
                <nav className="flex-1 px-3 xl:pl-2 xl:pr-0 overflow-y-auto scrollbar-hide">
                    <ul className="space-y-1 pt-2 xl:pt-5">
                        {filteredMenuItems.map((item) => (
                            <li key={item.label}>
                                {item.submenu ? (
                                    <>
                                        <motion.button
                                            onClick={() => toggleSubmenu(item.label, item.submenu?.[0]?.href)}
                                            className={`w-full flex items-center justify-center group-hover:justify-between xl:justify-between px-3 h-[41px] text-sm font-semibold rounded-lg transition-all duration-300 ${isActive(undefined, item.submenu)
                                                ? "bg-primary/10 text-primary font-bold"
                                                : "text-white hover:bg-white/5"
                                                }`}
                                            whileHover={{ x: 2 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-[18px] h-[18px] flex items-center justify-center shrink-0 [&>svg]:w-full [&>svg]:h-full">{item.icon}</span>
                                                <span className="hidden group-hover:block xl:block whitespace-nowrap transition-all duration-300">{item.label}</span>
                                            </div>
                                            <motion.div
                                                animate={{ rotate: expandedMenu === item.label ? 0 : -90 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                className="hidden group-hover:block xl:block"
                                            >
                                                <ChevronDown className="w-4 h-4" />
                                            </motion.div>
                                        </motion.button>
                                        <div
                                            className={`relative overflow-hidden transition-all duration-300 ${expandedMenu === item.label
                                                ? 'max-h-[500px] opacity-100'
                                                : 'max-h-0 opacity-0'
                                                } hidden group-hover:block xl:block`}
                                        >
                                            <div className="relative mt-2 ml-[15px]">
                                                {/* Vertical Lines Container */}
                                                <div className="absolute left-[4px] top-0 bottom-4 w-[2px]">
                                                    {/* Background White Line (full height) */}
                                                    <div className="absolute inset-0 bg-white/20 w-[2px]"></div>

                                                    {/* Active Green Line (calculated height) */}
                                                    {item.submenu.some(sub => prefixHref(sub.href).split('?')[0] === pathname) && (
                                                        <motion.div
                                                            animate={{
                                                                height: `${item.submenu.findIndex(sub => prefixHref(sub.href).split('?')[0] === pathname) * 36 + 18}px`
                                                            }}
                                                            transition={{
                                                                type: "spring",
                                                                stiffness: 300,
                                                                damping: 25
                                                            }}
                                                            className="absolute top-0 left-0 right-0 bg-primary w-[2px]"
                                                        ></motion.div>
                                                    )}
                                                </div>

                                                <ul className="space-y-0 pl-[19px] relative">
                                                    {/* Single Dot Indicator - animates position */}
                                                    {item.submenu.some(sub => prefixHref(sub.href).split('?')[0] === pathname) && (
                                                        <motion.div
                                                            animate={{
                                                                y: item.submenu.findIndex(sub => prefixHref(sub.href).split('?')[0] === pathname) * 36
                                                            }}
                                                            transition={{
                                                                type: "spring",
                                                                stiffness: 400,
                                                                damping: 30
                                                            }}
                                                            className="absolute left-0 top-[12px] z-10"
                                                        >
                                                            <div className="w-[10px] h-[10px] rounded-full bg-primary"></div>
                                                        </motion.div>
                                                    )}

                                                    {item.submenu.map((subItem) => {
                                                        const isSubActive = pathname === prefixHref(subItem.href);
                                                        return (
                                                            <li
                                                                key={subItem.href}
                                                                className="relative h-9 flex items-center"
                                                            >
                                                                <Link
                                                                    href={prefixHref(subItem.href)}
                                                                    onClick={handleSubmenuClick}
                                                                    className={`block text-sm font-medium leading-none transition-colors duration-200 whitespace-nowrap ${isSubActive
                                                                        ? "text-primary"
                                                                        : "text-white/70 hover:text-white"
                                                                        }`}
                                                                >
                                                                    {subItem.label}
                                                                </Link>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>

                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <motion.div
                                        whileHover={{ x: 2 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    >
                                        <Link
                                            href={prefixHref(item.href!)}
                                            onClick={() => setExpandedMenu(null)}
                                            className={`flex items-center justify-center group-hover:justify-start xl:justify-start gap-2.5 px-3 h-[41px] text-sm font-semibold rounded-lg transition-all duration-300 ${isActive(item.href)
                                                ? "bg-primary/10 text-primary font-bold"
                                                : "text-white hover:bg-white/5 hover:text-white"
                                                }`}
                                        >
                                            <span className="w-[18px] h-[18px] flex items-center justify-center shrink-0 [&>svg]:w-full [&>svg]:h-full">{item.icon}</span>
                                            <span className="hidden group-hover:block xl:block whitespace-nowrap transition-all duration-300">{item.label}</span>
                                        </Link>
                                    </motion.div>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>
        </>
    );
}

