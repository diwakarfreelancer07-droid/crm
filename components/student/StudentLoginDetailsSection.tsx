"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Globe, User, Key, ExternalLink, FileText } from "lucide-react";
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

interface LoginDetail {
    id: string;
    portalName: string;
    username: string;
    password: string;
    url?: string;
    notes?: string;
}

export default function StudentLoginDetailsSection({ studentId, initialData = [] }: { studentId: string; initialData?: LoginDetail[] }) {
    const [data, setData] = useState<LoginDetail[]>(initialData);
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        portalName: "",
        username: "",
        password: "",
        url: "",
        notes: ""
    });

    const handleSave = async () => {
        if (!formData.portalName || !formData.username || !formData.password) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSaving(true);
        try {
            const response = await axios.post(`/api/students/${studentId}/login-details`, formData);
            setData([response.data, ...data]);
            setIsOpen(false);
            setFormData({ portalName: "", username: "", password: "", url: "", notes: "" });
            toast.success("Login details added successfully");
        } catch (error) {
            toast.error("Failed to add login details");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await axios.delete(`/api/login-details/${id}`);
            setData(data.filter(item => item.id !== id));
            toast.success("Login details deleted");
        } catch (error) {
            toast.error("Failed to delete login details");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary" /> Application Portal Logins
                </h3>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-8 rounded-lg bg-primary hover:bg-primary/90">
                            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Login
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white border-none shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Add Login Detail</DialogTitle>
                            <DialogDescription className="text-slate-500">
                                Enter the login credentials for a university or application portal.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="portalName" className="text-xs font-bold uppercase tracking-wider text-slate-500">Portal Name *</Label>
                                <Input
                                    id="portalName"
                                    placeholder="e.g. University of Alabama Portal"
                                    value={formData.portalName}
                                    onChange={(e) => setFormData({ ...formData, portalName: e.target.value })}
                                    className="rounded-xl border-slate-200 focus:ring-primary/20"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-slate-500">Username *</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="username"
                                        placeholder="Username or Email"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="pl-9 rounded-xl border-slate-200 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500">Password *</Label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="password"
                                        type="text"
                                        placeholder="Password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="pl-9 rounded-xl border-slate-200 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="url" className="text-xs font-bold uppercase tracking-wider text-slate-500">URL (Optional)</Label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="url"
                                        placeholder="https://portal.university.edu"
                                        value={formData.url}
                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                        className="pl-9 rounded-xl border-slate-200 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-slate-500">Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Any additional info..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="rounded-xl border-slate-200 focus:ring-primary/20 min-h-[80px]"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsOpen(false)} className="rounded-xl font-bold">Cancel</Button>
                            <Button onClick={handleSave} disabled={isSaving} className="rounded-xl bg-[#3e3a8e] font-bold">
                                {isSaving ? "Saving..." : "Save Details"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Key className="h-10 w-10 text-slate-300 mb-2 opacity-50" />
                    <p className="text-xs text-slate-400 italic">No login details saved yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.map((item) => (
                        <Card key={item.id} className="border border-border/50 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all group">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="space-y-0.5">
                                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                            {item.portalName}
                                            {item.url && (
                                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                        </h4>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(item.id)}
                                        className="h-7 w-7 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                                <div className="space-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500 font-medium">Username</span>
                                        <span className="font-bold text-slate-700">{item.username}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500 font-medium">Password</span>
                                        <span className="font-bold text-slate-700 select-all">{item.password}</span>
                                    </div>
                                </div>
                                {item.notes && (
                                    <div className="mt-3 flex gap-2">
                                        <FileText className="h-3 w-3 text-slate-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-[11px] text-slate-500 leading-relaxed italic line-clamp-2">
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
