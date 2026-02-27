"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useRolePath } from "@/hooks/use-role-path";
import {
    User,
    Mail,
    Smartphone,
    Calendar as CalendarIcon,
    MapPin,
    Users,
    GraduationCap,
    BookOpen,
    ClipboardList,
    Globe,
    Clock,
    Briefcase,
    Save,
    ArrowLeft,
    Phone,
    MessageSquare,
    Info,
    Flag,
    ShieldCheck,
    Trash2,
    Plus,
    Star,
    Loader2
} from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { PhoneInput } from "@/components/ui/phone-input";
import { DatePicker } from "@/components/ui/date-picker";
import { LeadStatus } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().optional().or(z.literal("")),
    email: z.string().email("Invalid email").min(1, "Email is required"),
    phone: z.string().min(10, "Mobile number is required"),
    alternateNo: z.string().optional().or(z.literal("")),
    dateOfBirth: z.string().optional().or(z.literal("")),
    gender: z.string().optional().or(z.literal("")),
    nationality: z.string().optional().or(z.literal("")),
    maritalStatus: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    highestQualification: z.string().optional().or(z.literal("")),
    interestedCourse: z.string().optional().or(z.literal("")),
    testName: z.string().optional().or(z.literal("")),
    testScore: z.string().optional().or(z.literal("")),
    interestedCountry: z.string().optional().or(z.literal("")),
    intake: z.string().optional().or(z.literal("")),
    applyLevel: z.string().optional().or(z.literal("")),
    source: z.string().min(1, "Source is required"),
    status: z.nativeEnum(LeadStatus).default(LeadStatus.NEW),
    remark: z.string().optional().or(z.literal("")),
    passportNo: z.string().optional().or(z.literal("")),
    passportIssueDate: z.string().optional().or(z.literal("")),
    passportExpiryDate: z.string().optional().or(z.literal("")),
    followUp: z.object({
        date: z.string().optional().or(z.literal("")),
        time: z.string().optional().or(z.literal("")),
        remark: z.string().optional().or(z.literal("")),
    }).optional(),
    appointment: z.object({
        date: z.string().optional().or(z.literal("")),
        time: z.string().optional().or(z.literal("")),
        remark: z.string().optional().or(z.literal("")),
    }).optional(),
    academicDetails: z.array(z.object({
        qualification: z.string().min(1, "Qualification is required"),
        stream: z.string().optional().or(z.literal("")),
        institution: z.string().optional().or(z.literal("")),
        percentage: z.string().optional().or(z.literal("")),
        backlogs: z.string().optional().or(z.literal("")),
        passingYear: z.string().optional().or(z.literal("")),
    })).default([]),
    proficiencyExams: z.array(z.object({
        testName: z.string(),
        listening: z.string().optional().or(z.literal("")),
        reading: z.string().optional().or(z.literal("")),
        writing: z.string().optional().or(z.literal("")),
        speaking: z.string().optional().or(z.literal("")),
        overall: z.string().optional().or(z.literal("")),
    })).default([]),
    workExperience: z.array(z.object({
        companyName: z.string().min(1, "Company name is required"),
        position: z.string().optional().or(z.literal("")),
        startDate: z.string().optional().or(z.literal("")),
        endDate: z.string().optional().or(z.literal("")),
        totalExperience: z.string().optional().or(z.literal("")),
    })).default([]),
});

type FormData = z.infer<typeof formSchema>;

const iconicInputClass = "pl-10 h-10 rounded-lg bg-muted/50 border-border focus:bg-background transition-all text-sm";
const cardClass = "border border-border shadow-sm rounded-xl overflow-hidden bg-card";

function ErrorMessage({ field }: { field: any }) {
    if (!field.state.meta.isTouched || !field.state.meta.errors.length) return null
    return (
        <p className="text-xs text-red-500 mt-1 ml-1">
            {field.state.meta.errors.map((e: any) => (typeof e === 'object' ? e.message : e)).join(', ')}
        </p>
    )
}

export default function EditStudentPage() {
    const params = useParams();
    const router = useRouter();
    const { prefixPath } = useRolePath();
    const [websites, setWebsites] = useState<{ id: string; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [studentLeadId, setStudentLeadId] = useState<string | null>(null);

    const form = useForm({
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            alternateNo: "",
            dateOfBirth: "",
            gender: "",
            nationality: "India",
            maritalStatus: "",
            address: "",
            highestQualification: "",
            interestedCourse: "",
            testName: "",
            testScore: "",
            interestedCountry: "",
            intake: "",
            applyLevel: "",
            source: "",
            status: LeadStatus.NEW,
            remark: "",
            passportNo: "",
            passportIssueDate: "",
            passportExpiryDate: "",
            followUp: { date: "", time: "", remark: "" },
            appointment: { date: "", time: "", remark: "" },
            academicDetails: [],
            proficiencyExams: [],
            workExperience: [],
        } as FormData,
        // @ts-ignore
        validatorAdapter: zodValidator(),
        validators: {
            onChange: formSchema as any,
        },
        onSubmit: async ({ value }) => {
            try {
                const payload = {
                    ...value,
                    dateOfBirth: value.dateOfBirth ? new Date(value.dateOfBirth) : null,
                    passportIssueDate: value.passportIssueDate ? new Date(value.passportIssueDate) : null,
                    passportExpiryDate: value.passportExpiryDate ? new Date(value.passportExpiryDate) : null,
                    // Handle academicDetails and workExperience replacement if needed
                    // For now, let's just send the arrays and hope the backend handles them or we update it
                    academicDetails: value.academicDetails.map(d => ({
                        qualification: d.qualification,
                        stream: d.stream,
                        institution: d.institution,
                        percentage: d.percentage,
                        backlogs: d.backlogs,
                        passingYear: d.passingYear
                    })),
                    workExperience: value.workExperience.map(e => ({
                        companyName: e.companyName,
                        position: e.position,
                        startDate: e.startDate,
                        endDate: e.endDate,
                        totalExperience: e.totalExperience
                    }))
                };

                // Update the Lead if it exists
                if (studentLeadId) {
                    await axios.patch(`/api/leads/${studentLeadId}`, payload);
                }

                // Also update the Student (primarily for status, name, phone, email sync)
                await axios.patch(`/api/students/${params.id}`, {
                    name: `${value.firstName} ${value.lastName}`.trim(),
                    email: value.email,
                    phone: value.phone,
                    status: value.status
                });

                toast.success("Student updated successfully");
                router.push(prefixPath(`/students/${params.id}`));
            } catch (error: any) {
                toast.error(error.response?.data?.message || error.response?.data?.error || "Failed to update student");
            }
        },
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentRes, websitesRes] = await Promise.all([
                    axios.get(`/api/students/${params.id}`),
                    axios.get("/api/websites")
                ]);

                setWebsites(websitesRes.data);
                const student = studentRes.data;
                const lead = student.lead;

                if (lead) {
                    setStudentLeadId(lead.id);

                    // Reset form with lead data
                    form.setFieldValue("firstName", lead.firstName || "");
                    form.setFieldValue("lastName", lead.lastName || "");
                    form.setFieldValue("email", lead.email || student.email || "");
                    form.setFieldValue("phone", lead.phone || student.phone || "");
                    form.setFieldValue("alternateNo", lead.alternateNo || "");
                    form.setFieldValue("dateOfBirth", lead.dateOfBirth ? new Date(lead.dateOfBirth).toISOString().split('T')[0] : "");
                    form.setFieldValue("gender", lead.gender || "");
                    form.setFieldValue("nationality", lead.nationality || "India");
                    form.setFieldValue("maritalStatus", lead.maritalStatus || "");
                    form.setFieldValue("address", lead.address || "");
                    form.setFieldValue("highestQualification", lead.highestQualification || "");
                    form.setFieldValue("interestedCourse", lead.interestedCourse || "");
                    form.setFieldValue("testName", lead.testName || "");
                    form.setFieldValue("testScore", lead.testScore || "");
                    form.setFieldValue("interestedCountry", lead.interestedCountry || "");
                    form.setFieldValue("intake", lead.intake || "");
                    form.setFieldValue("applyLevel", lead.applyLevel || "");
                    form.setFieldValue("source", lead.source || "");
                    form.setFieldValue("status", lead.status || student.status || LeadStatus.NEW);
                    form.setFieldValue("remark", lead.remark || "");
                    form.setFieldValue("passportNo", lead.passportNo || student.passportNo || "");
                    form.setFieldValue("passportIssueDate", (lead.passportIssueDate || student.passportIssueDate) ? new Date(lead.passportIssueDate || student.passportIssueDate).toISOString().split('T')[0] : "");
                    form.setFieldValue("passportExpiryDate", (lead.passportExpiryDate || student.passportExpiryDate) ? new Date(lead.passportExpiryDate || student.passportExpiryDate).toISOString().split('T')[0] : "");

                    form.setFieldValue("academicDetails", lead.academicDetails || []);
                    form.setFieldValue("proficiencyExams", lead.proficiencyExams || []);
                    form.setFieldValue("workExperience", lead.workExperience || []);
                } else {
                    // Minimal population if no lead (should not happen for most students)
                    form.setFieldValue("firstName", student.name.split(' ')[0]);
                    form.setFieldValue("lastName", student.name.split(' ').slice(1).join(' '));
                    form.setFieldValue("email", student.email || "");
                    form.setFieldValue("phone", student.phone || "");
                    form.setFieldValue("status", student.status || LeadStatus.NEW);
                }
            } catch (error) {
                console.error("Failed to load data", error);
                toast.error("Failed to load student data");
                router.push(prefixPath("/students"));
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [params.id]);

    const proficiencyOptions = ["IELTS", "TOEFL", "PTE", "GRE", "GMAT", "SAT", "Duolingo", "CELPIP", "Others"];

    if (isLoading) {
        return (
            <div className="p-8 space-y-6">
                <Skeleton className="h-12 w-64 rounded-xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-64 rounded-2xl" />
                    <Skeleton className="h-64 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Smooth Top Header */}
            <div className="bg-card border-b border-border px-8 py-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl h-10 w-10 hover:bg-muted"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">Edit Student</h1>
                            <p className="text-sm text-muted-foreground font-medium">Update student profile, academic history, and preferences</p>
                        </div>
                    </div>
                </div>
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
                className="max-w-7xl mx-auto px-8 mt-4 space-y-4"
            >
                <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 h-16 bg-card border border-border rounded-2xl p-1 gap-2 sticky top-[72px] z-10 shadow-sm">
                        <TabsTrigger value="personal" className="rounded-xl data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all text-muted-foreground font-bold flex items-center gap-2">
                            <User className="h-4 w-4" /> Personal Details
                        </TabsTrigger>
                        <TabsTrigger value="academic" className="rounded-xl data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all text-muted-foreground font-bold flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" /> Academic Details
                        </TabsTrigger>
                        <TabsTrigger value="proficiency" className="rounded-xl data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all text-muted-foreground font-bold flex items-center gap-2">
                            <ClipboardList className="h-4 w-4" /> Proficiency Test
                        </TabsTrigger>
                        <TabsTrigger value="work" className="rounded-xl data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all text-muted-foreground font-bold flex items-center gap-2">
                            <Briefcase className="h-4 w-4" /> Work Experience
                        </TabsTrigger>
                    </TabsList>

                    <div className="space-y-4 mt-3 pb-20">
                        {/* Main Content Areas */}
                        <div className="space-y-4">
                            <TabsContent value="personal" className="m-0 space-y-4">
                                {/* Basic Information */}
                                <Card className={cardClass}>
                                    <CardHeader className="border-b border-border py-2 px-4">
                                        <h2 className="text-foreground font-bold text-base">Personal Information</h2>
                                    </CardHeader>
                                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        <form.Field name="firstName" children={(field) => (
                                            <div className="space-y-1">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">First Name <span className="text-red-500">*</span></Label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input className={iconicInputClass} placeholder="First Name" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} />
                                                </div>
                                                <ErrorMessage field={field} />
                                            </div>
                                        )} />
                                        <form.Field name="lastName" children={(field) => (
                                            <div className="space-y-1">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Last Name</Label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input className={iconicInputClass} placeholder="Last Name" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} />
                                                </div>
                                                <ErrorMessage field={field} />
                                            </div>
                                        )} />
                                        <form.Field name="email" children={(field) => (
                                            <div className="space-y-1">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Email <span className="text-red-500">*</span></Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input className={iconicInputClass} placeholder="Email address" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} />
                                                </div>
                                                <ErrorMessage field={field} />
                                            </div>
                                        )} />
                                        <form.Field name="phone" children={(field) => (
                                            <div className="space-y-1">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Mobile <span className="text-red-500">*</span></Label>
                                                <PhoneInput value={field.state.value} onBlur={field.handleBlur} onChange={field.handleChange} className="rounded-xl h-11" />
                                                <ErrorMessage field={field} />
                                            </div>
                                        )} />
                                        <form.Field name="dateOfBirth" children={(field) => (
                                            <div className="space-y-1">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Date of Birth</Label>
                                                <DatePicker
                                                    value={field.state.value}
                                                    onChange={(val) => { field.handleChange(val); field.handleBlur(); }}
                                                    placeholder="Select date of birth"
                                                />
                                            </div>
                                        )} />
                                        <form.Field name="gender" children={(field) => (
                                            <div className="space-y-1">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Gender</Label>
                                                <Select value={field.state.value} onValueChange={(val) => field.handleChange(val as any)}>
                                                    <SelectTrigger className={iconicInputClass}>
                                                        <SelectValue placeholder="Select Gender" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="MALE">Male</SelectItem>
                                                        <SelectItem value="FEMALE">Female</SelectItem>
                                                        <SelectItem value="OTHER">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )} />
                                        <form.Field name="nationality" children={(field) => (
                                            <div className="space-y-1">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Nationality</Label>
                                                <Select value={field.state.value} onValueChange={(val) => field.handleChange(val as any)}>
                                                    <SelectTrigger className={iconicInputClass}>
                                                        <SelectValue placeholder="Select Nationality" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="India">India</SelectItem>
                                                        <SelectItem value="Nepal">Nepal</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )} />
                                        <form.Field name="passportNo" children={(field) => (
                                            <div className="space-y-1">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Passport No</Label>
                                                <div className="relative">
                                                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input className={iconicInputClass} placeholder="Passport No" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} />
                                                </div>
                                            </div>
                                        )} />
                                    </CardContent>
                                </Card>

                                {/* Lead Details */}
                                <Card className={cardClass}>
                                    <CardHeader className="border-b border-border py-2 px-4">
                                        <h2 className="text-foreground font-bold text-base">Lead Details</h2>
                                    </CardHeader>
                                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        <form.Field name="source" children={(field) => (
                                            <div className="space-y-1">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Source <span className="text-red-500">*</span></Label>
                                                <Select value={field.state.value} onValueChange={(val) => field.handleChange(val as any)}>
                                                    <SelectTrigger className={iconicInputClass}>
                                                        <SelectValue placeholder="Select Source" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        {websites.map(w => <SelectItem key={w.id} value={w.name}>{w.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <ErrorMessage field={field} />
                                            </div>
                                        )} />
                                        <form.Field name="status" children={(field) => (
                                            <div className="space-y-1">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Status</Label>
                                                <Select value={field.state.value} onValueChange={(val) => field.handleChange(val as any)}>
                                                    <SelectTrigger className={iconicInputClass}>
                                                        <SelectValue placeholder="New Enquiry" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="NEW">New Enquiry</SelectItem>
                                                        <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                                                        <SelectItem value="CONTACTED">Contacted</SelectItem>
                                                        <SelectItem value="COUNSELLING_SCHEDULED">Counselling Scheduled</SelectItem>
                                                        <SelectItem value="COUNSELLING_COMPLETED">Counselling Completed</SelectItem>
                                                        <SelectItem value="FOLLOWUP_REQUIRED">Follow-up Required</SelectItem>
                                                        <SelectItem value="INTERESTED">Interested</SelectItem>
                                                        <SelectItem value="NOT_INTERESTED">Not Interested</SelectItem>
                                                        <SelectItem value="ON_HOLD">On Hold</SelectItem>
                                                        <SelectItem value="CLOSED">Closed/Converted</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )} />
                                        <form.Field name="interestedCountry" children={(field) => (
                                            <div className="space-y-1">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Interested Country</Label>
                                                <Select value={field.state.value} onValueChange={(val) => field.handleChange(val as any)}>
                                                    <SelectTrigger className={iconicInputClass}>
                                                        <SelectValue placeholder="Select Country" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="UK">UK</SelectItem>
                                                        <SelectItem value="USA">USA</SelectItem>
                                                        <SelectItem value="Canada">Canada</SelectItem>
                                                        <SelectItem value="Australia">Australia</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )} />
                                        <form.Field name="interestedCourse" children={(field) => (
                                            <div className="space-y-1">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Interested Course</Label>
                                                <div className="relative">
                                                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input className={iconicInputClass} placeholder="Course Name" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} />
                                                </div>
                                            </div>
                                        )} />
                                    </CardContent>
                                </Card>

                                {/* Next Follow-up - Personal Tab Only */}
                                <Card className={cardClass}>
                                    <CardHeader className="border-b border-border py-2 px-4">
                                        <h2 className="text-foreground font-bold text-base">Remark</h2>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <form.Field name="remark" children={(field) => (
                                            <div className="space-y-1">
                                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Remark</Label>
                                                <textarea className={`${iconicInputClass} w-full min-h-[80px] p-3 resize-none`} placeholder="Additional notes..." value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} />
                                            </div>
                                        )} />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="academic" className="m-0 space-y-4">
                                <Card className={cardClass}>
                                    <CardHeader className="bg-muted/50 border-b border-border pb-4 flex flex-row items-center justify-between">
                                        <h2 className="text-foreground font-bold text-lg">Academic History</h2>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl border-teal-200 text-teal-600 hover:bg-teal-50"
                                            onClick={() => form.pushFieldValue("academicDetails", { qualification: "", stream: "", institution: "", percentage: "", backlogs: "", passingYear: "" })}
                                        >
                                            <Plus className="h-4 w-4 mr-1" /> Add More
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-4">
                                        <form.Field name="academicDetails" mode="array" children={(field) => (
                                            <div className="space-y-6">
                                                {field.state.value.map((_, i) => (
                                                    <div key={i} className="p-6 rounded-2xl bg-muted/50 border border-border relative group">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-card border border-red-100 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50"
                                                            onClick={() => form.removeFieldValue("academicDetails", i)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                            <form.Field name={`academicDetails[${i}].qualification`} children={(subField) => (
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Qualification</Label>
                                                                    <Select value={subField.state.value} onValueChange={(val) => subField.handleChange(val)}>
                                                                        <SelectTrigger className="h-11 rounded-xl bg-background border-border">
                                                                            <SelectValue placeholder="Select" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="10TH">10th</SelectItem>
                                                                            <SelectItem value="12TH">12th</SelectItem>
                                                                            <SelectItem value="DIPLOMA">Diploma</SelectItem>
                                                                            <SelectItem value="BACHELORS">Bachelors</SelectItem>
                                                                            <SelectItem value="MASTERS">Masters</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            )} />
                                                            <form.Field name={`academicDetails[${i}].stream`} children={(subField) => (
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Stream</Label>
                                                                    <Input className="h-11 rounded-xl bg-background border-border" placeholder="Stream" value={subField.state.value} onBlur={subField.handleBlur} onChange={(e) => subField.handleChange(e.target.value)} />
                                                                </div>
                                                            )} />
                                                            <form.Field name={`academicDetails[${i}].institution`} children={(subField) => (
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Institution</Label>
                                                                    <Input className="h-11 rounded-xl bg-background border-border" placeholder="College/Board" value={subField.state.value} onBlur={subField.handleBlur} onChange={(e) => subField.handleChange(e.target.value)} />
                                                                </div>
                                                            )} />
                                                            <form.Field name={`academicDetails[${i}].percentage`} children={(subField) => (
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Percentage/CGPA</Label>
                                                                    <Input className="h-11 rounded-xl bg-background border-border" placeholder="Grade" value={subField.state.value} onBlur={subField.handleBlur} onChange={(e) => subField.handleChange(e.target.value)} />
                                                                </div>
                                                            )} />
                                                            <form.Field name={`academicDetails[${i}].passingYear`} children={(subField) => (
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Year of Passing</Label>
                                                                    <Input className="h-11 rounded-xl bg-background border-border" placeholder="Year" value={subField.state.value} onBlur={subField.handleBlur} onChange={(e) => subField.handleChange(e.target.value)} />
                                                                </div>
                                                            )} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )} />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="proficiency" className="m-0 space-y-4">
                                <Card className={cardClass}>
                                    <CardHeader className="border-b border-border py-2 px-4">
                                        <h2 className="text-foreground font-bold text-base">Proficiency Test</h2>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-4">
                                        <form.Field name="proficiencyExams" children={(field) => (
                                            <div className="space-y-4">
                                                {/* Test Selection Checkboxes */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                                    {proficiencyOptions.map((option) => (
                                                        <div key={option} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 border border-border hover:bg-background hover:border-teal-100 transition-all cursor-pointer">
                                                            <Checkbox
                                                                id={option}
                                                                checked={field.state.value.some(p => p.testName === option)}
                                                                onCheckedChange={(checked: boolean) => {
                                                                    if (checked) {
                                                                        field.handleChange([...field.state.value, { testName: option, listening: "", reading: "", writing: "", speaking: "", overall: "" }])
                                                                    } else {
                                                                        field.handleChange(field.state.value.filter(v => v.testName !== option))
                                                                    }
                                                                }}
                                                            />
                                                            <Label htmlFor={option} className="text-xs font-semibold text-muted-foreground cursor-pointer">{option}</Label>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Detailed Scores for Selected Tests */}
                                                <div className="space-y-6">
                                                    {field.state.value.map((exam, i) => (
                                                        <div key={exam.testName} className="space-y-4 p-5 rounded-xl border border-border bg-muted/30">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="h-2 w-2 rounded-full bg-teal-500" />
                                                                <h3 className="text-sm font-bold text-foreground">{exam.testName} Score Details</h3>
                                                            </div>
                                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Test Name</Label>
                                                                    <Input disabled value={exam.testName} className="h-9 rounded-lg bg-muted border-border text-xs font-semibold" />
                                                                </div>
                                                                <form.Field name={`proficiencyExams[${i}].listening`} children={(subField) => (
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Listening</Label>
                                                                        <Input className="h-9 rounded-lg bg-background border-border text-xs" placeholder="Score" value={subField.state.value} onBlur={subField.handleBlur} onChange={(e) => subField.handleChange(e.target.value)} />
                                                                    </div>
                                                                )} />
                                                                <form.Field name={`proficiencyExams[${i}].reading`} children={(subField) => (
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reading</Label>
                                                                        <Input className="h-9 rounded-lg bg-background border-border text-xs" placeholder="Score" value={subField.state.value} onBlur={subField.handleBlur} onChange={(e) => subField.handleChange(e.target.value)} />
                                                                    </div>
                                                                )} />
                                                                <form.Field name={`proficiencyExams[${i}].writing`} children={(subField) => (
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Writing</Label>
                                                                        <Input className="h-9 rounded-lg bg-background border-border text-xs" placeholder="Score" value={subField.state.value} onBlur={subField.handleBlur} onChange={(e) => subField.handleChange(e.target.value)} />
                                                                    </div>
                                                                )} />
                                                                <form.Field name={`proficiencyExams[${i}].speaking`} children={(subField) => (
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Speaking</Label>
                                                                        <Input className="h-9 rounded-lg bg-background border-border text-xs" placeholder="Score" value={subField.state.value} onBlur={subField.handleBlur} onChange={(e) => subField.handleChange(e.target.value)} />
                                                                    </div>
                                                                )} />
                                                                <form.Field name={`proficiencyExams[${i}].overall`} children={(subField) => (
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[10px] font-bold text-foreground uppercase tracking-wider">Overall</Label>
                                                                        <Input className="h-9 rounded-lg bg-teal-50/50 border-teal-100 text-xs font-bold text-teal-700 dark:bg-teal-950/50 dark:border-teal-800 dark:text-teal-300 focus:bg-background transition-all" placeholder="Score" value={subField.state.value} onBlur={subField.handleBlur} onChange={(e) => subField.handleChange(e.target.value)} />
                                                                    </div>
                                                                )} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )} />
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="work" className="m-0 space-y-4">
                                <Card className={cardClass}>
                                    <CardHeader className="bg-muted/50 border-b border-border pb-4 flex flex-row items-center justify-between">
                                        <h2 className="text-foreground font-bold text-lg">Work Experience</h2>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl border-teal-200 text-teal-600 hover:bg-teal-50"
                                            onClick={() => form.pushFieldValue("workExperience", { companyName: "", position: "", startDate: "", endDate: "", totalExperience: "" })}
                                        >
                                            <Plus className="h-4 w-4 mr-1" /> Add Experience
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-4">
                                        <form.Field name="workExperience" mode="array" children={(field) => (
                                            <div className="space-y-6">
                                                {field.state.value.map((_, i) => (
                                                    <div key={i} className="p-6 rounded-2xl bg-muted/50 border border-border relative group">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-card border border-red-100 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50"
                                                            onClick={() => form.removeFieldValue("workExperience", i)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                            <form.Field name={`workExperience[${i}].companyName`} children={(subField) => (
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Company Name</Label>
                                                                    <Input className="h-11 rounded-xl bg-background border-border" placeholder="Company Name" value={subField.state.value} onBlur={subField.handleBlur} onChange={(e) => subField.handleChange(e.target.value)} />
                                                                </div>
                                                            )} />
                                                            <form.Field name={`workExperience[${i}].position`} children={(subField) => (
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Position</Label>
                                                                    <Input className="h-11 rounded-xl bg-background border-border" placeholder="e.g. Software Engineer" value={subField.state.value} onBlur={subField.handleBlur} onChange={(e) => subField.handleChange(e.target.value)} />
                                                                </div>
                                                            )} />
                                                            <form.Field name={`workExperience[${i}].totalExperience`} children={(subField) => (
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Total Experience</Label>
                                                                    <Input className="h-11 rounded-xl bg-background border-border" placeholder="e.g. 2 Years" value={subField.state.value} onBlur={subField.handleBlur} onChange={(e) => subField.handleChange(e.target.value)} />
                                                                </div>
                                                            )} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )} />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </div>

                        <div className="flex justify-end pt-4 pb-12">
                            <form.Subscribe
                                selector={(state) => [state.canSubmit, state.isSubmitting]}
                                children={([canSubmit, isSubmitting]) => (
                                    <Button
                                        type="submit"
                                        disabled={!canSubmit || isSubmitting}
                                        className="w-full md:w-64 bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-12 font-bold text-base shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <Save className="h-5 w-5" />
                                        {isSubmitting ? "Saving..." : "Save Changes"}
                                    </Button>
                                )}
                            />
                        </div>
                    </div>
                </Tabs>
            </form>
        </div>
    );
}
