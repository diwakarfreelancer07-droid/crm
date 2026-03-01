// Polyfill for self in environments where it is missing
if (typeof self === "undefined") {
    (globalThis as any).self = globalThis;
}

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Role → URL namespace prefix
const ROLE_PREFIX: Record<string, string> = {
    ADMIN: "/admin",
    MANAGER: "/admin",
    AGENT: "/agent",
    COUNSELOR: "/agent",
    SALES_REP: "/agent",
    SUPPORT_AGENT: "/agent",
    STUDENT: "/student",
};

// Which roles are allowed in each namespace
const NAMESPACE_ROLES: Record<string, string[]> = {
    "/admin": ["ADMIN", "MANAGER"],
    "/agent": ["AGENT", "COUNSELOR", "SALES_REP", "SUPPORT_AGENT"],
    "/student": ["STUDENT"],
};

// Login page for each namespace
const NAMESPACE_LOGIN: Record<string, string> = {
    "/admin": "/admin",
    "/agent": "/agent/login",
    "/student": "/login",
};

function getNamespace(pathname: string): string | null {
    for (const ns of Object.keys(NAMESPACE_ROLES)) {
        if (pathname.startsWith(ns + "/") || pathname === ns) {
            return ns;
        }
    }
    return null;
}

// Shorthand paths that should redirect to role-prefixed equivalents
const SHORTHAND_PATHS = [
    "leads", "students", "agents", "employees", "applications",
    "visa-applications", "master", "roles", "profile", "file-manager", "addstudent",
];

export default withAuth(
    function middleware(req) {
        try {
            const pathname = req.nextUrl.pathname;
            const token = req.nextauth.token as any;
            const role = token?.role as string | undefined;
            const prefix = (role && ROLE_PREFIX[role]) || "/admin";

            // Redirect root to role-appropriate dashboard
            if (pathname === "/" || pathname === "/dashboard") {
                return NextResponse.redirect(new URL(`${prefix}/dashboard`, req.url));
            }

            // Redirect shorthand paths like /leads → /admin/leads (or /agent/leads)
            const shortSegment = pathname.split("/")[1]; // e.g. "leads" from "/leads"
            if (SHORTHAND_PATHS.includes(shortSegment) && !pathname.startsWith("/admin") && !pathname.startsWith("/agent") && !pathname.startsWith("/student")) {
                const rest = pathname.slice(shortSegment.length + 1); // preserve sub-paths e.g. /leads/123
                return NextResponse.redirect(new URL(`${prefix}/${shortSegment}${rest}`, req.url));
            }

            const namespace = getNamespace(pathname);
            const isLoginPage = pathname === "/login" || pathname === "/admin" || pathname === "/agent/login";

            if (namespace && !isLoginPage) {
                // Check that this role is allowed in this namespace
                const allowedRoles = NAMESPACE_ROLES[namespace] || [];
                if (role && !allowedRoles.includes(role)) {
                    // Redirect to the user's correct namespace
                    const correctPrefix = ROLE_PREFIX[role] || "/admin";
                    console.log('Middleware redirecting unauthorized role:', { role, correctPrefix });
                    return NextResponse.redirect(new URL(`${correctPrefix}/dashboard`, req.url));
                }
            }

            return NextResponse.next();
        } catch (e) {
            return NextResponse.next();
        }
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Public auth pages — always allow
                const pathname = req.nextUrl.pathname;
                const publicPaths = ["/login", "/admin", "/agent/login", "/register", "/forgot-password", "/new-password", "/verify-otp"];
                if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
                    return true;
                }
                return !!token;
            },
        },
        pages: {
            signIn: "/login",
        },
    }
);

export const config = {
    matcher: [
        /*
         * Match all paths except:
         * - api/* (NextAuth + all API routes)
         * - _next/static, _next/image
         * - favicon and other static files
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
