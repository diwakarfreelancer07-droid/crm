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
import { Textarea } from "@/components/ui/textarea";
import {
    MessageSquare,
    Send,
    User,
    Calendar,
    StickyNote
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ApplicationNotesModal({ isOpen, onClose, application, onUpdate }: any) {
    const [newNote, setNewNote] = useState("");
    const queryClient = useQueryClient();

    const { data: notes, isLoading } = useQuery({
        queryKey: ['application-notes', application?.id],
        queryFn: async () => {
            if (!application?.id) return [];
            const response = await fetch(`/api/applications/${application.id}/notes`);
            if (!response.ok) throw new Error('Failed to fetch notes');
            return response.json();
        },
        enabled: !!application?.id && isOpen
    });

    const addNoteMutation = useMutation({
        mutationFn: async (content: string) => {
            const response = await fetch(`/api/applications/${application.id}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note: content })
            });
            if (!response.ok) throw new Error('Failed to add note');
            return response.json();
        },
        onSuccess: () => {
            setNewNote("");
            queryClient.invalidateQueries({ queryKey: ['application-notes', application?.id] });
            onUpdate(); // To refresh note count in table
            toast.success("Note added successfully");
        },
        onError: () => {
            toast.error("Failed to add note");
        }
    });

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        addNoteMutation.mutate(newNote);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] flex flex-col rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                        <StickyNote className="h-5 w-5 text-amber-500" />
                        Application Notes
                    </DialogTitle>
                    {application?.student?.name && (
                        <p className="text-sm text-slate-500 font-medium">
                            Student: <span className="text-slate-900 font-bold">{application.student.name}</span>
                        </p>
                    )}
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white min-h-[300px]">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="h-24 bg-slate-50 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : notes?.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 italic">
                            No notes added yet.
                        </div>
                    ) : (
                        notes?.map((note: any) => (
                            <div key={note.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                                <Avatar className="h-8 w-8 border-2 border-slate-100">
                                    <AvatarImage src={note.user?.imageUrl} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                                        {note.user?.name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-900">
                                            {note.user?.name}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 capitalize bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                            {format(new Date(note.createdAt), "MMM d, HH:mm")}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-2xl rounded-tl-none border border-slate-100">
                                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                            {note.note}
                                        </p>
                                    </div>
                                    {note.user?.role && (
                                        <div className="text-[10px] text-slate-400 font-semibold px-2">
                                            {note.user.role}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <div className="flex flex-col gap-2">
                        <Textarea
                            placeholder="Type a new internal note here..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            className="min-h-[100px] rounded-xl border-slate-200 focus:ring-primary/20 bg-white"
                        />
                        <Button
                            onClick={handleAddNote}
                            disabled={!newNote.trim() || addNoteMutation.isPending}
                            className="rounded-xl gap-2 font-bold"
                        >
                            <Send className="h-4 w-4" />
                            {addNoteMutation.isPending ? "Adding..." : "Add Note"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
