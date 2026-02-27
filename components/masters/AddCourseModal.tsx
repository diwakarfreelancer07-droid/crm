"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, X, Trash2 } from "lucide-react";

interface AddCourseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    currentCourse?: any; // If provided, we're in edit mode
}

export function AddCourseModal({
    isOpen,
    onClose,
    onSuccess,
    currentCourse,
}: AddCourseModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [countries, setCountries] = useState<any[]>([]);
    const [universities, setUniversities] = useState<any[]>([]);

    const [formData, setFormData] = useState<any>({
        name: "",
        universityId: "",
        countryId: "",
        campus: "",
        level: "",
        durationMonths: "",
        applicationFee: "",
        tuitionFee: "",
        expectedCommission: "",
        gpaScore: "",
        deadline: "",
        entryRequirements: "",
        scores: [] as any[],
    });

    useEffect(() => {
        fetchCountries();
    }, []);

    useEffect(() => {
        if (isOpen) {
            if (currentCourse) {
                setFormData({
                    ...currentCourse,
                    durationMonths: currentCourse.durationMonths?.toString() || "",
                    gpaScore: currentCourse.gpaScore?.toString() || "",
                    scores: currentCourse.scores || []
                });
                fetchUniversities(currentCourse.countryId);
            } else {
                setFormData({
                    name: "",
                    universityId: "",
                    countryId: "",
                    campus: "",
                    level: "",
                    durationMonths: "",
                    applicationFee: "",
                    tuitionFee: "",
                    expectedCommission: "",
                    gpaScore: "",
                    deadline: "",
                    entryRequirements: "",
                    scores: [],
                });
            }
        }
    }, [isOpen, currentCourse]);

    const fetchCountries = async () => {
        try {
            const res = await axios.get("/api/master/countries");
            setCountries(res.data);
        } catch (error) {
            console.error("Error fetching countries:", error);
        }
    };

    const fetchUniversities = async (countryId: string) => {
        try {
            const res = await axios.get(`/api/master/universities?countryId=${countryId}`);
            setUniversities(res.data.universities || []);
        } catch (error) {
            console.error("Error fetching universities:", error);
        }
    };

    const handleCountryChange = (id: string) => {
        setFormData((prev: any) => ({ ...prev, countryId: id, universityId: "" }));
        fetchUniversities(id);
    };

    const handleAddScore = () => {
        setFormData((prev: any) => ({
            ...prev,
            scores: [...prev.scores, { exam: "IELTS", overall: "", subscores: "" }],
        }));
    };

    const handleRemoveScore = (index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            scores: prev.scores.filter((_: any, i: number) => i !== index),
        }));
    };

    const handleScoreChange = (index: number, field: string, value: string) => {
        const newScores = [...formData.scores];
        newScores[index][field] = value;
        setFormData((prev: any) => ({ ...prev, scores: newScores }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const submissionData = {
                ...formData,
                durationMonths: formData.durationMonths ? parseInt(formData.durationMonths) : null,
                gpaScore: formData.gpaScore ? parseFloat(formData.gpaScore) : null,
            };

            if (currentCourse) {
                await axios.put(`/api/master/courses/${currentCourse.id}`, submissionData);
                toast.success("Course updated successfully");
            } else {
                await axios.post("/api/master/courses", submissionData);
                toast.success("Course added successfully");
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error saving course:", error);
            toast.error(error.response?.data?.message || "Failed to save course");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 rounded-none border-none overflow-hidden max-h-[95vh] flex flex-col">
                <DialogHeader className="p-6 bg-primary text-white shrink-0">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Plus className="w-6 h-6" />
                        {currentCourse ? "Edit Course" : "Add New Course"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Country & University */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Country*</Label>
                                <Select value={formData.countryId} onValueChange={handleCountryChange}>
                                    <SelectTrigger className="rounded-none border-gray-300 h-11">
                                        <SelectValue placeholder="Select Country" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-none">
                                        {countries.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">University*</Label>
                                <Select
                                    value={formData.universityId}
                                    onValueChange={(val) => setFormData((prev: any) => ({ ...prev, universityId: val }))}
                                    disabled={!formData.countryId}
                                >
                                    <SelectTrigger className="rounded-none border-gray-300 h-11">
                                        <SelectValue placeholder="Select University" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-none">
                                        {universities.map((u) => (
                                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Course Name*</Label>
                                <Input
                                    required
                                    className="rounded-none border-gray-300 h-11"
                                    placeholder="e.g. Master of Computer Science"
                                    value={formData.name}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-500 uppercase">Campus</Label>
                                    <Input
                                        className="rounded-none border-gray-300 h-11"
                                        placeholder="e.g. Melbourne"
                                        value={formData.campus}
                                        onChange={(e) => setFormData((prev: any) => ({ ...prev, campus: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-500 uppercase">Level</Label>
                                    <Select value={formData.level} onValueChange={(val) => setFormData((prev: any) => ({ ...prev, level: val }))}>
                                        <SelectTrigger className="rounded-none border-gray-300 h-11">
                                            <SelectValue placeholder="Select Level" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-none">
                                            {["Bachelor", "Master", "PhD", "Diploma", "Certificate", "Associate", "Foundation"].map(l => (
                                                <SelectItem key={l} value={l}>{l}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Fees & Requirements */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-500 uppercase">Duration (Months)</Label>
                                    <Input
                                        type="number"
                                        className="rounded-none border-gray-300 h-11"
                                        placeholder="e.g. 24"
                                        value={formData.durationMonths}
                                        onChange={(e) => setFormData((prev: any) => ({ ...prev, durationMonths: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-500 uppercase">GPA Score</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        className="rounded-none border-gray-300 h-11"
                                        placeholder="e.g. 3.0"
                                        value={formData.gpaScore}
                                        onChange={(e) => setFormData((prev: any) => ({ ...prev, gpaScore: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-500 uppercase">Application Fee</Label>
                                    <Input
                                        className="rounded-none border-gray-300 h-11"
                                        placeholder="e.g. USD 50"
                                        value={formData.applicationFee}
                                        onChange={(e) => setFormData((prev: any) => ({ ...prev, applicationFee: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-gray-500 uppercase">Tuition Fee</Label>
                                    <Input
                                        className="rounded-none border-gray-300 h-11"
                                        placeholder="e.g. USD 22000"
                                        value={formData.tuitionFee}
                                        onChange={(e) => setFormData((prev: any) => ({ ...prev, tuitionFee: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Expected Commission</Label>
                                <Input
                                    className="rounded-none border-gray-300 h-11"
                                    placeholder="e.g. 15% or AUD 2000"
                                    value={formData.expectedCommission}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, expectedCommission: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase">Deadline Info</Label>
                                <Input
                                    className="rounded-none border-gray-300 h-11"
                                    placeholder="e.g. Fall 01 Jun, Spring 01 Nov"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, deadline: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-xs font-bold text-gray-500 uppercase">Scores / Proficiency Requirements</Label>
                        <div className="space-y-3">
                            {formData.scores.map((score: any, index: number) => (
                                <div key={index} className="flex gap-3 items-end p-3 bg-gray-50 border border-gray-200 animate-in fade-in zoom-in-95">
                                    <div className="flex-1 space-y-2">
                                        <Label className="text-[10px]">Exam</Label>
                                        <Select
                                            value={score.exam}
                                            onValueChange={(val) => handleScoreChange(index, "exam", val)}
                                        >
                                            <SelectTrigger className="rounded-none h-9 bg-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-none border-gray-200">
                                                {["IELTS", "TOEFL", "PTE", "GMAT", "GRE", "SAT", "ACT", "Duolingo"].map(ex => (
                                                    <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <Label className="text-[10px]">Overall</Label>
                                        <Input
                                            className="rounded-none h-9 bg-white"
                                            value={score.overall}
                                            onChange={(e) => handleScoreChange(index, "overall", e.target.value)}
                                        />
                                    </div>
                                    <div className="flex-[2] space-y-2">
                                        <Label className="text-[10px]">Subscores / Details</Label>
                                        <Input
                                            className="rounded-none h-9 bg-white"
                                            placeholder="e.g. L:6, R:6, W:6, S:6"
                                            value={score.subscores}
                                            onChange={(e) => handleScoreChange(index, "subscores", e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-red-500 hover:bg-red-50"
                                        onClick={() => handleRemoveScore(index)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full rounded-none border-dashed border-2 hover:bg-primary/5 hover:text-primary hover:border-primary transition-all duration-300"
                                onClick={handleAddScore}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Score Requirement
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase">Entry Requirements</Label>
                        <Textarea
                            className="rounded-none border-gray-300 min-h-[120px]"
                            placeholder="Detailed entry requirements, documents, etc."
                            value={formData.entryRequirements}
                            onChange={(e) => setFormData((prev: any) => ({ ...prev, entryRequirements: e.target.value }))}
                        />
                    </div>
                </form>

                <DialogFooter className="p-6 bg-gray-50 gap-3 shrink-0">
                    <Button variant="outline" className="rounded-none h-11 px-8" onClick={onClose}>Cancel</Button>
                    <Button
                        className="rounded-none h-11 px-10 bg-primary hover:bg-primary/90"
                        disabled={isLoading}
                        onClick={handleSubmit}
                    >
                        {isLoading ? "Saving..." : currentCourse ? "Update Course" : "Create Course"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
