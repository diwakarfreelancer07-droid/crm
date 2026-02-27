"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Globe } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Country {
    id: string;
    name: string;
    code: string | null;
    isActive: boolean;
}

export default function CountriesPage() {
    const [countries, setCountries] = useState<Country[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [editingCountry, setEditingCountry] = useState<Country | null>(null);

    const fetchCountries = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/master/countries");
            if (res.ok) {
                const data = await res.json();
                setCountries(data);
            }
        } catch (error) {
            toast.error("Failed to fetch countries");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCountries();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const url = editingCountry ? `/api/master/countries/${editingCountry.id}` : "/api/master/countries";
            const method = editingCountry ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, code }),
            });

            if (res.ok) {
                toast.success(editingCountry ? "Country updated" : "Country added");
                setName("");
                setCode("");
                setEditingCountry(null);
                setIsSheetOpen(false);
                fetchCountries();
            } else {
                const error = await res.json();
                toast.error(error.message || (editingCountry ? "Failed to update" : "Failed to add"));
            }
        } catch (error) {
            toast.error("Error saving country");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (country: Country) => {
        setEditingCountry(country);
        setName(country.name);
        setCode(country.code || "");
        setIsSheetOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this country?")) return;

        try {
            const res = await fetch(`/api/master/countries/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success("Country deleted");
                fetchCountries();
            } else {
                toast.error("Failed to delete country");
            }
        } catch (error) {
            toast.error("Error deleting country");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-end items-center">
                <Sheet open={isSheetOpen} onOpenChange={(open) => {
                    setIsSheetOpen(open);
                    if (!open) {
                        setEditingCountry(null);
                        setName("");
                        setCode("");
                    }
                }}>
                    <SheetTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl h-10 px-5 text-sm font-bold shadow-sm flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Add Country
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-[425px] border-l border-border bg-card">
                        <SheetHeader className="mb-6">
                            <SheetTitle className="text-xl font-bold text-foreground">
                                {editingCountry ? "Edit Country" : "Add New Country"}
                            </SheetTitle>
                            <SheetDescription className="text-muted-foreground">
                                {editingCountry ? "Update the details of the existing country." : "Create a new country entry for the system."}
                            </SheetDescription>
                        </SheetHeader>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Country Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. United Kingdom"
                                    required
                                    className="rounded-xl border-border bg-background focus:ring-primary/20 h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Country Code (Optional)</Label>
                                <Input
                                    id="code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="e.g. UK or GBR"
                                    className="rounded-xl border-border bg-background focus:ring-primary/20 h-10"
                                />
                            </div>
                            <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-11 font-bold transition-all shadow-md">
                                {isSubmitting ? "Processing..." : (editingCountry ? "Update Country" : "Save Country")}
                            </Button>
                        </form>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4 px-6 text-muted-foreground">Name</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4 px-6 text-muted-foreground">Code</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4 px-6 text-muted-foreground">Status</TableHead>
                            <TableHead className="text-right font-bold text-xs uppercase tracking-widest py-4 px-6 text-muted-foreground">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">
                                    Loading countries...
                                </TableCell>
                            </TableRow>
                        ) : countries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">
                                    No countries found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            countries.map((c) => (
                                <TableRow key={c.id} className="border-border/40 hover:bg-primary/[0.02] transition-colors">
                                    <TableCell className="font-semibold py-4 px-6 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-4 w-4 text-muted-foreground/60" />
                                            {c.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 px-6 text-sm text-muted-foreground font-medium uppercase">{c.code || "-"}</TableCell>
                                    <TableCell className="py-4 text-xs font-medium uppercase tracking-widest">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${c.isActive ? "bg-emerald-100 text-emerald-700 font-bold" : "bg-gray-100 text-gray-500 font-medium"}`}>
                                            {c.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right py-4 px-6">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(c)}
                                                className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(c.id)}
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
