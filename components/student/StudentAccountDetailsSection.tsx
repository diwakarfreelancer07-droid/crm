"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Database, CreditCard, Hash, MapPin, FileText } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";

interface AccountDetail {
    id: string;
    bankName: string;
    accountNo: string;
    ifscCode?: string;
    branch?: string;
    notes?: string;
}

export default function StudentAccountDetailsSection({ studentId, initialData = [] }: { studentId: string; initialData?: AccountDetail[] }) {
    const [data, setData] = useState<AccountDetail[]>(initialData);
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        bankName: "",
        accountNo: "",
        ifscCode: "",
        branch: "",
        notes: ""
    });

    const handleSave = async () => {
        if (!formData.bankName || !formData.accountNo) {
            toast.error("Please fill in required fields");
            return;
        }

        setIsSaving(true);
        try {
            const response = await axios.post(`/api/students/${studentId}/account-details`, formData);
            setData([response.data, ...data]);
            setIsOpen(false);
            setFormData({ bankName: "", accountNo: "", ifscCode: "", branch: "", notes: "" });
            toast.success("Account details added successfully");
        } catch (error) {
            toast.error("Failed to add account details");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await axios.delete(`/api/account-details/${id}`);
            setData(data.filter(item => item.id !== id));
            toast.success("Account details deleted");
        } catch (error) {
            toast.error("Failed to delete account details");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" /> Bank & Account Details
                </h3>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-8 rounded-lg bg-primary hover:bg-primary/90">
                            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Account
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white border-none shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Add Account Detail</DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Store bank details for payments, refunds, or tuition.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="bankName" className="text-xs font-bold uppercase tracking-wider text-slate-500">Bank Name *</Label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="bankName"
                                        placeholder="e.g. HDFC Bank, ICICI Bank"
                                        value={formData.bankName}
                                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                        className="pl-9 rounded-xl border-slate-200 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="accountNo" className="text-xs font-bold uppercase tracking-wider text-slate-500">Account Number *</Label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="accountNo"
                                        placeholder="Account Number"
                                        value={formData.accountNo}
                                        onChange={(e) => setFormData({ ...formData, accountNo: e.target.value })}
                                        className="pl-9 rounded-xl border-slate-200 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="grid gap-2 flex-1">
                                    <Label htmlFor="ifscCode" className="text-xs font-bold uppercase tracking-wider text-slate-500">IFSC / SWIFT</Label>
                                    <Input
                                        id="ifscCode"
                                        placeholder="IFSC Code"
                                        value={formData.ifscCode}
                                        onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                                        className="rounded-xl border-slate-200 focus:ring-primary/20 uppercase"
                                    />
                                </div>
                                <div className="grid gap-2 flex-1">
                                    <Label htmlFor="branch" className="text-xs font-bold uppercase tracking-wider text-slate-500">Branch</Label>
                                    <Input
                                        id="branch"
                                        placeholder="Branch Name"
                                        value={formData.branch}
                                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                        className="rounded-xl border-slate-200 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-slate-500">Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Any additional info (e.g. Swift code, address)..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="rounded-xl border-slate-200 focus:ring-primary/20 min-h-[80px]"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl font-bold">Cancel</Button>
                            <Button onClick={handleSave} disabled={isSaving} className="rounded-xl bg-[#3e3a8e] font-bold">
                                {isSaving ? "Saving..." : "Save Account"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Database className="h-10 w-10 text-slate-300 mb-2 opacity-50" />
                    <p className="text-xs text-slate-400 italic">No account details saved yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.map((item) => (
                        <Card key={item.id} className="border border-border/50 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all group overflow-hidden">
                            <CardContent className="p-0">
                                <div className="p-4 border-b border-slate-50">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                            <CreditCard className="h-4 w-4 text-emerald-500" /> {item.bankName}
                                        </h4>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(item.id)}
                                            className="h-7 w-7 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Account Number</p>
                                        <p className="text-base font-mono font-bold text-slate-700 tracking-wider">
                                            {item.accountNo}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-slate-50/50 p-4 grid grid-cols-2 gap-4">
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">IFSC / SWIFT</p>
                                        <p className="text-xs font-bold text-slate-700">{item.ifscCode || "-"}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Branch</p>
                                        <p className="text-xs font-bold text-slate-700 truncate">{item.branch || "-"}</p>
                                    </div>
                                </div>
                                {item.notes && (
                                    <div className="p-4 bg-emerald-50/20 flex gap-2 border-t border-slate-50">
                                        <FileText className="h-3 w-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-[11px] text-slate-600 leading-relaxed italic line-clamp-2">
                                            {item.notes}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
