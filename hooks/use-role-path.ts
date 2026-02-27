"use client";

import { useSession } from "next-auth/react";

export function useRolePath() {
    const { data: session } = useSession() as any;

    const rolePrefix = (() => {
        const role = session?.user?.role as string | undefined;
        if (!role) return "";
        if (["ADMIN", "MANAGER"].includes(role)) return "/admin";
        if (["AGENT", "COUNSELOR", "SALES_REP", "SUPPORT_AGENT"].includes(role)) return "/agent";
        if (role === "STUDENT") return "/student";
        return "";
    })();

    const prefixPath = (path: string) => {
        if (path.startsWith("http") || path.startsWith("mailto:") || path.startsWith("tel:")) return path;
        const cleanPath = path.startsWith("/") ? path : `/${path}`;
        return `${rolePrefix}${cleanPath}`;
    };

    return { rolePrefix, prefixPath };
}
