"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Trash2, Plus, X, Globe, GraduationCap, Calendar, User, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface AddUniversityApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    studentName: string;
    studentEmail: string;
    studentPhone: string;
    onSuccess: () => void;
}

interface MasterData {
    id: string;
    name: string;
    [key: string]: any;
}

interface ApplicationRow {
    tempId: string;
    universityId: string;
    universityName: string;
    courseId: string;
    courseName: string;
    intake: string;
    deadlineDate: string;
    associateId: string;
}

interface CountryBlock {
    countryId: string;
    countryName: string;
    rows: ApplicationRow[];
}

export function AddUniversityApplicationModal({
    isOpen,
    onClose,
    studentId,
    studentName,
    studentEmail,
    studentPhone,
    onSuccess,
}: AddUniversityApplicationModalProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [countries, setCountries] = useState<MasterData[]>([]);
    const [associates, setAssociates] = useState<MasterData[]>([]);
    const [loadingMasters, setLoadingMasters] = useState(false);

    // Form State
    const [blocks, setBlocks] = useState<CountryBlock[]>([]);
    const [selectedCountryId, setSelectedCountryId] = useState<string>("");

    // Cache for Universities to avoid redundant fetches
    const [universitiesCache, setUniversitiesCache] = useState<Record<string, MasterData[]>>({});

    useEffect(() => {
        if (isOpen) {
            fetchMasters();
        } else {
            // Reset on close
            setBlocks([]);
            setSelectedCountryId("");
        }
    }, [isOpen]);

    const fetchMasters = async () => {
        setLoadingMasters(true);
        try {
            const [countriesRes, associatesRes] = await Promise.all([
                axios.get("/api/master/countries"),
                axios.get("/api/master/associates")
            ]);
            setCountries(countriesRes.data || []);
            setAssociates(associatesRes.data || []);
        } catch (error) {
            console.error("Failed to load master data", error);
            toast.error("Failed to load dropdown data");
        } finally {
            setLoadingMasters(false);
        }
    };

    const fetchUniversities = async (countryId: string) => {
        if (universitiesCache[countryId]) return universitiesCache[countryId];
        try {
            // Fetch with a larger limit to ensure we get most universities for the dropdown
            const res = await axios.get(`/api/master/universities?countryId=${countryId}&limit=100`);
            const data = Array.isArray(res.data) ? res.data : (res.data.universities || []);
            setUniversitiesCache(prev => ({ ...prev, [countryId]: data }));
            return data;
        } catch (error) {
            console.error("Failed to load universities", error);
            return [];
        }
    };

    const handleAddCountry = async (countryId: string) => {
        if (!countryId) return;
        if (blocks.find(b => b.countryId === countryId)) {
            toast.error("Country already added");
            return;
        }

        const country = countries.find(c => c.id === countryId);
        if (!country) return;

        setBlocks(prev => [...prev, {
            countryId,
            countryName: country.name,
            rows: []
        }]);

        // Pre-fetch universities for this country
        await fetchUniversities(countryId);
        setSelectedCountryId(""); // Reset search
    };

    const handleRemoveBlock = (countryId: string) => {
        setBlocks(prev => prev.filter(b => b.countryId !== countryId));
    };

    const handleAddUniversity = async (countryId: string, universityId: string) => {
        const universities = universitiesCache[countryId] || [];
        const university = universities.find(u => u.id === universityId);
        if (!university) return;

        setBlocks(prev => prev.map(block => {
            if (block.countryId === countryId) {
                // Check if already in this block
                if (block.rows.find(r => r.universityId === universityId)) {
                    toast.error("University already added in this country block");
                    return block;
                }
                return {
                    ...block,
                    rows: [...block.rows, {
                        tempId: Math.random().toString(36).substr(2, 9),
                        universityId,
                        universityName: university.name,
                        courseId: "",
                        courseName: "",
                        intake: "",
                        deadlineDate: "",
                        associateId: ""
                    }]
                };
            }
            return block;
        }));
    };

    const updateRow = (countryId: string, tempId: string, data: Partial<ApplicationRow>) => {
        setBlocks(prev => prev.map(block => {
            if (block.countryId === countryId) {
                return {
                    ...block,
                    rows: block.rows.map(row => row.tempId === tempId ? { ...row, ...data } : row)
                };
            }
            return block;
        }));
    };

    const removeRow = (countryId: string, tempId: string) => {
        setBlocks(prev => prev.map(block => {
            if (block.countryId === countryId) {
                return {
                    ...block,
                    rows: block.rows.filter(row => row.tempId !== tempId)
                };
            }
            return block;
        }));
    };

    const handleSave = async () => {
        const allRows = blocks.flatMap(b => b.rows);
        if (allRows.length === 0) {
            toast.error("Please add at least one university application");
            return;
        }

        // Basic Validation
        const invalidRow = allRows.find(r => !r.universityId || !r.courseName);
        if (invalidRow) {
            toast.error("Please enter a course name for all universities");
            return;
        }

        setIsSaving(true);
        try {
            await axios.post("/api/applications", {
                studentId,
                applications: allRows.map(r => ({
                    countryId: blocks.find(b => b.rows.includes(r))?.countryId,
                    universityId: r.universityId,
                    courseId: r.courseId || null,
                    courseName: r.courseName,
                    intake: r.intake,
                    deadlineDate: r.deadlineDate,
                    associateId: r.associateId
                }))
            });

            toast.success("Applications saved successfully!");
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Failed to save applications", error);
            toast.error(error.response?.data?.error || "Failed to save applications");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCloseWithCheck = () => {
        const hasData = blocks.some(b => b.rows.length > 0);
        if (hasData) {
            if (confirm("You have unsaved changes. Are you sure you want to close?")) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseWithCheck()}>
            <DialogContent className="max-w-[1700px] w-[98vw] h-[98vh] flex flex-col p-0 overflow-hidden rounded-none border-none shadow-2xl bg-white focus:outline-none">
                <DialogHeader className="p-8 pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-bold tracking-tight">Add University Application</DialogTitle>
                            <DialogDescription className="text-sm font-medium">Create multiple university applications for this student at once.</DialogDescription>
                        </div>
                    </div>

                    {/* Student Info Bar */}
                    <div className="mt-4 p-5 rounded-none bg-muted/30 border border-border/50 flex flex-wrap items-center gap-x-12 gap-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-none bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase">
                                {studentName.charAt(0)}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-60">Student Name</p>
                                <p className="text-base font-bold text-foreground">{studentName}</p>
                            </div>
                        </div>
                        <Separator orientation="vertical" className="h-8 hidden md:block" />
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Email Address</p>
                            <p className="text-sm font-semibold">{studentEmail || "N/A"}</p>
                        </div>
                        <Separator orientation="vertical" className="h-8 hidden md:block" />
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Phone Number</p>
                            <p className="text-sm font-semibold">{studentPhone || "N/A"}</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-10 gap-12 grid grid-cols-1 xl:grid-cols-7 bg-slate-50/20">
                    {/* Left Panel: Country Selection */}
                    <div className="xl:col-span-1 space-y-8">
                        <div className="space-y-4">
                            <Label className="text-[12px] font-black uppercase tracking-[0.25em] text-muted-foreground opacity-60">1. Country Selection</Label>
                            <Select value={selectedCountryId} onValueChange={handleAddCountry}>
                                <SelectTrigger className="rounded-none h-16 bg-white border-2 border-slate-200 hover:border-primary transition-all shadow-sm text-sm">
                                    <div className="flex items-center gap-4">
                                        <Globe className="h-6 w-6 text-primary" />
                                        <SelectValue placeholder="Add Country..." />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-none">
                                    {countries.map(c => (
                                        <SelectItem key={c.id} value={c.id} disabled={blocks.some(b => b.countryId === c.id)}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="p-4 rounded-none bg-primary/5 border border-primary/10 space-y-3">
                            <h4 className="text-[10px] font-bold text-primary flex items-center gap-2 uppercase tracking-widest">
                                <Search className="h-3 w-3" /> Quick Tips
                            </h4>
                            <ul className="text-[11px] text-muted-foreground space-y-2 list-disc pl-3">
                                <li>You can add multiple country blocks.</li>
                                <li>Select multiple universities under one country.</li>
                                <li>Associate is shared across the row.</li>
                            </ul>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full rounded-none border-dashed h-12 text-[10px] font-bold uppercase tracking-wider"
                            onClick={() => toast.info("Course Finder integration coming soon!")}
                        >
                            <Plus className="h-3.5 w-3.5 mr-2" />
                            Apply via Course Finder
                        </Button>
                    </div>

                    {/* Main Content Area */}
                    <div className="xl:col-span-6 flex flex-col gap-8 overflow-hidden h-full">
                        <ScrollArea className="flex-1 pr-4">
                            {blocks.length === 0 ? (
                                <div className="h-[400px] border-2 border-dashed rounded-none flex flex-col items-center justify-center text-muted-foreground/30 gap-4 bg-muted/5">
                                    <Globe className="h-20 w-20 opacity-10" />
                                    <p className="text-sm font-bold uppercase tracking-widest opacity-40">Start by selecting a country</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {blocks.map(block => (
                                        <Card key={block.countryId} className="border-2 border-slate-100 rounded-none overflow-visible shadow-sm hover:border-primary/40 transition-all bg-white mb-8">
                                            <div className="bg-slate-50 p-4 px-6 flex items-center justify-between border-b-2 border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <Globe className="h-5 w-5 text-primary" />
                                                    <span className="font-bold text-lg text-slate-800 uppercase tracking-tight">{block.countryName}</span>
                                                    <Badge variant="secondary" className="text-[11px] bg-primary/10 text-primary border-none rounded-none px-2 py-0.5">{block.rows.length} Applications</Badge>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <Select onValueChange={(val) => handleAddUniversity(block.countryId, val)}>
                                                        <SelectTrigger className="h-12 min-w-[400px] rounded-none bg-white border-2 border-slate-200 shadow-sm text-sm font-bold focus:ring-0">
                                                            <div className="flex items-center gap-3 text-muted-foreground">
                                                                <Search className="h-5 w-5" />
                                                                <SelectValue placeholder="Search & Add University to this country block..." />
                                                            </div>
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-none">
                                                            {Array.isArray(universitiesCache[block.countryId]) && universitiesCache[block.countryId].map(u => (
                                                                <SelectItem key={u.id} value={u.id}>
                                                                    {u.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                                                        onClick={() => handleRemoveBlock(block.countryId)}
                                                    >
                                                        <X className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <CardContent className="p-0">
                                                {block.rows.length === 0 ? (
                                                    <p className="text-center py-6 text-xs text-muted-foreground italic">No universities added yet.</p>
                                                ) : (
                                                    <div className="divide-y divide-border/30">
                                                        {block.rows.map(row => (
                                                            <div key={row.tempId} className="p-4 space-y-4 hover:bg-muted/10 transition-colors">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <GraduationCap className="h-4 w-4 text-primary" />
                                                                        <span className="font-bold text-sm">{row.universityName}</span>
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                                        onClick={() => removeRow(block.countryId, row.tempId)}
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6 items-end">
                                                                    <div className="xl:col-span-5 space-y-2.5">
                                                                        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Requested Course*</Label>
                                                                        <Input
                                                                            value={row.courseName}
                                                                            onChange={(e) => updateRow(block.countryId, row.tempId, { courseName: e.target.value })}
                                                                            placeholder="Which course should they apply for?"
                                                                            className="h-12 text-sm rounded-none bg-slate-50/50 border-slate-200 focus-visible:ring-primary/20 placeholder:opacity-50"
                                                                        />
                                                                    </div>
                                                                    <div className="xl:col-span-2 space-y-2.5">
                                                                        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Intake / Session</Label>
                                                                        <Input
                                                                            value={row.intake}
                                                                            onChange={(e) => updateRow(block.countryId, row.tempId, { intake: e.target.value })}
                                                                            placeholder="e.g. Sep 2025"
                                                                            className="h-12 text-sm rounded-none bg-slate-50/50 border-slate-200 focus-visible:ring-primary/20 placeholder:opacity-50"
                                                                        />
                                                                    </div>
                                                                    <div className="xl:col-span-2 space-y-2.5">
                                                                        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Deadline</Label>
                                                                        <Input
                                                                            type="date"
                                                                            value={row.deadlineDate}
                                                                            onChange={(e) => updateRow(block.countryId, row.tempId, { deadlineDate: e.target.value })}
                                                                            className="h-12 text-sm rounded-none bg-slate-50/50 border-slate-200"
                                                                        />
                                                                    </div>
                                                                    <div className="xl:col-span-3 space-y-2.5">
                                                                        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Assigned Expert</Label>
                                                                        <Select
                                                                            value={row.associateId}
                                                                            onValueChange={(val) => updateRow(block.countryId, row.tempId, { associateId: val })}
                                                                        >
                                                                            <SelectTrigger className="h-12 text-sm rounded-none bg-slate-50/50 border-slate-200">
                                                                                <SelectValue placeholder="Assign an Associate" />
                                                                            </SelectTrigger>
                                                                            <SelectContent className="rounded-none">
                                                                                {associates.map(a => (
                                                                                    <SelectItem key={a.id} value={a.id}>
                                                                                        <div className="flex flex-col">
                                                                                            <span className="font-semibold">{a.name}</span>
                                                                                            <span className="text-[10px] text-muted-foreground uppercase opacity-60 tracking-tighter">{a.role}</span>
                                                                                        </div>
                                                                                    </SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-2 border-t border-border/50 bg-muted/20 flex items-center justify-between sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="link"
                            className="text-xs text-muted-foreground hover:text-primary transition-colors italic"
                            onClick={() => {
                                if (confirm("Reset the entire form?")) {
                                    setBlocks([]);
                                    setUniversitiesCache({});
                                }
                            }}
                        >
                            Reset Form
                        </Button>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={handleCloseWithCheck}
                            disabled={isSaving}
                            className="rounded-none px-8 h-12 text-[10px] font-bold uppercase tracking-wider"
                        >
                            Close
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || blocks.length === 0}
                            className="bg-primary hover:bg-primary/90 text-white rounded-none px-10 h-12 text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-primary/10"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving Applications...
                                </>
                            ) : (
                                "Save Applications"
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
