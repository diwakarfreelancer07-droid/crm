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
    "/agent": "/agent-login",
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

export default withAuth(
    function middleware(req) {
        try {
            const pathname = req.nextUrl.pathname;
            const token = req.nextauth.token as any;
            const role = token?.role as string | undefined;

            // Redirect root to role-appropriate dashboard
            if (pathname === "/" || pathname === "/dashboard") {
                const prefix = (role && ROLE_PREFIX[role]) || "/admin";
                return NextResponse.redirect(new URL(`${prefix}/dashboard`, req.url));
            }

            const namespace = getNamespace(pathname);
            console.log('Middleware namespace check:', { pathname, namespace });

            if (namespace) {
                // Check that this role is allowed in this namespace
                const allowedRoles = NAMESPACE_ROLES[namespace] || [];
                if (role && !allowedRoles.includes(role)) {
                    // Redirect to the user's correct namespace
                    const correctPrefix = ROLE_PREFIX[role] || "/admin";
                    console.log('Middleware redirecting unauthorized role:', { role, correctPrefix });
                    return NextResponse.redirect(new URL(`${correctPrefix}/dashboard`, req.url));
                }

                // DISABLED REWRITE: We now use the actual /admin/..., /agent/... structure in the app directory.
                // The rewrites were causing role-prefixed login pages to be treated as root login pages.
                /*
                const strippedPath = pathname.replace(namespace, "") || "/dashboard";
                const rewriteUrl = new URL(strippedPath, req.url);
                rewriteUrl.search = req.nextUrl.search;
                console.log('Middleware rewriting (DISABLED):', { pathname, rewriteUrl: rewriteUrl.toString() });
                return NextResponse.rewrite(rewriteUrl);
                */
                console.log('Middleware allowing namespaced path without rewrite:', { pathname });
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
                const publicPaths = ["/login", "/admin", "/agent-login", "/register", "/forgot-password", "/new-password", "/verify-otp"];
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
