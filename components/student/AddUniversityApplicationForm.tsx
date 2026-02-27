"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
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
import { Loader2, Trash2, Plus, X, Globe, GraduationCap, Calendar, User, Search, ArrowLeft, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useRolePath } from "@/hooks/use-role-path";

interface AddUniversityApplicationFormProps {
    studentId: string;
    studentName: string;
    studentEmail: string;
    studentPhone: string;
    onSuccess?: () => void;
    onCancel?: () => void;
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

export function AddUniversityApplicationForm({
    studentId,
    studentName,
    studentEmail,
    studentPhone,
    onSuccess,
    onCancel,
}: AddUniversityApplicationFormProps) {
    const router = useRouter();
    const { prefixPath } = useRolePath();
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
        fetchMasters();
    }, []);

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

        await fetchUniversities(countryId);
        setSelectedCountryId("");
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
            if (onSuccess) onSuccess();
            else router.push(prefixPath(`/students/${studentId}?tab=applications`));
        } catch (error: any) {
            console.error("Failed to save applications", error);
            toast.error(error.response?.data?.error || "Failed to save applications");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-10">
            {/* Header / Student Info */}
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-card">
                <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold shadow-inner">
                                {studentName.charAt(0).toUpperCase()}
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-2xl font-black tracking-tight text-foreground">{studentName}</h1>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                        <Mail className="w-3.5 h-3.5 opacity-60" /> {studentEmail || "N/A"}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                        <Phone className="w-3.5 h-3.5 opacity-60" /> {studentPhone || "N/A"}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="lg"
                                className="rounded-2xl h-12 px-6 font-bold text-xs uppercase tracking-wider"
                                onClick={() => onCancel ? onCancel() : router.back()}
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Back
                            </Button>
                            <Button
                                size="lg"
                                className="rounded-2xl h-12 px-10 font-black text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                                onClick={handleSave}
                                disabled={isSaving || blocks.length === 0}
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                                Save Applications
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Left Side: Country Picker & Tips */}
                <div className="xl:col-span-1 space-y-6">
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-card">
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 px-1">1. Choose Country</Label>
                                <Select value={selectedCountryId} onValueChange={handleAddCountry}>
                                    <SelectTrigger className="rounded-2xl h-14 bg-muted/30 border-none hover:bg-muted/50 transition-all font-bold text-sm px-5">
                                        <div className="flex items-center gap-3">
                                            <Globe className="h-5 w-5 text-primary" />
                                            <SelectValue placeholder="Add a Country..." />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {countries.map(c => (
                                            <SelectItem key={c.id} value={c.id} disabled={blocks.some(b => b.countryId === c.id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                                <h4 className="text-[11px] font-black text-primary flex items-center gap-2 uppercase tracking-widest">
                                    <Search className="h-3.5 w-3.5" /> Quick Guidelines
                                </h4>
                                <ul className="text-[12px] text-muted-foreground/80 space-y-3 font-medium">
                                    <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" /> Multi-country applications supported.</li>
                                    <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" /> Add multiple universities per country.</li>
                                    <li className="flex gap-2"><div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" /> Assign specific experts to each row.</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content: Application Blocks */}
                <div className="xl:col-span-3 space-y-6">
                    {blocks.length === 0 ? (
                        <Card className="border-2 border-dashed border-muted/50 rounded-[40px] bg-muted/5">
                            <CardContent className="h-[450px] flex flex-col items-center justify-center text-center gap-6 p-10">
                                <div className="w-24 h-24 rounded-[32px] bg-muted/50 flex items-center justify-center">
                                    <Globe className="h-12 w-12 text-muted-foreground/20" />
                                </div>
                                <div className="max-w-xs space-y-2">
                                    <p className="text-xl font-bold text-muted-foreground/60 tracking-tight">Your canvas is empty</p>
                                    <p className="text-sm text-muted-foreground/40 font-medium">Select a country from the sidebar to start building the student's application roadmap.</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-8">
                            {blocks.map(block => (
                                <Card key={block.countryId} className="border-none shadow-sm rounded-[32px] overflow-hidden bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-500">
                                    {/* Block Header */}
                                    <div className="bg-muted/30 p-5 px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                                <Globe className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <span className="font-black text-lg text-foreground tracking-tight uppercase">{block.countryName}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="secondary" className="text-[10px] font-black bg-primary/10 text-primary border-none rounded-lg px-2 py-0.5 uppercase tracking-tighter">
                                                        {block.rows.length} {block.rows.length === 1 ? 'Entry' : 'Entries'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center flex-1 md:max-w-md gap-4">
                                            <Select onValueChange={(val) => handleAddUniversity(block.countryId, val)}>
                                                <SelectTrigger className="h-12 flex-1 rounded-2xl bg-white border-none shadow-sm text-xs font-bold px-5">
                                                    <div className="flex items-center gap-3 text-muted-foreground">
                                                        <Search className="h-4 w-4" />
                                                        <SelectValue placeholder="Add University..." />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl">
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
                                                className="h-10 w-10 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 transition-all rounded-xl"
                                                onClick={() => handleRemoveBlock(block.countryId)}
                                            >
                                                <X className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Block Rows */}
                                    <CardContent className="p-0">
                                        {block.rows.length === 0 ? (
                                            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground/30 gap-3">
                                                <GraduationCap className="w-8 h-8 opacity-20" />
                                                <p className="text-[11px] font-bold uppercase tracking-widest">No Universities Added</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-muted/30">
                                                {block.rows.map(row => (
                                                    <div key={row.tempId} className="p-8 space-y-6 hover:bg-muted/5 transition-all duration-300">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                                                                    <GraduationCap className="h-4 w-4 text-primary" />
                                                                </div>
                                                                <span className="font-black text-sm tracking-tight text-foreground/80">{row.universityName}</span>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5 rounded-lg"
                                                                onClick={() => removeRow(block.countryId, row.tempId)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-end">
                                                            <div className="lg:col-span-5 space-y-2.5">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Course Name *</Label>
                                                                <Input
                                                                    value={row.courseName}
                                                                    onChange={(e) => updateRow(block.countryId, row.tempId, { courseName: e.target.value })}
                                                                    placeholder="e.g. MSc International Business"
                                                                    className="h-12 text-sm rounded-2xl bg-muted/20 border-none focus-visible:ring-primary/20 placeholder:text-muted-foreground/30 font-semibold px-5"
                                                                />
                                                            </div>
                                                            <div className="lg:col-span-2 space-y-2.5">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Intake</Label>
                                                                <Input
                                                                    value={row.intake}
                                                                    onChange={(e) => updateRow(block.countryId, row.tempId, { intake: e.target.value })}
                                                                    placeholder="Sep 2025"
                                                                    className="h-12 text-sm rounded-2xl bg-muted/20 border-none focus-visible:ring-primary/20 font-semibold px-5"
                                                                />
                                                            </div>
                                                            <div className="lg:col-span-2 space-y-2.5">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Deadline</Label>
                                                                <Input
                                                                    type="date"
                                                                    value={row.deadlineDate}
                                                                    onChange={(e) => updateRow(block.countryId, row.tempId, { deadlineDate: e.target.value })}
                                                                    className="h-12 text-sm rounded-2xl bg-muted/20 border-none focus-visible:ring-primary/20 font-semibold px-5"
                                                                />
                                                            </div>
                                                            <div className="lg:col-span-3 space-y-2.5">
                                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Expert</Label>
                                                                <Select
                                                                    value={row.associateId}
                                                                    onValueChange={(val) => updateRow(block.countryId, row.tempId, { associateId: val })}
                                                                >
                                                                    <SelectTrigger className="h-12 text-sm rounded-2xl bg-muted/20 border-none px-5 font-semibold">
                                                                        <SelectValue placeholder="Assign Expert" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="rounded-2xl">
                                                                        {associates.map(a => (
                                                                            <SelectItem key={a.id} value={a.id}>
                                                                                <div className="flex flex-col">
                                                                                    <span className="font-bold text-xs">{a.name}</span>
                                                                                    <span className="text-[9px] text-muted-foreground uppercase font-black opacity-50 tracking-tighter">{a.role}</span>
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
                </div>
            </div>

            {/* Sticky Actions Bar for Mobile/Tablet */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg md:hidden z-50">
                <Button
                    size="lg"
                    className="w-full rounded-2xl h-14 font-black uppercase tracking-widest bg-primary shadow-2xl shadow-primary/40 text-white"
                    onClick={handleSave}
                    disabled={isSaving || blocks.length === 0}
                >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                    Save All Applications
                </Button>
            </div>
        </div>
    );
}
