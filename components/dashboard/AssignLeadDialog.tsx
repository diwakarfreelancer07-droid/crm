"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AssignLeadDialogProps {
    isOpen: boolean;
    onClose: () => void;
    leadId: string | null;
    leadName: string | null;
    onAssign: () => void;
}

export function AssignLeadDialog({
    isOpen,
    onClose,
    leadId,
    leadName,
    onAssign,
}: AssignLeadDialogProps) {
    const { data: session } = useSession() as any;
    const [agents, setAgents] = useState<any[]>([]);
    const [agentCounselors, setAgentCounselors] = useState<Record<string, any[]>>({});
    const [isLoadingAgents, setIsLoadingAgents] = useState(false);
    const [loadingAgentsMap, setLoadingAgentsMap] = useState<Record<string, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [selectedManagerId, setSelectedManagerId] = useState<string>("");
    const [selectedCounselorId, setSelectedCounselorId] = useState<string>("");

    const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";
    const isAgent = session?.user?.role === "AGENT";

    useEffect(() => {
        if (isOpen) {
            setSelectedManagerId("");
            setSelectedCounselorId("");
            if (isAdmin) {
                fetchAgents();
            } else if (isAgent) {
                fetchDirectCounselors();
            }
        }
    }, [isOpen]);

    const fetchAgents = async () => {
        setIsLoadingAgents(true);
        try {
            const roles = ["AGENT", "SALES_REP", "MANAGER"];
            const requests = roles.map(role =>
                axios.get(`/api/employees?role=${role}&status=active&limit=100`)
            );
            const responses = await Promise.all(requests);
            const allStaff = responses.flatMap(r => r.data.employees);
            allStaff.sort((a, b) => a.name.localeCompare(b.name));
            setAgents(allStaff);
        } catch (error) {
            toast.error("Failed to load assignment options");
        } finally {
            setIsLoadingAgents(false);
        }
    };

    const fetchDirectCounselors = async () => {
        try {
            const response = await axios.get("/api/employees?role=COUNSELOR&status=active&limit=100");
            setAgentCounselors({ "direct": response.data.employees });
        } catch (error) {
            toast.error("Failed to load counselors");
        }
    };

    const handleManagerChange = async (value: string) => {
        setSelectedManagerId(value);
        setSelectedCounselorId("");

        if (value && !agentCounselors[value]) {
            setLoadingAgentsMap(prev => ({ ...prev, [value]: true }));
            try {
                const response = await axios.get(`/api/employees?role=COUNSELOR&status=active&agentId=${value}&limit=100`);
                setAgentCounselors(prev => ({ ...prev, [value]: response.data.employees }));
            } catch (error) {
                toast.error("Failed to load counselors for this manager");
            } finally {
                setLoadingAgentsMap(prev => ({ ...prev, [value]: false }));
            }
        }
    };

    const handleAssignClick = () => {
        const finalAssigneeId = (selectedCounselorId && selectedCounselorId !== "none") ? selectedCounselorId : selectedManagerId;
        if (finalAssigneeId) {
            handleAssign(finalAssigneeId);
        } else {
            toast.error("Please select a staff member");
        }
    };

    const handleAssign = async (employeeId: string) => {
        if (!leadId || !employeeId) return;

        setIsSaving(true);
        try {
            await axios.patch(`/api/leads/${leadId}`, {
                assignedTo: employeeId,
            });
            toast.success("Lead assigned successfully");
            onAssign();
            onClose();
        } catch (error) {
            console.error("Failed to assign lead", error);
            toast.error("Failed to assign lead");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Assign Lead</DialogTitle>
                    <DialogDescription>
                        Select a manager and optionally a counselor to assign <strong>{leadName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-6 transition-all duration-300">
                    {isLoadingAgents ? (
                        <div className="flex justify-center py-8 text-muted-foreground animate-pulse">
                            Loading staff...
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {isAdmin && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Manager / Agent</Label>
                                        <Select value={selectedManagerId} onValueChange={handleManagerChange}>
                                            <SelectTrigger className="w-full h-12 rounded-xl bg-slate-50 border-slate-200">
                                                <SelectValue placeholder="Select Manager or Agent" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl shadow-xl border-slate-200">
                                                {agents.map((agent) => (
                                                    <SelectItem key={agent.id} value={agent.id} className="cursor-pointer py-3 rounded-lg focus:bg-primary/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                                {agent.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-sm">{agent.name}</p>
                                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{agent.role}</p>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <AnimatePresence>
                                        {selectedManagerId && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0, y: -10 }}
                                                animate={{ height: "auto", opacity: 1, y: 0 }}
                                                exit={{ height: 0, opacity: 0, y: -10 }}
                                                className="space-y-2 overflow-hidden"
                                            >
                                                <Label>Counselor (Optional)</Label>
                                                <Select value={selectedCounselorId} onValueChange={setSelectedCounselorId}>
                                                    <SelectTrigger className="w-full h-12 rounded-xl bg-slate-50 border-slate-200">
                                                        <SelectValue placeholder={loadingAgentsMap[selectedManagerId] ? "Loading..." : "Select Counselor (Optional)"} />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl shadow-xl border-slate-200">
                                                        <SelectItem value="none" className="py-2">No Counselor (Assign to Manager)</SelectItem>
                                                        {agentCounselors[selectedManagerId]?.map((counselor) => (
                                                            <SelectItem key={counselor.id} value={counselor.id} className="cursor-pointer py-3 rounded-lg focus:bg-primary/5">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                                                    <span className="text-sm font-medium">{counselor.name}</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                        {(!loadingAgentsMap[selectedManagerId] && (!agentCounselors[selectedManagerId] || agentCounselors[selectedManagerId].length === 0)) && (
                                                            <div className="p-4 text-center text-xs text-muted-foreground italic">
                                                                No counselors found for this manager
                                                            </div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {isAgent && (
                                <div className="space-y-2">
                                    <Label>Counselor</Label>
                                    <Select value={selectedCounselorId} onValueChange={setSelectedCounselorId}>
                                        <SelectTrigger className="w-full h-12 rounded-xl bg-slate-50 border-slate-200">
                                            <SelectValue placeholder="Select Counselor" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-xl border-slate-200">
                                            {agentCounselors["direct"]?.map((counselor) => (
                                                <SelectItem key={counselor.id} value={counselor.id} className="cursor-pointer py-3 rounded-lg focus:bg-primary/5">
                                                    <span className="text-sm font-medium">{counselor.name}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="bg-slate-50/50 p-6 pt-4 border-t gap-3 sm:flex-row-reverse">
                    <Button
                        onClick={handleAssignClick}
                        disabled={isSaving || (isAdmin && !selectedManagerId) || (isAgent && !selectedCounselorId)}
                        className="flex-1 sm:flex-none h-11 px-8 rounded-xl bg-primary hover:bg-primary/90 transition-all font-semibold shadow-lg shadow-primary/20"
                    >
                        {isSaving ? "Assigning..." : "Assign Lead"}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSaving}
                        className="flex-1 sm:flex-none h-11 px-8 rounded-xl border-slate-200 hover:bg-slate-100 transition-all text-slate-600"
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
