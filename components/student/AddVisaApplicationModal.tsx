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
import { Loader2, Calendar, Globe, GraduationCap, School, User, Info } from "lucide-react";
import { VisaType, VisaStatus } from "@prisma/client";
import { useCreateVisaApplication } from "@/hooks/useApi";

interface AddVisaApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    studentName: string;
    onSuccess: () => void;
    initialApplicationId?: string;
}

interface MasterData {
    id: string;
    name: string;
}

export function AddVisaApplicationModal({
    isOpen,
    onClose,
    studentId,
    studentName,
    onSuccess,
    initialApplicationId,
}: AddVisaApplicationModalProps) {
    const createMutation = useCreateVisaApplication();
    const [isLoadingMasters, setIsLoadingMasters] = useState(false);

    // Master Data
    const [countries, setCountries] = useState<MasterData[]>([]);
    const [universities, setUniversities] = useState<MasterData[]>([]);
    const [courses, setCourses] = useState<MasterData[]>([]);
    const [officers, setOfficers] = useState<any[]>([]);
    const [universityApplications, setUniversityApplications] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        countryId: "",
        universityId: "",
        courseId: "",
        intake: "",
        visaType: VisaType.STUDENT_VISA as string,
        applicationDate: new Date().toISOString().split('T')[0],
        appointmentDate: "",
        assignedOfficerId: "",
        universityApplicationId: "",
        remarks: "",
        status: VisaStatus.PENDING as string,
    });

    useEffect(() => {
        if (isOpen) {
            fetchMasters();
            fetchStudentApplications();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && initialApplicationId && universityApplications.length > 0) {
            handleUniAppChange(initialApplicationId);
        }
    }, [isOpen, initialApplicationId, universityApplications]);

    const fetchMasters = async () => {
        setIsLoadingMasters(true);
        try {
            const [countriesRes, officersRes] = await Promise.all([
                axios.get("/api/master/countries"),
                axios.get("/api/employees?role=SUPPORT_AGENT&limit=100") // Assuming Support Agents handle Visas
            ]);
            setCountries(countriesRes.data || []);
            setOfficers(officersRes.data.employees || []);
        } catch (error) {
            console.error("Failed to load master data", error);
            toast.error("Failed to load dropdown data");
        } finally {
            setIsLoadingMasters(false);
        }
    };

    const fetchStudentApplications = async () => {
        try {
            const res = await axios.get(`/api/applications?studentId=${studentId}&limit=50`);
            setUniversityApplications(res.data.applications || []);
        } catch (error) {
            console.error("Failed to fetch university applications", error);
        }
    };

    const fetchUniversities = async (countryId: string) => {
        try {
            const res = await axios.get(`/api/master/universities?countryId=${countryId}&limit=100`);
            const data = Array.isArray(res.data) ? res.data : (res.data.universities || []);
            setUniversities(data);
        } catch (error) {
            console.error("Failed to fetch universities", error);
        }
    };

    const handleCountryChange = (val: string) => {
        setFormData(prev => ({ ...prev, countryId: val, universityId: "", courseId: "" }));
        fetchUniversities(val);
    };

    const handleUniAppChange = (val: string) => {
        const app = universityApplications.find(a => a.id === val);
        if (app) {
            setFormData(prev => ({
                ...prev,
                universityApplicationId: val,
                countryId: app.countryId,
                universityId: app.universityId || "",
                courseId: app.courseId || "",
                intake: app.intake || "",
            }));
            if (app.countryId) fetchUniversities(app.countryId);
        }
    };

    const handleSave = async () => {
        if (!formData.countryId || !formData.visaType) {
            toast.error("Please fill required fields (Country, Visa Type)");
            return;
        }

        try {
            await createMutation.mutateAsync({
                ...formData,
                studentId,
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to create visa application", error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10">
                    <DialogTitle className="text-xl font-bold">New Visa Application</DialogTitle>
                    <DialogDescription>Add a visa application for {studentName}</DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Link to University Application */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Info className="h-3 w-3" /> Link to University Application (Optional)
                        </Label>
                        <Select value={formData.universityApplicationId} onValueChange={handleUniAppChange}>
                            <SelectTrigger className="rounded-xl h-11">
                                <SelectValue placeholder="Select an application..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {universityApplications.map(app => (
                                    <SelectItem key={app.id} value={app.id}>
                                        {app.university?.name} - {app.courseName || "General"} ({app.intake})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Visa Type*</Label>
                            <Select
                                value={formData.visaType}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, visaType: val }))}
                            >
                                <SelectTrigger className="rounded-xl h-11">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value={VisaType.STUDENT_VISA}>Student Visa</SelectItem>
                                    <SelectItem value={VisaType.DEPENDENT_VISA}>Dependent Visa</SelectItem>
                                    <SelectItem value={VisaType.WORK_VISA}>Work Visa</SelectItem>
                                    <SelectItem value={VisaType.TOURIST_VISA}>Tourist Visa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Country*</Label>
                            <Select value={formData.countryId} onValueChange={handleCountryChange}>
                                <SelectTrigger className="rounded-xl h-11">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-primary" />
                                        <SelectValue placeholder="Select country" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {countries.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">University (Optional)</Label>
                            <Select
                                value={formData.universityId}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, universityId: val }))}
                                disabled={!formData.countryId}
                            >
                                <SelectTrigger className="rounded-xl h-11">
                                    <div className="flex items-center gap-2 text-sm">
                                        <School className="h-4 w-4 text-primary" />
                                        <SelectValue placeholder="Select university" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {universities.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Intake</Label>
                            <Input
                                value={formData.intake}
                                onChange={(e) => setFormData(prev => ({ ...prev, intake: e.target.value }))}
                                className="rounded-xl h-11"
                                placeholder="e.g. Sep 2025"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Application Date</Label>
                            <Input
                                type="date"
                                value={formData.applicationDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, applicationDate: e.target.value }))}
                                className="rounded-xl h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Appointment Date</Label>
                            <Input
                                type="date"
                                value={formData.appointmentDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                                className="rounded-xl h-11"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Assigned Visa Officer</Label>
                        <Select
                            value={formData.assignedOfficerId}
                            onValueChange={(val) => setFormData(prev => ({ ...prev, assignedOfficerId: val }))}
                        >
                            <SelectTrigger className="rounded-xl h-11">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" />
                                    <SelectValue placeholder="Select officer" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {officers.map(o => (
                                    <SelectItem key={o.id} value={o.id}>
                                        {o.name} ({o.role})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Remarks</Label>
                        <Textarea
                            value={formData.remarks}
                            onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                            className="rounded-xl min-h-[80px]"
                            placeholder="Add any notes here..."
                        />
                    </div>
                </div>

                <DialogFooter className="p-6 bg-muted/20 border-t border-primary/10 flex items-center justify-end gap-3">
                    <Button variant="outline" onClick={onClose} className="rounded-xl h-11 px-6">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={createMutation.isPending}
                        className="rounded-xl h-11 px-8 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20"
                    >
                        {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Create Visa Application
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
