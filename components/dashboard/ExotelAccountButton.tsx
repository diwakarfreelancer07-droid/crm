"use client";

/**
 * components/dashboard/ExotelAccountButton.tsx
 * Admin-only button to create an Exotel account for an agent or counselor.
 * Shows a success badge when already linked.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PhoneCall, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
    userId: string;
    role: "AGENT" | "COUNSELOR";
    existingExotelId?: string | null;
    onSuccess?: (exotelAgentId: string) => void;
}

export function ExotelAccountButton({
    userId,
    role,
    existingExotelId,
    onSuccess,
}: Props) {
    const [loading, setLoading] = useState(false);
    const [linked, setLinked] = useState<string | null>(existingExotelId ?? null);

    const handleCreate = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/exotel/create-account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, role }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Failed to create Exotel account");
                return;
            }

            setLinked(data.exotelAgentId);
            onSuccess?.(data.exotelAgentId);
            toast.success("Exotel account created successfully!");
        } catch (err) {
            toast.error("Network error — please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (linked) {
        return (
            <Badge
                variant="outline"
                className="gap-1.5 border-emerald-500/40 text-emerald-600 bg-emerald-50 px-2 py-1 text-[10px] font-semibold cursor-default"
                title={`Exotel SID: ${linked}`}
            >
                <CheckCircle2 className="h-3 w-3" />
                Exotel Active
            </Badge>
        );
    }

    return (
        <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={handleCreate}
            disabled={loading}
        >
            {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
                <PhoneCall className="h-3 w-3" />
            )}
            {loading ? "Creating..." : "Create Exotel Account"}
        </Button>
    );
}
