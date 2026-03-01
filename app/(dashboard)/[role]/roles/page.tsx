import { redirect } from "next/navigation";

// The Roles & Permissions page has moved to /master/roles.
// This redirect ensures any old bookmarks still work.
export default function RolesRedirectPage({ params }: { params: { role: string } }) {
    redirect("/master/roles");
}
