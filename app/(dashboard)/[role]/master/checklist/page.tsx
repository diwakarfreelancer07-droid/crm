
"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Pencil,
    Trash2,
    FileText,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Circle,
    MoreHorizontal,
    CheckSquare,
    Square
} from "lucide-react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermissions } from "@/hooks/use-permissions";

interface Country {
    id: string;
    name: string;
}

interface ChecklistItem {
    id: string;
    name: string;
    type: "MANDATORY" | "OPTIONAL";
    countryId: string | null;
    country: Country | null;
    isEnquiryForm: boolean;
    isMandatory: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function ChecklistPage() {
    const { can } = usePermissions();
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filters & Pagination
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [selectedCountry, setSelectedCountry] = useState("all");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Bulk selection
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Form states
    const [name, setName] = useState("");
    const [type, setType] = useState<"MANDATORY" | "OPTIONAL">("MANDATORY");
    const [countryId, setCountryId] = useState("all");
    const [isEnquiryForm, setIsEnquiryForm] = useState(false);
    const [isMandatory, setIsMandatory] = useState(true);
    const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);

    const fetchCountries = async () => {
        try {
            const res = await fetch("/api/master/countries");
            if (res.ok) {
                const data = await res.json();
                setCountries(data);
            }
        } catch (error) {
            console.error("Failed to fetch countries");
        }
    };

    const fetchChecklist = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(debouncedSearch && { search: debouncedSearch }),
                ...(selectedCountry !== "all" && { countryId: selectedCountry }),
            });

            const res = await fetch(`/api/master/checklist?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setItems(data.items);
                setTotal(data.pagination.total);
                setTotalPages(data.pagination.totalPages);
            }
        } catch (error) {
            toast.error("Failed to fetch checklist");
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, debouncedSearch, selectedCountry]);

    useEffect(() => {
        fetchCountries();
    }, []);

    useEffect(() => {
        fetchChecklist();
    }, [fetchChecklist]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const url = editingItem ? `/api/master/checklist/${editingItem.id}` : "/api/master/checklist";
            const method = editingItem ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    type,
                    countryId: countryId === "all" ? null : countryId,
                    isEnquiryForm,
                    isMandatory
                }),
            });

            if (res.ok) {
                toast.success(editingItem ? "Document updated" : "Document added");
                resetForm();
                setIsSheetOpen(false);
                fetchChecklist();
            } else {
                const error = await res.json();
                toast.error(error.message || "Failed to save");
            }
        } catch (error) {
            toast.error("Error saving checklist item");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setName("");
        setType("MANDATORY");
        setCountryId("all");
        setIsEnquiryForm(false);
        setIsMandatory(true);
        setEditingItem(null);
    };

    const handleEdit = (item: ChecklistItem) => {
        setEditingItem(item);
        setName(item.name);
        setType(item.type);
        setCountryId(item.countryId || "all");
        setIsEnquiryForm(item.isEnquiryForm);
        setIsMandatory(item.isMandatory);
        setIsSheetOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this document from the checklist?")) return;

        try {
            const res = await fetch(`/api/master/checklist/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                toast.success("Document deleted");
                fetchChecklist();
            } else {
                toast.error("Failed to delete document");
            }
        } catch (error) {
            toast.error("Error deleting document");
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected documents?`)) return;

        setIsLoading(true);
        try {
            // Sequential deletion as we don't have a bulk API yet
            for (const id of selectedIds) {
                await fetch(`/api/master/checklist/${id}`, { method: "DELETE" });
            }
            toast.success("Selected documents deleted");
            setSelectedIds([]);
            fetchChecklist();
        } catch (error) {
            toast.error("Error during bulk deletion");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === items.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(items.map(item => item.id));
        }
    };

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search documents..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="rounded-xl pl-9 border-border bg-card"
                        />
                    </div>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                        <SelectTrigger className="w-full md:w-48 rounded-xl border-border bg-card">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="All Countries" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Countries</SelectItem>
                            {countries.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    {selectedIds.length > 0 && can("MASTERS", "DELETE") && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            className="rounded-xl h-10 px-4 font-bold shadow-sm flex items-center gap-2"
                        >
                            <Trash2 className="h-4 w-4" /> Delete Selected ({selectedIds.length})
                        </Button>
                    )}
                    {can("MASTERS", "CREATE") && (
                        <Sheet open={isSheetOpen} onOpenChange={(open) => {
                            setIsSheetOpen(open);
                            if (!open) resetForm();
                        }}>
                            <SheetTrigger asChild>
                                <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl h-10 px-5 text-sm font-bold shadow-sm flex items-center gap-2">
                                    <Plus className="h-4 w-4" /> Add Checklist
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="sm:max-w-[425px] border-l border-border bg-card">
                                <SheetHeader className="mb-6">
                                    <SheetTitle className="text-xl font-bold text-foreground">
                                        {editingItem ? "Edit Checklist Item" : "Add New Checklist Item"}
                                    </SheetTitle>
                                    <SheetDescription className="text-muted-foreground">
                                        Set requirements for student applications.
                                    </SheetDescription>
                                </SheetHeader>
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Document Name</Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. Passport"
                                            required
                                            className="rounded-xl border-border bg-background h-10"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Document Type</Label>
                                        <Select value={type} onValueChange={(v: any) => setType(v)}>
                                            <SelectTrigger className="rounded-xl border-border bg-background h-10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MANDATORY">Mandatory</SelectItem>
                                                <SelectItem value="OPTIONAL">Optional</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Country</Label>
                                        <Select value={countryId} onValueChange={setCountryId}>
                                            <SelectTrigger className="rounded-xl border-border bg-background h-10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Countries</SelectItem>
                                                {countries.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-bold">Enquiry Form</Label>
                                            <p className="text-xs text-muted-foreground">Include in initial enquiry</p>
                                        </div>
                                        <Switch checked={isEnquiryForm} onCheckedChange={setIsEnquiryForm} />
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-bold">Is Mandatory</Label>
                                            <p className="text-xs text-muted-foreground">Required for completion</p>
                                        </div>
                                        <Switch checked={isMandatory} onCheckedChange={setIsMandatory} />
                                    </div>

                                    <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-11 font-bold transition-all shadow-md">
                                        {isSubmitting ? "Processing..." : (editingItem ? "Update Item" : "Save Item")}
                                    </Button>
                                </form>
                            </SheetContent>
                        </Sheet>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden min-h-[400px]">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="w-[50px] px-4">
                                <Checkbox
                                    checked={items.length > 0 && selectedIds.length === items.length}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4 px-4 text-muted-foreground">Action</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4 px-4 text-muted-foreground">Created Date</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4 px-4 text-muted-foreground">Country</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4 px-4 text-muted-foreground">Document Type</TableHead>
                            <TableHead className="font-bold text-xs uppercase tracking-widest py-4 px-4 text-muted-foreground">Document Name</TableHead>
                            <TableHead className="text-center font-bold text-xs uppercase tracking-widest py-4 px-4 text-muted-foreground">Enquiry</TableHead>
                            <TableHead className="text-center font-bold text-xs uppercase tracking-widest py-4 px-4 text-muted-foreground">Mandatory</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-20">
                                    <div className="flex flex-col items-center gap-2">
                                        <MoreHorizontal className="h-8 w-8 animate-pulse text-primary" />
                                        <p className="text-sm text-muted-foreground italic">Fetching checklist documents...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-20 text-muted-foreground italic">
                                    No documents found. Add a checklist item to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id} className="border-border/40 hover:bg-primary/[0.02] transition-colors group">
                                    <TableCell className="px-4">
                                        <Checkbox
                                            checked={selectedIds.includes(item.id)}
                                            onCheckedChange={() => toggleSelect(item.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="px-4">
                                        <div className="flex gap-1">
                                            {can("MASTERS", "EDIT") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(item)}
                                                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all opacity-40 group-hover:opacity-100"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                            {can("MASTERS", "DELETE") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(item.id)}
                                                    className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all opacity-40 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {new Date(item.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell className="px-4">
                                        <Badge variant="outline" className="bg-muted/50 text-foreground font-semibold border-border rounded-lg">
                                            {item.country?.name || "All Countries"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-4">
                                        <Badge className={`
                                            rounded-lg font-bold px-2 py-0.5 text-[10px] uppercase tracking-wider border-none
                                            ${item.type === "MANDATORY" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}
                                        `}>
                                            {item.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="px-4 font-semibold text-sm">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-primary/60" />
                                            {item.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-4 text-center">
                                        {item.isEnquiryForm ? (
                                            <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
                                        ) : (
                                            <Circle className="h-5 w-5 text-muted/20 mx-auto" />
                                        )}
                                    </TableCell>
                                    <TableCell className="px-4 text-center">
                                        {item.isMandatory ? (
                                            <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
                                        ) : (
                                            <Circle className="h-5 w-5 text-muted/20 mx-auto" />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-t border-border">
                    <div className="flex items-center gap-4">
                        <p className="text-sm text-muted-foreground">
                            Showing <span className="font-bold text-foreground">{total === 0 ? 0 : (page - 1) * limit + 1}</span> to <span className="font-bold text-foreground">{Math.min(page * limit, total)}</span> of <span className="font-bold text-foreground">{total}</span> entries
                        </p>
                        <Select
                            value={limit.toString()}
                            onValueChange={(v) => {
                                setLimit(parseInt(v));
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-20 h-8 rounded-lg border-border bg-card text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="h-8 w-8 rounded-lg border-border bg-card"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1 px-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <Button
                                    key={p}
                                    variant={page === p ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setPage(p)}
                                    className={`h-8 w-8 rounded-lg p-0 text-xs ${page === p ? "bg-primary text-white" : "border-border bg-card"}`}
                                >
                                    {p}
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={page === totalPages || totalPages === 0}
                            onClick={() => setPage(page + 1)}
                            className="h-8 w-8 rounded-lg border-border bg-card"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
