"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PhoneIncoming, PhoneOutgoing, Play, User, Clock, X } from "lucide-react";
import { WaveformPlayer } from "./WaveformPlayer";

interface CallLogCardProps {
    callLog: {
        id: string;
        exotelCallSid: string;
        direction: string;
        status: string;
        duration?: number | null;
        recordingUrl?: string | null;
        createdAt: string | Date;
        startedAt?: string | Date | null;
        toNumber: string;
        callerId: string;
        employee?: { name: string } | null;
    };
}

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
}

const STATUS_STYLES: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-600",
    "no-answer": "bg-amber-500/10 text-amber-600",
    busy: "bg-orange-500/10 text-orange-600",
    failed: "bg-red-500/10 text-red-600",
    initiated: "bg-blue-500/10 text-blue-600",
    ringing: "bg-blue-500/10 text-blue-600",
    "in-progress": "bg-teal-500/10 text-teal-600",
};

export function CallLogCard({ callLog }: CallLogCardProps) {
    const [showPlayer, setShowPlayer] = useState(false);

    const isInbound = callLog.direction === "inbound";
    const statusLabel = callLog.status
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

    const formattedDate = new Date(callLog.createdAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
            {/* Direction icon */}
            <div
                className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isInbound
                    ? "bg-blue-500/10 text-blue-600"
                    : "bg-teal-500/10 text-teal-600"
                    }`}
            >
                {isInbound ? (
                    <PhoneIncoming className="h-4 w-4" />
                ) : (
                    <PhoneOutgoing className="h-4 w-4" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">
                            {isInbound ? callLog.callerId : callLog.toNumber}
                        </span>
                        <Badge
                            className={`text-[10px] font-bold px-2 py-0 rounded-md border-0 ${STATUS_STYLES[callLog.status] ?? "bg-muted text-muted-foreground"
                                }`}
                        >
                            {statusLabel}
                        </Badge>
                        <Badge
                            variant="secondary"
                            className="text-[9px] font-bold px-1.5 py-0 rounded-md border-0 bg-muted text-muted-foreground uppercase tracking-wider"
                        >
                            {callLog.direction}
                        </Badge>
                    </div>

                    {/* Original Play Button to trigger WaveformPlayer */}
                    {callLog.recordingUrl && !showPlayer && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-primary hover:bg-primary/10 rounded-lg"
                            onClick={() => setShowPlayer(true)}
                        >
                            <Play className="h-3 w-3 mr-1" />
                            Listen
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-4 mt-1 text-[11px] text-muted-foreground flex-wrap">
                    {callLog.employee && (
                        <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {callLog.employee.name}
                        </span>
                    )}
                    {callLog.duration != null && callLog.duration > 0 && (
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(callLog.duration)}
                        </span>
                    )}
                    <span>{formattedDate}</span>
                </div>

                {/* Show the fancy Waveform Player inline only when toggled */}
                {callLog.recordingUrl && showPlayer && (
                    <div className="mt-3 relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 absolute -top-5 -right-2 text-muted-foreground hover:text-foreground z-10"
                            onClick={() => setShowPlayer(false)}
                            title="Close Player"
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                        <WaveformPlayer url={callLog.recordingUrl} />
                    </div>
                )}
            </div>
        </div>


    );
}
