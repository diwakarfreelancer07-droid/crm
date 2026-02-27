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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Mail,
    Send,
    Users,
    X
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function EmailComposeModal({ isOpen, onClose, selectedEmails }: any) {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [emails, setEmails] = useState<string[]>([]);

    // Sync emails when modal opens
    useState(() => {
        setEmails(selectedEmails || []);
    });

    const sendEmailMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch(`/api/applications/email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to send email');
            return response.json();
        },
        onSuccess: () => {
            toast.success("Emails sent successfully");
            onClose();
            setSubject("");
            setMessage("");
        },
        onError: () => {
            toast.error("Failed to send emails");
        }
    });

    const handleSend = () => {
        if (!subject.trim() || !message.trim() || emails.length === 0) {
            toast.error("Subject, message and recipients are required");
            return;
        }
        sendEmailMutation.mutate({ recipients: emails, subject, message });
    };

    const removeEmail = (email: string) => {
        setEmails(emails.filter(e => e !== email));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                        <Mail className="h-5 w-5 text-amber-500" />
                        Compose Email
                    </DialogTitle>
                    <p className="text-sm text-slate-500">
                        Sending to <span className="font-bold text-slate-900">{emails.length}</span> recipients
                    </p>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Users className="h-3 w-3" /> Recipients
                        </label>
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[45px]">
                            {emails.map(email => (
                                <Badge key={email} variant="secondary" className="bg-white border-slate-200 text-slate-700 h-7 pr-1 gap-1">
                                    {email}
                                    <button onClick={() => removeEmail(email)} className="hover:bg-slate-100 rounded-full p-0.5">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                            {emails.length === 0 && <span className="text-sm text-slate-400 italic">No recipients selected</span>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                        <Input
                            placeholder="Enter email subject..."
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="h-12 rounded-xl border-slate-200 focus:ring-primary/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message</label>
                        <Textarea
                            placeholder="Type your message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="min-h-[250px] rounded-xl border-slate-200 focus:ring-primary/20 resize-none"
                        />
                        <p className="text-[10px] text-slate-400 italic">
                            Tip: These emails will be sent individually to each recipient.
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} className="rounded-xl px-6">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={sendEmailMutation.isPending || emails.length === 0}
                        className="rounded-xl px-8 gap-2 font-bold bg-primary hover:bg-primary/90"
                    >
                        {sendEmailMutation.isPending ? "Sending..." : (
                            <>
                                <Send className="h-4 w-4" />
                                Send Now
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
