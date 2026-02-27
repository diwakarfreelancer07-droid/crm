"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    MessageCircle,
    Send,
    Users,
    X,
    ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function WhatsappMessageModal({ isOpen, onClose, selectedStudents }: any) {
    const [message, setMessage] = useState("");
    const [students, setStudents] = useState<any[]>([]);

    // Sync students when modal opens
    useState(() => {
        setStudents(selectedStudents || []);
    });

    const logWhatsappMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch(`/api/applications/whatsapp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to log whatsapp activities');
            return response.json();
        }
    });

    const handleSend = () => {
        if (!message.trim() || students.length === 0) {
            toast.error("Message and recipients are required");
            return;
        }

        // Open individual tabs for each student (browser security might block this if too many)
        // Usually, for bulk, it's better to log it and let user click one by one if they don't have a bulk API
        // For this UI, we'll log them all and suggest the user clicks the individual links if they want actual sending

        const validStudents = students.filter(s => s.phone);

        if (validStudents.length === 0) {
            toast.error("None of the selected students have a phone number");
            return;
        }

        // Log to DB
        logWhatsappMutation.mutate({
            students: validStudents.map(s => ({ id: s.id, phone: s.phone, leadId: s.leadId })),
            message
        });

        // Open first one as a courtesy
        if (validStudents.length === 1) {
            const phone = validStudents[0].phone.replace(/\D/g, '');
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
        } else {
            toast.success(`${validStudents.length} WhatsApp activities logged. Since bulk sending from browser is restricted, please send messages individually.`);
        }

        onClose();
    };

    const removeStudent = (id: string) => {
        setStudents(students.filter(s => s.id !== id));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-xl max-h-[90vh] flex flex-col rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                        <MessageCircle className="h-5 w-5 text-green-500" />
                        Send WhatsApp Message
                    </DialogTitle>
                    <p className="text-sm text-slate-500">
                        Broadcasting to <span className="font-bold text-slate-900">{students.length}</span> students
                    </p>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Users className="h-3 w-3" /> Students
                        </label>
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[45px]">
                            {students.map(s => (
                                <Badge key={s.id} variant="secondary" className="bg-white border-slate-200 text-slate-700 h-7 pr-1 gap-1">
                                    {s.name} {s.phone && `(${s.phone})`}
                                    <button onClick={() => removeStudent(s.id)} className="hover:bg-slate-100 rounded-full p-0.5">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                            {students.length === 0 && <span className="text-sm text-slate-400 italic">No students selected</span>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message Content</label>
                        <Textarea
                            placeholder="Type your WhatsApp message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[200px] rounded-xl border-slate-200 focus:ring-green-500/20 resize-none"
                        />
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 mt-2">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                <ExternalLink className="h-4 w-4 text-amber-600" />
                            </div>
                            <div className="text-xs text-amber-800 leading-relaxed">
                                <p className="font-bold mb-1">Important Note:</p>
                                Browsers prevent opening multiple WhatsApp tabs at once for security.
                                Clicking "Send" will <strong>log this activity</strong> for all students,
                                but will only open a WhatsApp tab for the first student if multiple are selected.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} className="rounded-xl px-6">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={logWhatsappMutation.isPending || students.length === 0}
                        className="rounded-xl px-8 gap-2 font-bold bg-green-600 hover:bg-green-700 text-white"
                    >
                        {logWhatsappMutation.isPending ? "Logging..." : (
                            <>
                                <Send className="h-4 w-4" />
                                {students.length === 1 ? "Open WhatsApp" : "Log & Open First"}
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
