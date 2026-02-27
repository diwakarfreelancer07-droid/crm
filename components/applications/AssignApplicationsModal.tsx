"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    UserPlus,
    Search,
    User,
    Check
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AssignApplicationsModal({ isOpen, onClose, selectedIds, selectedNames, onSuccess }: any) {
    const [selectedAgentId, setSelectedAgentId] = useState<string>("");
    const [agentCounselors, setAgentCounselors] = useState<Record<string, any[]>>({});
    const [loadingCounselors, setLoadingCounselors] = useState<Record<string, boolean>>({});
    const [search, setSearch] = useState("");
    const queryClient = useQueryClient();

    const { data: staffData, isLoading } = useQuery({
        queryKey: ['staff-list'],
        queryFn: async () => {
            const response = await fetch(`/api/employees?limit=1000&status=active`);
            if (!response.ok) throw new Error('Failed to fetch staff');
            return response.json();
        },
        enabled: isOpen
    });

    const assignMutation = useMutation({
        mutationFn: async (userId: string) => {
            const response = await fetch(`/api/applications/bulk-assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ids: selectedIds,
                    assignedToId: userId
                })
            });
            if (!response.ok) throw new Error('Failed to assign');
            return response.json();
        },
        onSuccess: () => {
            toast.success(`Assigned ${selectedIds.length} applications`);
            onSuccess();
            onClose();
            setSelectedAgentId("");
            queryClient.invalidateQueries({ queryKey: ['applications'] });
        }
    });

    const fetchCounselors = async (agentId: string) => {
        if (agentCounselors[agentId] || loadingCounselors[agentId]) return;
        setLoadingCounselors(prev => ({ ...prev, [agentId]: true }));
        try {
            const response = await fetch(`/api/employees?role=COUNSELOR&status=active&agentId=${agentId}&limit=100`);
            const data = await response.json();
            setAgentCounselors(prev => ({ ...prev, [agentId]: data.employees || [] }));
        } catch (error) {
            toast.error("Failed to load counselors");
        } finally {
            setLoadingCounselors(prev => ({ ...prev, [agentId]: false }));
        }
    };

    const agents = (staffData?.employees || []).filter((s: any) =>
        ["AGENT", "SALES_REP", "MANAGER", "ADMIN"].includes(s.role) &&
        (s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] flex flex-col rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100 text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <UserPlus className="h-6 w-6 text-blue-600" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-slate-800">
                        Assign Applications
                    </DialogTitle>
                    <p className="text-sm text-slate-500">
                        Select a staff member to assign <span className="text-blue-600 font-bold">{selectedIds.length}</span> application(s)
                    </p>
                </DialogHeader>

                <div className="p-4 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search Admin/Agents..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 rounded-xl border-slate-200"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[300px]">
                    {isLoading ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-12 bg-slate-50 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {!selectedAgentId ? (
                                agents.map((staff: any) => (
                                    <button
                                        key={staff.id}
                                        onClick={() => {
                                            setSelectedAgentId(staff.id);
                                            fetchCounselors(staff.id);
                                        }}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group text-left"
                                    >
                                        <Avatar className="h-10 w-10 border border-slate-100">
                                            <AvatarImage src={staff.imageUrl} />
                                            <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
                                                {staff.name?.charAt(0) || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                {staff.name}
                                            </p>
                                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">
                                                {staff.role}
                                            </p>
                                        </div>
                                        <div className="text-xs text-slate-400 font-bold group-hover:text-blue-600 flex items-center gap-1">
                                            Select <Search className="h-3 w-3" />
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setSelectedAgentId("")}
                                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-2 py-1 flex items-center gap-1"
                                    >
                                        ← Back to Agents
                                    </button>

                                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 mb-4">
                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Selected Primary Assignee</p>
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-slate-900">{agents.find((a: any) => a.id === selectedAgentId)?.name}</p>
                                            <Button
                                                size="sm"
                                                onClick={() => assignMutation.mutate(selectedAgentId)}
                                                className="h-7 text-[10px] font-bold rounded-lg"
                                            >
                                                Assign to Him
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="px-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Or Assign to a Counselor under him</p>
                                        {loadingCounselors[selectedAgentId] ? (
                                            <div className="p-4 text-center animate-pulse text-xs">Loading counselors...</div>
                                        ) : agentCounselors[selectedAgentId]?.length > 0 ? (
                                            agentCounselors[selectedAgentId].map((c: any) => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => assignMutation.mutate(c.id)}
                                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group text-left border border-transparent hover:border-slate-200 mt-1"
                                                >
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={c.imageUrl} />
                                                        <AvatarFallback className="text-[10px] font-bold">{c.name?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <p className="flex-1 font-bold text-sm text-slate-700">{c.name}</p>
                                                    <Check className="h-4 w-4 text-transparent group-hover:text-blue-600" />
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-xs text-slate-400 italic">No counselors reporting to this agent</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {assignMutation.isPending && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-bold text-blue-600">Assigning...</p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
