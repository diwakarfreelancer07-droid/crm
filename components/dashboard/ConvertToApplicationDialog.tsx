"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ConvertToApplicationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    studentName: string;
    onConverted: () => void;
}

export function ConvertToApplicationDialog({
    isOpen,
    onClose,
    studentId,
    studentName,
    onConverted,
}: ConvertToApplicationDialogProps) {
    const [countries, setCountries] = useState<any[]>([]);
    const [isLoadingCountries, setIsLoadingCountries] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        universityName: "",
        courseName: "",
        intake: "",
        countryId: "",
        notes: ""
    });

    useEffect(() => {
        if (isOpen) {
            fetchCountries();
        }
    }, [isOpen]);

    const fetchCountries = async () => {
        setIsLoadingCountries(true);
        try {
            const response = await axios.get("/api/master/countries?status=active");
            setCountries(response.data || []);
        } catch (error) {
            console.error("Failed to load countries", error);
        } finally {
            setIsLoadingCountries(false);
        }
    };

    const handleConvert = async () => {
        if (!formData.universityName || !formData.courseName || !formData.countryId) {
            toast.error("Please fill in university, course, and country");
            return;
        }

        setIsSaving(true);
        try {
            await axios.post("/api/applications", {
                studentId,
                ...formData
            });
            toast.success("Converted to application successfully");
            onConverted();
            onClose();
        } catch (error) {
            console.error("Failed to convert to application", error);
            toast.error("Failed to convert student to application");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Convert to Application</DialogTitle>
                    <DialogDescription>
                        Create a university application for <strong>{studentName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="universityName">University Name</Label>
                        <Input
                            id="universityName"
                            placeholder="e.g. University of Toronto"
                            value={formData.universityName}
                            onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                            className="rounded-xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="courseName">Course Name</Label>
                        <Input
                            id="courseName"
                            placeholder="e.g. Masters in Computer Science"
                            value={formData.courseName}
                            onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                            className="rounded-xl"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="intake">Intake</Label>
                            <Input
                                id="intake"
                                placeholder="e.g. Fall 2026"
                                value={formData.intake}
                                onChange={(e) => setFormData({ ...formData, intake: e.target.value })}
                                className="rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Country</Label>
                            <Select
                                value={formData.countryId}
                                onValueChange={(value) => setFormData({ ...formData, countryId: value })}
                            >
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder={isLoadingCountries ? "Loading..." : "Select Country"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {countries.map((country) => (
                                        <SelectItem key={country.id} value={country.id}>
                                            {country.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Add any additional details..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="rounded-xl min-h-[100px]"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-3 sm:flex-row-reverse">
                    <Button
                        onClick={handleConvert}
                        disabled={isSaving}
                        className="bg-primary hover:bg-primary/90 rounded-xl px-8"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Converting...
                            </>
                        ) : (
                            "Convert to Application"
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isSaving}
                        className="rounded-xl"
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
