"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Phone, History, LayoutGrid, Loader2, Delete,
    PhoneOff, Play, Clock, CheckCircle2, Search,
    UserPlus, X, BookOpen, PhoneIncoming, PhoneMissed,
    User2, MessageSquarePlus, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useCallNotifications } from "@/hooks/use-call-notifications";
import { useCallCenterKeyboard } from "@/hooks/useCallCenterKeyboard";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { LeadForm } from "@/components/dashboard/LeadForm";

// ── Types ──────────────────────────────────────────────────────────────────
type CallTab = "status" | "dialpad" | "history";

const DIALPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
const DIALPAD_SUB: Record<string, string> = {
    "2": "ABC", "3": "DEF", "4": "GHI", "5": "JKL", "6": "MNO",
    "7": "PQRS", "8": "TUV", "9": "WXYZ",
};

function formatDuration(seconds?: number | null) {
    if (!seconds) return "-";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Status icon helper ─────────────────────────────────────────────────────
function CallStatusIcon({ status }: { status: string }) {
    const s = status?.toLowerCase();
    if (s === "completed") return <CheckCircle2 className="h-3 w-3 text-primary" />;
    if (s === "ringing" || s === "in-progress") return <PhoneIncoming className="h-3 w-3 text-blue-500" />;
    return <PhoneMissed className="h-3 w-3 text-red-500" />;
}

// Main Page wrapped in Suspense for useSearchParams
export default function CallCenterPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-muted/20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <CallCenterComponent />
        </Suspense>
    );
}

function CallCenterComponent() {
    const { data: session } = useSession() as any;
    const userId = session?.user?.id;
    const role = session?.user?.role;

    // ── Call center socket state
    const {
        isConnected,
        incomingCall,
        connectedCall,
        callEnded,
        clearIncoming,
        clearConnected,
        clearCallEnded,
    } = useCallNotifications();

    // ── Availability
    const [isAvailable, setIsAvailable] = useState(false);
    const [availLoading, setAvailLoading] = useState(false);

    // ── Active call mirror from socket
    const [activeCall, setActiveCall] = useState<any>(null);

    // ── Tab
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const queryTab = searchParams.get("tab") as CallTab | null;
    const [callTab, setCallTabState] = useState<CallTab>("status");

    useEffect(() => {
        if (queryTab && ["status", "dialpad", "history"].includes(queryTab) && queryTab !== callTab) {
            setCallTabState(queryTab as CallTab);
        } else if (!queryTab) {
            setCallTabState("status");
        }
    }, [queryTab]);

    const setCallTab = useCallback((tab: CallTab) => {
        setCallTabState(tab);
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [pathname, searchParams, router]);

    // ── Dialpad
    const [dialNumber, setDialNumber] = useState("");
    const [dialLoading, setDialLoading] = useState(false);

    // ── Call history
    const [callHistory, setCallHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // ── Lead search (right panel)
    const [leadSearch, setLeadSearch] = useState("");
    const [leadResults, setLeadResults] = useState<any[]>([]);
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [leadLoading, setLeadLoading] = useState(false);
    const [isLeadSheetOpen, setIsLeadSheetOpen] = useState(false);
    const [recentLeads, setRecentLeads] = useState<any[]>([]);
    // ── Call notes (save after call ends)
    const [showNotes, setShowNotes] = useState(false);
    const [notes, setNotes] = useState("");
    const [savingNotes, setSavingNotes] = useState(false);
    const [lastEndedCall, setLastEndedCall] = useState<any>(null);

    // ── Keyboard State Selection Indexes
    const [selectedHistoryIdx, setSelectedHistoryIdx] = useState(0);
    const [selectedCustomerIdx, setSelectedCustomerIdx] = useState(0);

    // ── Keyboard State Selection Indexes
    useEffect(() => {
        if (incomingCall) {
            setActiveCall({
                callSid: incomingCall.callSid,
                callerPhone: incomingCall.callerPhone,
                callerName: incomingCall.callerName,
                leadId: incomingCall.leadId,
                status: "ringing",
            });
            setCallTab("status");
            // Pre-fill lead search if we know the caller phone
            if (incomingCall.callerPhone) {
                setLeadSearch(incomingCall.callerPhone);
            }
        }
    }, [incomingCall]);

    useEffect(() => {
        if (connectedCall) {
            setActiveCall((prev: any) =>
                prev
                    ? { ...prev, status: "in-progress" }
                    : { callSid: connectedCall.callSid, status: "in-progress" }
            );
        }
    }, [connectedCall]);

    useEffect(() => {
        if (callEnded) {
            setLastEndedCall({ ...activeCall, ...callEnded });
            setActiveCall(null);
            clearCallEnded();
            setShowNotes(true); // prompt to save notes
        }
    }, [callEnded]);

    // ── Load profile availability on mount ────────────────────────────────
    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch("/api/profile");
                const data = await res.json();
                // exotelAvailable lives on agentProfile or counselorProfile
                const profile = data?.agentProfile ?? data?.counselorProfile;
                if (profile) setIsAvailable(profile.exotelAvailable ?? false);
            } catch { /* ignore */ }
        }
        if (userId) fetchProfile();
    }, [userId]);

    // ── History load ──────────────────────────────────────────────────────
    const loadHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const res = await fetch("/api/calls/history?limit=20");
            const data = await res.json();
            setCallHistory(Array.isArray(data.callLogs) ? data.callLogs : []);
        } catch {
            toast.error("Failed to load call history");
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    // Load recent leads if search is empty
    const loadRecentLeads = useCallback(async () => {
        try {
            const res = await fetch("/api/leads?limit=5");
            const data = await res.json();
            setRecentLeads(Array.isArray(data.leads) ? data.leads : []);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (callTab === "history") loadHistory();
    }, [callTab, loadHistory]);

    useEffect(() => {
        loadRecentLeads();
    }, [loadRecentLeads]);

    // ── Lead search debounce ──────────────────────────────────────────────
    useEffect(() => {
        if (leadSearch.length < 3) { setLeadResults([]); return; }
        const timer = setTimeout(async () => {
            setLeadLoading(true);
            try {
                const res = await fetch(`/api/leads?search=${encodeURIComponent(leadSearch)}&limit=5`);
                const data = await res.json();
                setLeadResults(Array.isArray(data.leads) ? data.leads : []);
            } catch { setLeadResults([]); }
            finally { setLeadLoading(false); }
        }, 350);
        return () => clearTimeout(timer);
    }, [leadSearch]);

    // ── Actions ───────────────────────────────────────────────────────────
    const toggleAvailability = async () => {
        setAvailLoading(true);
        try {
            const newVal = !isAvailable;
            const res = await fetch("/api/exotel/toggle-availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ available: newVal }),
            });
            if (!res.ok) {
                const d = await res.json();
                toast.error(d.error || "Failed to update availability");
                return;
            }
            setIsAvailable(newVal);
            toast.success(newVal ? "You are now Online" : "You are now Offline");
        } catch {
            toast.error("Network error");
        } finally {
            setAvailLoading(false);
        }
    };

    const handleDial = async () => {
        if (!dialNumber.trim()) return;
        setDialLoading(true);
        try {
            const res = await fetch("/api/exotel/call", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetPhone: dialNumber }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "Call failed");
                return;
            }
            toast.success(`Calling ${dialNumber}...`);
            setCallTab("status");
        } catch {
            toast.error("Call failed");
        } finally {
            setDialLoading(false);
        }
    };

    const handleCallLead = async (lead: any) => {
        setSelectedLead(lead);
        setLeadSearch("");
        setLeadResults([]);
        try {
            const res = await fetch("/api/exotel/call", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetType: "lead", targetId: lead.id }),
            });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error || "Call failed"); return; }
            toast.success(`Calling ${lead.name}...`);
        } catch {
            toast.error("Call failed");
        }
    };

    const saveNotes = async () => {
        if (!notes.trim() || !lastEndedCall) return;
        const leadId = lastEndedCall?.leadId ?? selectedLead?.id;
        if (!leadId) { toast.error("No lead linked to this call"); return; }
        setSavingNotes(true);
        try {
            await fetch(`/api/leads/${leadId}/activities`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "NOTE",
                    content: `[Post-Call Note] ${notes}`,
                }),
            });
            toast.success("Notes saved!");
            setShowNotes(false);
            setNotes("");
            setLastEndedCall(null);
        } catch {
            toast.error("Failed to save notes");
        } finally {
            setSavingNotes(false);
        }
    };

    // ── Keyboard Hook Setup (Must be below action handlers like handleDial)
    useCallCenterKeyboard({
        callTab,
        hasActiveCall: !!activeCall,
        hasIncomingCall: !!incomingCall,
        dialpadActive: callTab === "dialpad",
        dialNumber,
        historyLength: callHistory.length,
        selectedHistoryIdx,
        customerResultsLength: leadResults.length,
        selectedCustomerIdx,
        setCallTab,
        answerCall: () => { /* Add socket answer event if supported */ },
        rejectCall: () => { /* Add socket reject event if supported */ },
        endCall: () => { /* Add socket end call event if supported */ },
        dialKey: (k: string) => setDialNumber(d => d + k),
        dialBackspace: () => setDialNumber(d => d.slice(0, -1)),
        clearDialNumber: () => setDialNumber(""),
        handleDial,
        setSelectedHistoryIdx,
        redialByIdx: (idx) => {
            const r = callHistory[idx];
            if (r) {
                setDialNumber(r.callerId || r.toNumber);
                setCallTab("dialpad");
            }
        },
        setSelectedCustomerIdx,
        enterCustomer: () => {
            const lead = leadResults[selectedCustomerIdx];
            if (lead) {
                setSelectedLead(lead);
                setLeadSearch("");
                setLeadResults([]);
            }
        },
        closeDetailPanel: () => {
            if (selectedLead) setSelectedLead(null);
            if (showNotes) setShowNotes(false);
        },
        toggleHelp: () => toast.info("Keyboard Shortcuts:\r\nCtrl+1/2/3: Switch Tabs\r\nArrows: Navigate Lists\r\nEnter: Select/Dial")
    });

    const isCallActive = activeCall && !["completed", "no-answer", "busy", "failed"].includes(activeCall.status);

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="flex h-[calc(100vh-64px)] bg-muted/20 overflow-hidden">

            {/* Sheet for Create/Update Lead */}
            <Sheet open={isLeadSheetOpen} onOpenChange={setIsLeadSheetOpen}>
                <SheetContent className="sm:max-w-[600px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Add New Lead</SheetTitle>
                    </SheetHeader>
                    <LeadForm
                        onSuccess={(id) => {
                            setIsLeadSheetOpen(false);
                            loadRecentLeads();
                            // Optionally select the new lead
                            fetch(`/api/leads/${id}`).then(r => r.json()).then(l => setSelectedLead(l));
                        }}
                        initialData={{
                            phone: leadSearch.match(/^\d+$/) ? leadSearch : (dialNumber.match(/^\d+$/) ? dialNumber : "")
                        }}
                    />
                </SheetContent>
            </Sheet>

            {/* ══ LEFT PANEL — CALL CONTROL ══════════════════════════════════ */}
            <div className="w-[380px] bg-background border-r border-border/60 flex flex-col shrink-0 shadow-xl z-20">

                {/* Header */}
                <div className="h-14 border-b border-border/60 flex items-center justify-between px-5 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isAvailable ? "bg-primary animate-pulse" : "bg-muted-foreground/30"}`} />
                        <span className="font-bold text-sm tracking-tight">Call Center</span>
                        <Badge variant={isAvailable ? "default" : "secondary"} className="text-[9px] h-4 px-1.5 uppercase tracking-wider">
                            {isAvailable ? "Online" : "Offline"}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                        <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-blue-400 animate-pulse" : "bg-muted-foreground/30"}`} />
                        <span className={isConnected ? "text-blue-500" : "text-muted-foreground"}>
                            {isConnected ? "Live" : "Offline"}
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border/60 p-1.5 mx-4 mt-3 bg-muted/40 rounded-xl shrink-0">
                    {([
                        ["status", Phone, "Status"],
                        ["dialpad", LayoutGrid, "Dialpad"],
                        ["history", History, "History"],
                    ] as const).map(([tid, Icon, label]) => (
                        <button key={tid}
                            onClick={() => setCallTab(tid as CallTab)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all
                                ${callTab === tid
                                    ? "bg-background text-foreground shadow-sm ring-1 ring-black/5"
                                    : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <Icon className="h-3 w-3" /> {label}
                        </button>
                    ))}
                </div>

                {/* Content area */}
                <div className="flex-1 overflow-hidden">
                    <AnimatePresence mode="wait">

                        {/* ── STATUS TAB */}
                        {callTab === "status" && (
                            <motion.div key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col h-full p-5">

                                {/* Active/Incoming call */}
                                {isCallActive && (
                                    <div className={`mb-4 p-3 rounded-xl border flex items-center gap-3 transition-all
                                        ${activeCall.status === "ringing"
                                            ? "border-blue-200 bg-blue-50/80 dark:bg-blue-950/30"
                                            : "border-primary/20 bg-primary/10"}`}>
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0
                                            ${activeCall.status === "ringing" ? "bg-blue-500 animate-bounce" : "bg-primary"}`}>
                                            <Phone className="h-4 w-4 text-white fill-current" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold truncate">
                                                {activeCall.status === "ringing" ? "Incoming call" : "Call in progress"}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground truncate">
                                                {activeCall.callerName || activeCall.callerPhone || "Unknown"}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] shrink-0 capitalize">
                                            {activeCall.status}
                                        </Badge>
                                    </div>
                                )}

                                {/* Agent status circle */}
                                <div className="flex flex-col items-center justify-center flex-1 gap-5">
                                    <div className={`w-28 h-28 rounded-full border-4 flex items-center justify-center shadow-inner transition-all duration-500
                                        ${isAvailable ? "border-primary/20 bg-primary/10" : "border-muted bg-muted/30"}`}>
                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-500
                                            ${isAvailable ? "bg-primary shadow-primary/20" : "bg-muted"}`}>
                                            <Phone className={`h-9 w-9 ${isAvailable ? "text-primary-foreground fill-current" : "text-muted-foreground"}`} />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <h2 className="text-lg font-bold">{isAvailable ? "You are Online" : "You are Offline"}</h2>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            {isAvailable ? "Waiting for incoming calls..." : "Go online to receive calls"}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={toggleAvailability}
                                        disabled={availLoading}
                                        size="lg"
                                        className={`rounded-full px-8 font-bold shadow-lg transition-all hover:scale-105 active:scale-95 ${isAvailable
                                            ? "bg-red-500 hover:bg-red-600 text-white"
                                            : "bg-primary hover:bg-primary/90 text-primary-foreground"}`}>
                                        {availLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        {isAvailable ? "Go Offline" : "Go Online"}
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* ── DIALPAD TAB */}
                        {callTab === "dialpad" && (
                            <motion.div key="dialpad" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="p-5 space-y-3">

                                {/* Active call indicator */}
                                {isCallActive && (
                                    <div className="p-2.5 rounded-xl border border-primary/20 bg-primary/10 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        <span className="text-xs font-semibold text-primary truncate">
                                            {activeCall.status === "ringing" ? "Incoming..." : "Call in progress"}
                                        </span>
                                    </div>
                                )}

                                {/* Number display */}
                                <div className="flex items-center bg-muted/40 border border-border/60 rounded-xl px-4 py-3">
                                    <span className="font-mono text-xl font-bold tracking-widest flex-1 text-center truncate">
                                        {dialNumber || <span className="text-muted-foreground text-sm font-normal">Enter number...</span>}
                                    </span>
                                    {dialNumber && (
                                        <button onClick={() => setDialNumber(d => d.slice(0, -1))}
                                            className="text-muted-foreground hover:text-foreground ml-2 shrink-0">
                                            <Delete className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Pad */}
                                <div className="grid grid-cols-3 gap-2">
                                    {DIALPAD_KEYS.map(k => (
                                        <button key={k}
                                            onClick={() => setDialNumber(d => d + k)}
                                            className="h-12 rounded-xl bg-muted/30 border border-border/60 hover:bg-primary/10 hover:border-primary/30 active:scale-95 transition-all flex flex-col items-center justify-center">
                                            <span className="text-lg font-bold leading-none">{k}</span>
                                            {DIALPAD_SUB[k] && <span className="text-[9px] font-medium text-muted-foreground tracking-widest mt-0.5">{DIALPAD_SUB[k]}</span>}
                                        </button>
                                    ))}
                                </div>

                                <Button onClick={handleDial} disabled={!dialNumber || dialLoading}
                                    className="w-full rounded-xl h-11 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold disabled:opacity-50">
                                    {dialLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                                    {dialLoading ? "Connecting..." : "Call"}
                                </Button>
                            </motion.div>
                        )}

                        {/* ── HISTORY TAB */}
                        {callTab === "history" && (
                            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col h-full">
                                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 shrink-0">
                                    <span className="text-xs text-muted-foreground font-medium">Recent Calls</span>
                                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={loadHistory}>
                                        Refresh
                                    </Button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                    {historyLoading ? (
                                        <div className="flex justify-center p-8">
                                            <Loader2 className="animate-spin text-primary" />
                                        </div>
                                    ) : callHistory.length === 0 ? (
                                        <div className="text-center p-8 text-muted-foreground text-sm">No recent calls</div>
                                    ) : callHistory.map((r, idx) => (
                                        <div key={r.id}
                                            onMouseEnter={() => setSelectedHistoryIdx(idx)}
                                            className={`p-3 rounded-xl border transition-colors group
                                                ${idx === selectedHistoryIdx ? "border-primary bg-primary/5" : "border-border/60 hover:bg-muted/30"}`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm font-semibold">{r.lead?.name || r.student?.name || r.callerId || r.toNumber}</p>
                                                    <p className="text-[11px] text-muted-foreground">{r.callerId}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <CallStatusIcon status={r.status} />
                                                    <span className="text-[10px] text-muted-foreground capitalize">{r.status}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDuration(r.duration)}</span>
                                                <span>{formatTime(r.createdAt)}</span>
                                                {r.direction && <span className="capitalize opacity-60">{r.direction}</span>}
                                            </div>
                                            {/* Redial */}
                                            <div className={`flex gap-2 mt-2 transition-opacity ${idx === selectedHistoryIdx ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                                <Button size="sm" variant="ghost"
                                                    className="h-6 px-2 text-[10px] gap-1 text-primary hover:bg-primary/10"
                                                    onClick={() => { setDialNumber(r.callerId || r.toNumber); setCallTab("dialpad"); }}>
                                                    <Phone className="h-3 w-3" /> Redial
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>

            {/* ══ RIGHT PANEL — LEAD DETAILS ══════════════════════════════════ */}
            <div className="flex-1 flex flex-col bg-muted/10 overflow-hidden">

                {/* Right header */}
                <div className="h-14 border-b border-border/60 flex items-center justify-between px-6 bg-background shrink-0">
                    <h2 className="font-bold text-sm">Lead Details</h2>
                    {isCallActive && (
                        <Badge variant="outline" className="gap-1.5 text-primary border-primary/40">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                            Call Active
                        </Badge>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">

                    {/* POST-CALL NOTES PROMPT ─────────────────────────────── */}
                    <AnimatePresence>
                        {showNotes && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="border border-amber-200 bg-amber-50/80 dark:bg-amber-950/20 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <MessageSquarePlus className="h-4 w-4 text-amber-600" />
                                        <span className="font-semibold text-sm text-amber-900">Save Call Notes</span>
                                    </div>
                                    <button onClick={() => setShowNotes(false)}>
                                        <X className="h-4 w-4 text-amber-500 hover:text-amber-700" />
                                    </button>
                                </div>
                                <p className="text-xs text-amber-700">
                                    Call ended {lastEndedCall?.status === "completed" ? "successfully" : `(${lastEndedCall?.status})`}.
                                    Add any notes or follow-up details for the lead.
                                </p>
                                <Textarea
                                    placeholder="Enter call outcome, follow-up actions, lead feedback..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    rows={3}
                                    className="text-sm resize-none bg-white dark:bg-gray-900"
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={saveNotes} disabled={savingNotes || !notes.trim()}
                                        className="bg-amber-600 hover:bg-amber-700 text-white h-8 px-4 rounded-lg text-xs">
                                        {savingNotes ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
                                        Save Notes
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => { setShowNotes(false); setNotes(""); }}
                                        className="h-8 px-4 text-xs">
                                        Skip
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* LEAD SEARCH ─────────────────────────────────────────── */}
                    <div className="bg-background rounded-2xl border border-border/60 p-4 space-y-3 flex flex-col h-[400px]">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold text-sm">Lead Directory</span>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[10px] gap-1 hover:bg-primary hover:text-white"
                                onClick={() => setIsLeadSheetOpen(true)}
                            >
                                <UserPlus className="h-3 w-3" /> Create Lead
                            </Button>
                        </div>
                        <div className="relative">
                            <Input
                                placeholder="Search by name, phone, email..."
                                value={leadSearch}
                                onChange={e => setLeadSearch(e.target.value)}
                                className="pr-8 h-9 text-sm"
                            />
                            {leadLoading && (
                                <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            )}
                        </div>

                        {/* Search results or Recent Leads */}
                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 -mr-1">
                            {leadSearch.length >= 3 ? (
                                leadResults.length > 0 ? (
                                    leadResults.map((lead, idx) => (
                                        <div key={lead.id}
                                            onMouseEnter={() => setSelectedCustomerIdx(idx)}
                                            onClick={() => { setSelectedLead(lead); setLeadSearch(""); setLeadResults([]); }}
                                            className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border
                                                ${idx === selectedCustomerIdx ? "bg-primary/10 border-primary/30" : "border-transparent hover:bg-muted/50"}`}>
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <User2 className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{lead.name}</p>
                                                <p className="text-[11px] text-muted-foreground truncate">{lead.phone}</p>
                                            </div>
                                            <Badge variant="outline" className="text-[9px] capitalize shrink-0">{lead.status?.toLowerCase()}</Badge>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <AlertCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                        <p className="text-xs text-muted-foreground">No leads found for "{leadSearch}"</p>
                                        <Button variant="link" size="sm" className="text-[11px] mt-1" onClick={() => setIsLeadSheetOpen(true)}>
                                            Create new lead instead?
                                        </Button>
                                    </div>
                                )
                            ) : (
                                <>
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60 px-1 mb-1">Recently Active</p>
                                    {recentLeads.map((lead, idx) => (
                                        <div key={lead.id}
                                            onClick={() => setSelectedLead(lead)}
                                            className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border border-transparent hover:bg-muted/50">
                                            <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
                                                <User2 className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{lead.name}</p>
                                                <p className="text-[11px] text-muted-foreground truncate">{lead.phone}</p>
                                            </div>
                                            <Badge variant="secondary" className="text-[8px] h-3.5 px-1 capitalize shrink-0">{lead.status?.toLowerCase()}</Badge>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>

                    {/* SELECTED LEAD DETAILS ───────────────────────────────── */}
                    {selectedLead ? (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-background rounded-2xl border border-border/60 p-5 space-y-4">

                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                                        <span className="text-lg font-bold text-primary">{selectedLead.name?.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base">{selectedLead.name}</h3>
                                        <p className="text-sm text-muted-foreground">{selectedLead.phone}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1.5">
                                    {/* Call this lead */}
                                    <Button size="sm" variant="outline"
                                        className="h-8 px-3 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
                                        onClick={() => handleCallLead(selectedLead)}>
                                        <Phone className="h-3 w-3" /> Call
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
                                        onClick={() => setSelectedLead(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Lead info grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: "Status", value: selectedLead.status },
                                    { label: "Temperature", value: selectedLead.temperature },
                                    { label: "Source", value: selectedLead.source },
                                    { label: "Course", value: selectedLead.interestedCourse },
                                    { label: "Country", value: selectedLead.interestedCountry },
                                    { label: "Email", value: selectedLead.email },
                                ].map(({ label, value }) => value ? (
                                    <div key={label} className="p-2.5 bg-muted/30 rounded-xl">
                                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                                        <p className="text-sm font-semibold mt-0.5 truncate capitalize">{value?.toLowerCase?.() ?? value}</p>
                                    </div>
                                ) : null)}
                            </div>

                            {/* Quick actions */}
                            <div className="flex gap-2 pt-1">
                                <Button size="sm" variant="outline" asChild className="text-xs h-8">
                                    <a href={`/${role?.toLowerCase()}/leads/${selectedLead.id}`} target="_blank" rel="noopener">
                                        <BookOpen className="h-3 w-3 mr-1.5" /> Full Profile
                                    </a>
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        // Empty state
                        !showNotes && (
                            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground/60 space-y-2.5">
                                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                                    <User2 className="h-7 w-7" />
                                </div>
                                <p className="text-sm font-medium">No lead selected</p>
                                <p className="text-xs">Search for a lead above, or wait for an incoming call to auto-fill.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
