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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, User, Users, Plane, Info } from "lucide-react";
import { Application } from "@/types/api";

interface MoveToVisaModalProps {
    isOpen: boolean;
    onClose: () => void;
    application: Application | null;
    onSuccess: () => void;
}

export function MoveToVisaModal({
    isOpen,
    onClose,
    application,
    onSuccess,
}: MoveToVisaModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [agents, setAgents] = useState<any[]>([]);
    const [counselors, setCounselors] = useState<any[]>([]);
    const [isLoadingStaff, setIsLoadingStaff] = useState(false);

    const [formData, setFormData] = useState({
        agentId: "",
        counselorId: "",
        appointmentDate: "",
    });

    useEffect(() => {
        if (isOpen) {
            fetchAgents();
        } else {
            setFormData({ agentId: "", counselorId: "", appointmentDate: "" });
            setCounselors([]);
        }
    }, [isOpen]);

    const fetchAgents = async () => {
        setIsLoadingStaff(true);
        try {
            const res = await axios.get("/api/employees?role=AGENT&limit=100");
            setAgents(res.data.employees || []);
        } catch (error) {
            console.error("Failed to fetch agents:", error);
            toast.error("Failed to load agents list");
        } finally {
            setIsLoadingStaff(false);
        }
    };

    const fetchCounselors = async (agentId: string) => {
        setIsLoadingStaff(true);
        try {
            // Fetch counselors belonging to this agent
            const res = await axios.get(`/api/employees?role=COUNSELOR&agentId=${agentId}&limit=100`);
            setCounselors(res.data.employees || []);
        } catch (error) {
            console.error("Failed to fetch counselors:", error);
            toast.error("Failed to load counselors list");
        } finally {
            setIsLoadingStaff(false);
        }
    };

    const handleAgentChange = (val: string) => {
        setFormData(prev => ({ ...prev, agentId: val, counselorId: "" }));
        fetchCounselors(val);
    };

    const handleSave = async () => {
        if (!application) return;
        if (!formData.agentId) {
            toast.error("Please select an Agent");
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.post(`/api/applications/${application.id}/ready-for-visa`, {
                agentId: formData.agentId,
                counselorId: formData.counselorId || null,
                appointmentDate: formData.appointmentDate || null
            });

            toast.success("Application moved to Visa stage!");
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Move to visa failed:", error);
            toast.error(error.response?.data?.error || "Failed to move to Visa stage");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!application) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                        <Plane className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-xl font-bold">Move to Visa Stage</DialogTitle>
                    <DialogDescription>
                        Assign an agent and counselor for <strong>{application.student?.name}</strong>&apos;s visa process.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-5">
                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex gap-3 text-amber-800 text-xs">
                        <Info className="h-4 w-4 shrink-0 mt-0.5" />
                        <p>This will create a new Visa Application record and hide this entry from the main Applications table.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                <User className="h-3 w-3" /> Select Agent*
                            </Label>
                            <Select value={formData.agentId} onValueChange={handleAgentChange}>
                                <SelectTrigger className="rounded-xl h-11">
                                    <SelectValue placeholder={isLoadingStaff ? "Loading..." : "Select Agent"} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {agents.map(a => (
                                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                <Users className="h-3 w-3" /> Select Counselor (Optional)
                            </Label>
                            <Select
                                value={formData.counselorId}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, counselorId: val }))}
                                disabled={!formData.agentId || counselors.length === 0}
                            >
                                <SelectTrigger className="rounded-xl h-11">
                                    <SelectValue placeholder={!formData.agentId ? "Select an agent first" : counselors.length === 0 ? "No counselors for this agent" : "Select Counselor"} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {counselors.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Appointment Date (Optional)</Label>
                            <Input
                                type="date"
                                value={formData.appointmentDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                                className="rounded-xl h-11"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-muted/20 border-t border-primary/10 flex items-center justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="rounded-xl h-11 px-6">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSubmitting || !formData.agentId}
                        className="rounded-xl h-11 px-8 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plane className="h-4 w-4 mr-2" />}
                        Move to Visa
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
