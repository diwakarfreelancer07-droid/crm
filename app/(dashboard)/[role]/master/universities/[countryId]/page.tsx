"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ArrowLeft,
    Plus,
    Pencil,
    Trash2,
    Search,
    ExternalLink,
    Loader2,
    MoreHorizontal
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface University {
    id: string;
    name: string;
    website: string | null;
    address: string | null;
    description: string | null;
    imageUrl: string | null;
}

interface Country {
    id: string;
    name: string;
}

export default function UniversityDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { data: session } = useSession() as any;
    const countryId = params.countryId as string;
    const role = params.role as string;
    const canEdit = ["ADMIN", "MANAGER"].includes(session?.user?.role || "");

    const [universities, setUniversities] = useState<University[]>([]);
    const [country, setCountry] = useState<Country | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });

    // Modal states
    const [isAddEditOpen, setIsAddEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedUni, setSelectedUni] = useState<University | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        website: "",
        address: "",
        description: "",
        imageUrl: ""
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchUniversities = useCallback(async () => {
        try {
            setLoading(true);
            const [uniRes, countryRes] = await Promise.all([
                axios.get(`/api/master/universities`, {
                    params: {
                        countryId,
                        search,
                        page: pagination.page,
                        limit: pagination.limit
                    }
                }),
                axios.get(`/api/master/countries-with-university-count`) // To get country name
            ]);

            setUniversities(uniRes.data.universities);
            setPagination(uniRes.data.pagination);

            const currentCountry = countryRes.data.find((c: any) => c.id === countryId);
            setCountry(currentCountry);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("Failed to load universities");
        } finally {
            setLoading(false);
        }
    }, [countryId, search, pagination.page, pagination.limit]);

    useEffect(() => {
        fetchUniversities();
    }, [fetchUniversities]);

    const handleOpenAdd = () => {
        setSelectedUni(null);
        setFormData({ name: "", website: "", address: "", description: "", imageUrl: "" });
        setIsAddEditOpen(true);
    };

    const handleOpenEdit = (uni: University) => {
        setSelectedUni(uni);
        setFormData({
            name: uni.name,
            website: uni.website || "",
            address: uni.address || "",
            description: uni.description || "",
            imageUrl: uni.imageUrl || ""
        });
        setIsAddEditOpen(true);
    };

    const handleOpenDelete = (uni: University) => {
        setSelectedUni(uni);
        setIsDeleteOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return toast.error("University name is required");

        try {
            setSubmitting(true);
            if (selectedUni) {
                await axios.put(`/api/master/universities/${selectedUni.id}`, formData);
                toast.success("University updated successfully");
            } else {
                await axios.post(`/api/master/universities`, { ...formData, countryId });
                toast.success("University added successfully");
            }
            setIsAddEditOpen(false);
            fetchUniversities();
        } catch (error) {
            console.error("Failed to save university:", error);
            toast.error("Failed to save university");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedUni) return;
        try {
            setSubmitting(true);
            await axios.delete(`/api/master/universities/${selectedUni.id}`);
            toast.success("University deleted successfully");
            setIsDeleteOpen(false);
            fetchUniversities();
        } catch (error) {
            console.error("Failed to delete university:", error);
            toast.error("Failed to delete university");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Breadcrumb */}
            <div className="flex flex-col gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit -ml-2 text-muted-foreground hover:text-primary"
                    onClick={() => router.push(`/${role}/master/universities`)}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Countries
                </Button>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {country?.name || "Loading..."}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Masters &gt; Universities &gt; {country?.name}
                        </p>
                    </div>
                    {canEdit && (
                        <Button onClick={handleOpenAdd}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add University
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search university name..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-xl bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>University Name</TableHead>
                            <TableHead>Website</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <span className="text-muted-foreground">Loading universities...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : universities.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                    No universities found in {country?.name}.
                                </TableCell>
                            </TableRow>
                        ) : (
                            universities.map((uni, idx) => (
                                <TableRow key={uni.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium text-muted-foreground">
                                        {(pagination.page - 1) * pagination.limit + idx + 1}
                                    </TableCell>
                                    <TableCell className="font-semibold">{uni.name}</TableCell>
                                    <TableCell>
                                        {uni.website ? (
                                            <a
                                                href={uni.website.startsWith('http') ? uni.website : `https://${uni.website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-primary hover:underline"
                                            >
                                                {uni.website}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        ) : (
                                            <span className="text-muted-foreground italic text-xs">Not specified</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate text-muted-foreground">
                                        {uni.address || "N/A"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenEdit(uni)} disabled={!canEdit}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => handleOpenDelete(uni)}
                                                    disabled={!canEdit}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination Stats */}
                <div className="flex items-center justify-between px-4 py-4 border-t bg-muted/20">
                    <p className="text-sm text-muted-foreground">
                        Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page <= 1}
                            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page >= pagination.pages}
                            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Dialog open={isAddEditOpen} onOpenChange={setIsAddEditOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{selectedUni ? "Edit University" : "Add New University"}</DialogTitle>
                        <DialogDescription>
                            Enter the university details below for {country?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">University Name <span className="text-destructive">*</span></Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. University of Oxford"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="website">Website (Optional)</Label>
                            <Input
                                id="website"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                placeholder="https://example.edu"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="imageUrl">Logo URL (Optional)</Label>
                            <Input
                                id="imageUrl"
                                value={formData.imageUrl}
                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                placeholder="URL to logo image"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address">Address (Optional)</Label>
                            <Textarea
                                id="address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Full campus address"
                                rows={2}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief overview of the university"
                                rows={3}
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsAddEditOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {selectedUni ? "Update University" : "Save University"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <ConfirmDialog
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Are you absolutely sure?"
                description={`This will permanently delete ${selectedUni?.name}. This action cannot be undone.`}
                confirmText="Delete"
                variant="destructive"
                isLoading={submitting}
            />
        </div>
    );
}
