"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function DynamicFavicon() {
    const { data: session } = useSession() as any;
    const pathname = usePathname();

    useEffect(() => {
        const role = session?.user?.role;
        const isAgentOrCounselor = ["AGENT", "COUNSELOR", "SALES_REP", "SUPPORT_AGENT"].includes(role);

        const searchParams = new URLSearchParams(window.location.search);
        const typeParam = searchParams.get("type");
        const isAgentPath = pathname.includes("/agent/") || pathname.includes("/counselor/") || typeParam === "agent" || typeParam === "counselor";

        const favicon = (isAgentOrCounselor || isAgentPath)
            ? "/logos/Icon%20Colour.png"
            : "/logos/intered-circle.png";

        // Remove any existing tags that might conflict
        const existingLinks = document.querySelectorAll("link[rel~='icon']");
        existingLinks.forEach(l => l.parentNode?.removeChild(l));

        // Create the fresh link tag
        const link = document.createElement("link");
        link.rel = "icon";
        link.href = favicon + "?v=" + new Date().getTime(); // Bust cache
        document.getElementsByTagName("head")[0].appendChild(link);
    }, [session, pathname]);

    return null;
}
