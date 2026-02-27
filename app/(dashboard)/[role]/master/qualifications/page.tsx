"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil } from "lucide-react";

interface Qualification {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: string;
}

export default function QualificationsPage() {
    const { data: session } = useSession();
    const [qualifications, setQualifications] = useState<Qualification[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingQualification, setEditingQualification] = useState<Qualification | null>(null);
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchQualifications = async () => {
        try {
            const res = await fetch("/api/master/qualifications");
            if (res.ok) {
                const data = await res.json();
                setQualifications(data);
            } else {
                toast.error("Failed to load qualifications");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQualifications();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const url = editingQualification ? `/api/master/qualifications/${editingQualification.id}` : "/api/master/qualifications";
            const method = editingQualification ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });

            if (res.ok) {
                toast.success(editingQualification ? "Qualification updated" : "Qualification added");
                setName("");
                setEditingQualification(null);
                setIsSheetOpen(false);
                fetchQualifications();
            } else {
                const error = await res.json();
                toast.error(error.message || (editingQualification ? "Failed to update" : "Failed to add"));
            }
        } catch (error) {
            toast.error("Error saving qualification");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (q: Qualification) => {
        setEditingQualification(q);
        setName(q.name);
        setIsSheetOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this qualification?")) return;
        try {
            const res = await fetch(`/api/master/qualifications/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                toast.success("Deleted successfully");
                fetchQualifications();
            } else {
                toast.error("Failed to delete");
            }
        } catch (error) {
            toast.error("Error deleting");
        }
    };

    const handleSheetOpenChange = (open: boolean) => {
        setIsSheetOpen(open);
        if (!open) {
            setEditingQualification(null);
            setName("");
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "MANAGER") {
        return <div className="p-8">Unauthorized</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Master Settings: Qualifications</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage academic qualifications available for leads and students.</p>
                </div>
                <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
                    <SheetTrigger asChild>
                        <Button className="gap-2 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-sm px-6">
                            <Plus className="h-4 w-4" /> Add Qualification
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-md">
                        <SheetHeader className="pb-4">
                            <SheetTitle className="text-xl font-bold">{editingQualification ? "Edit Qualification" : "Add Qualification"}</SheetTitle>
                            <SheetDescription>
                                {editingQualification ? "Update the name of the qualification." : "Enter the name for the new academic qualification."}
                            </SheetDescription>
                        </SheetHeader>
                        <form onSubmit={handleSubmit} className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Qualification Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Bachelor of Science"
                                    required
                                    className="rounded-xl h-11 border-border bg-muted/30 focus:bg-background transition-all"
                                />
                            </div>
                            <Button type="submit" className="w-full h-11 font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md transition-all active:scale-[0.98]" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingQualification ? "Update Qualification" : "Create Qualification"}
                            </Button>
                        </form>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="border-border/50">
                            <TableHead className="font-bold py-4 px-6 text-[11px] uppercase tracking-widest text-muted-foreground">Name</TableHead>
                            <TableHead className="font-bold py-4 text-[11px] uppercase tracking-widest text-muted-foreground">Status</TableHead>
                            <TableHead className="font-bold py-4 text-right px-6 text-[11px] uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {qualifications.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-12 text-muted-foreground italic">
                                    No qualifications found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            qualifications.map((q) => (
                                <TableRow key={q.id} className="border-border/40 hover:bg-primary/[0.02] transition-colors">
                                    <TableCell className="font-semibold py-4 px-6 text-sm">{q.name}</TableCell>
                                    <TableCell className="py-4 text-xs font-medium uppercase tracking-widest">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${q.isActive ? "bg-emerald-100 text-emerald-700 font-bold" : "bg-gray-100 text-gray-500 font-medium"}`}>
                                            {q.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right py-4 px-6">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(q)}
                                                className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(q.id)}
                                                className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
