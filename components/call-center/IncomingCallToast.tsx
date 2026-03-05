"use client";

/**
 * components/call-center/IncomingCallToast.tsx
 * Global incoming call notification that appears on ALL pages (not just call-center).
 * Uses useCallNotifications() to listen for call:incoming socket events.
 * Mount this in the root layout so it's always active.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Phone, X } from "lucide-react";
import { useCallNotifications } from "@/hooks/use-call-notifications";
import { useSession } from "next-auth/react";

export function IncomingCallToast() {
    const { data: session } = useSession() as any;
    const role = session?.user?.role;
    const { incomingCall, clearIncoming } = useCallNotifications();
    const router = useRouter();

    // Only show for agents/counselors
    const eligible = role === "AGENT" || role === "COUNSELOR";

    useEffect(() => {
        if (!incomingCall || !eligible) return;

        const callerLabel =
            incomingCall.callerName || incomingCall.callerPhone || "Unknown";

        const toastId = toast.custom(
            (id) => (
                <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-green-200 shadow-xl rounded-2xl p-4 min-w-[320px]">
                    {/* Animated ring icon */}
                    <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center animate-bounce shadow-lg shadow-green-300">
                            <Phone className="h-5 w-5 text-white fill-current" />
                        </div>
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            📞 Incoming Call
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{callerLabel}</p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <button
                            onClick={() => {
                                toast.dismiss(id);
                                clearIncoming();
                                router.push(`/${role.toLowerCase()}/call-center`);
                            }}
                            className="h-7 px-3 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
                        >
                            View
                        </button>
                        <button
                            onClick={() => {
                                toast.dismiss(id);
                                clearIncoming();
                            }}
                            className="h-7 px-3 rounded-lg border border-gray-200 text-gray-500 text-xs hover:bg-gray-50 transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            ),
            {
                duration: 30000,
                id: `incoming-call-${incomingCall.callSid}`,
            }
        );

        return () => {
            toast.dismiss(toastId);
        };
    }, [incomingCall, eligible]);

    return null; // renders nothing — just triggers toasts
}
