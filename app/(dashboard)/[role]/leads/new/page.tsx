"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
    Phone,
    MessageSquare,
    Info,
    Flag,
    Plus,
    Trash2,
    Award,
    FileText,
    Pin
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
    followUp: z.object({
        date: z.string().optional().or(z.literal("")),
        time: z.string().optional().or(z.literal("")),
        remark: z.string().optional().or(z.literal("")),
    }).optional(),
    appointment: z.object({
        date: z.string().optional().or(z.literal("")),
        time: z.string().optional().or(z.literal("")),
        title: z.string().optional().or(z.literal("")),
        remark: z.string().optional().or(z.literal("")),
    }).optional(),
});

type FormData = z.infer<typeof formSchema>;

const iconicInputClass = "pl-10 h-10 rounded-lg bg-muted/50 border-border focus:bg-background transition-all text-sm";
const cardClass = "border border-border shadow-sm rounded-xl overflow-hidden bg-card";
const sectionTitleClass = "text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3";

function ErrorMessage({ field }: { field: any }) {
    if (!field.state.meta.isTouched || !field.state.meta.errors.length) return null
    return (
        <p className="text-xs text-red-500 mt-1 ml-1">
            {field.state.meta.errors.map((e: any) => (typeof e === 'object' ? e.message : e)).join(', ')}
        </p>
    )
}

export default function AddLeadPage() {
    const router = useRouter();
    const [websites, setWebsites] = useState<{ id: string; name: string }[]>([]);
    const [qualifications, setQualifications] = useState<{ id: string; name: string }[]>([]);
    const [countries, setCountries] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        const fetchWebsites = async () => {
            try {
                const res = await axios.get("/api/websites");
                setWebsites(res.data);
            } catch (error) {
                console.error("Failed to load websites", error);
            }
        };
        const fetchQualifications = async () => {
            try {
                const res = await axios.get("/api/master/qualifications");
                setQualifications(res.data);
            } catch (error) {
                console.error("Failed to load qualifications", error);
            }
        };
        const fetchCountries = async () => {
            try {
                const res = await axios.get("/api/master/countries");
                setCountries(res.data);
            } catch (error) {
                console.error("Failed to load countries", error);
            }
        };
        fetchWebsites();
        fetchQualifications();
        fetchCountries();
    }, []);

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
            followUp: { date: "", time: "", remark: "" },
            appointment: { date: "", time: "", title: "", remark: "" },
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
                    followUp: (value.followUp?.date && value.followUp?.time) ? {
                        nextFollowUpAt: `${value.followUp.date}T${value.followUp.time}:00Z`,
                        remark: value.followUp.remark
                    } : undefined,
                    appointment: (value.appointment?.date && value.appointment?.time) ? {
                        startTime: `${value.appointment.date}T${value.appointment.time}:00Z`,
                        title: value.appointment.title || "Initial Consultation",
                        remark: value.appointment.remark
                    } : undefined,
                };

                await axios.post("/api/leads", payload);
                toast.success("Lead created successfully");
                router.push("/leads");
            } catch (error: any) {
                toast.error(error.response?.data?.message || "Failed to create lead");
            }
        },
    });

    const proficiencyOptions = ["IELTS", "PTE", "TOEFL", "DUOLINGO", "GRE", "GMAT", "SAT"];

    return (
        <div className="min-h-screen bg-background pb-20">
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
                className="max-w-7xl mx-auto px-6 mt-3"
            >
                <div className="grid grid-cols-12 gap-4 items-start">
                    {/* Left Column - Main Details */}
                    <div className="col-span-12 lg:col-span-8 space-y-4">
                        {/* Personal Details Section */}
                        <Card className="rounded-xl border-border overflow-hidden shadow-sm">
                            <CardHeader className="border-b border-border py-2 px-4">
                                <h2 className="text-foreground font-bold text-base">Personal Details</h2>
                            </CardHeader>
                            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
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
                                    </div>
                                )} />
                                <form.Field name="email" children={(field) => (
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Email <span className="text-red-500">*</span></Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input className={iconicInputClass} placeholder="Email" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} />
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
                                <form.Field name="alternateNo" children={(field) => (
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Alternate No</Label>
                                        <PhoneInput value={field.state.value} onBlur={field.handleBlur} onChange={field.handleChange} className="rounded-xl h-11" />
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
                                        <Select value={field.state.value} onValueChange={field.handleChange}>
                                            <SelectTrigger className={iconicInputClass}>
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <SelectValue placeholder="Select Gender" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
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
                                        <Select value={field.state.value} onValueChange={field.handleChange}>
                                            <SelectTrigger className={iconicInputClass}>
                                                <div className="flex items-center gap-2">
                                                    <Flag className="h-4 w-4 text-muted-foreground" />
                                                    <SelectValue placeholder="Select Nationality" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="India">India</SelectItem>
                                                <SelectItem value="Nepal">Nepal</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )} />
                                <form.Field name="maritalStatus" children={(field) => (
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Marital Status</Label>
                                        <Select value={field.state.value} onValueChange={field.handleChange}>
                                            <SelectTrigger className={iconicInputClass}>
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    <SelectValue placeholder="Marital Status" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SINGLE">Single</SelectItem>
                                                <SelectItem value="MARRIED">Married</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )} />
                                <form.Field name="address" children={(field) => (
                                    <div className="space-y-1 md:col-span-3">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Address</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <textarea className={`${iconicInputClass} h-12 w-full pt-2 rounded-lg border-border focus:bg-background transition-all resize-none overflow-hidden`} placeholder="Address" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} />
                                        </div>
                                    </div>
                                )} />
                            </CardContent>
                        </Card>

                        {/* Other Details Section */}
                        <Card className="rounded-xl border-border overflow-hidden shadow-sm">
                            <CardHeader className="border-b border-border py-2 px-4">
                                <h2 className="text-foreground font-bold text-base">Other Details</h2>
                            </CardHeader>
                            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                                <form.Field name="highestQualification" children={(field) => (
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Highest Qualification</Label>
                                        <Select value={field.state.value} onValueChange={field.handleChange}>
                                            <SelectTrigger className={iconicInputClass}>
                                                <div className="flex items-center gap-2">
                                                    <Award className="h-4 w-4 text-muted-foreground" />
                                                    <SelectValue placeholder="Select Qualification" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {qualifications.map(q => <SelectItem key={q.id} value={q.name}>{q.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )} />
                                <form.Field name="interestedCourse" children={(field) => (
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Interested Course</Label>
                                        <div className="relative">
                                            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input className={iconicInputClass} placeholder="Interested Course" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} />
                                        </div>
                                    </div>
                                )} />
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Test Given (Name, Score)</Label>
                                    <div className="flex gap-2">
                                        <form.Field name="testName" children={(field) => (
                                            <div className="relative flex-1">
                                                <ClipboardList className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input className={iconicInputClass} placeholder="Test Name" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} />
                                            </div>
                                        )} />
                                        <form.Field name="testScore" children={(field) => (
                                            <Input className="h-10 w-20 rounded-lg border-border focus:bg-background transition-all text-sm" placeholder="Score" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} />
                                        )} />
                                    </div>
                                </div>
                                <form.Field name="interestedCountry" children={(field) => (
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Interested Country</Label>
                                        <Select value={field.state.value} onValueChange={field.handleChange}>
                                            <SelectTrigger className={iconicInputClass}>
                                                <div className="flex items-center gap-2">
                                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                                    <SelectValue placeholder="Select Country" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {countries.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )} />
                                <form.Field name="intake" children={(field) => (
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Intake</Label>
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input className={iconicInputClass} placeholder="Intake" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} />
                                        </div>
                                    </div>
                                )} />
                                <form.Field name="applyLevel" children={(field) => (
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Apply Level</Label>
                                        <Select value={field.state.value} onValueChange={field.handleChange}>
                                            <SelectTrigger className={iconicInputClass}>
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                                    <SelectValue placeholder="Select Level" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="UG">Undergraduate</SelectItem>
                                                <SelectItem value="PG">Postgraduate</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )} />
                                <form.Field name="source" children={(field) => (
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Source</Label>
                                        <Select value={field.state.value} onValueChange={field.handleChange}>
                                            <SelectTrigger className={iconicInputClass}>
                                                <div className="flex items-center gap-2">
                                                    <Info className="h-4 w-4 text-muted-foreground" />
                                                    <SelectValue placeholder="Select Source" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {websites.map(w => <SelectItem key={w.id} value={w.name}>{w.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )} />
                                <form.Field name="status" children={(field) => (
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Status</Label>
                                        <Select value={field.state.value} onValueChange={(v) => field.handleChange(v as LeadStatus)}>
                                            <SelectTrigger className={iconicInputClass}>
                                                <div className="flex items-center gap-2">
                                                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                                                    <SelectValue placeholder="New Enquiry" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NEW">New Enquiry</SelectItem>
                                                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                                                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                                <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )} />
                                <form.Field name="remark" children={(field) => (
                                    <div className="space-y-1 md:col-span-3">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Remark</Label>
                                        <div className="relative">
                                            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <textarea className={`${iconicInputClass} h-12 w-full pt-2 rounded-lg border-border focus:bg-background transition-all resize-none overflow-hidden`} placeholder="Remark" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} />
                                        </div>
                                    </div>
                                )} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Actions */}
                    <div className="col-span-12 lg:col-span-4 space-y-4">
                        {/* Follow Up Section */}
                        <Card className="rounded-xl border-border overflow-hidden shadow-sm">
                            <CardHeader className="border-b border-border py-2 px-4">
                                <h2 className="text-foreground font-bold text-base">Follow Up</h2>
                            </CardHeader>
                            <CardContent className="p-4 space-y-5">
                                <form.Field name="followUp.date" children={(field) => (
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Follow Up Date</Label>
                                        <DatePicker
                                            value={field.state.value}
                                            onChange={(val) => { field.handleChange(val); field.handleBlur(); }}
                                            placeholder="Select follow up date"
                                        />
                                    </div>
                                )} />
                                <form.Field name="followUp.time" children={(field) => (
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Follow Up Time</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input type="time" className={iconicInputClass} value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} />
                                        </div>
                                    </div>
                                )} />
                                <form.Field name="followUp.remark" children={(field) => (
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Follow Up Remarks</Label>
                                        <div className="relative">
                                            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <textarea className={`${iconicInputClass} h-16 w-full pt-2 rounded-lg border-border focus:bg-background transition-all resize-none overflow-hidden`} placeholder="Remarks" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} />
                                        </div>
                                    </div>
                                )} />
                            </CardContent>
                        </Card>

                        {/* Appointments Section */}
                        <Card className="rounded-xl border-border overflow-hidden shadow-sm">
                            <CardHeader className="border-b border-border py-2 px-4">
                                <h2 className="text-foreground font-bold text-base">Appointments</h2>
                            </CardHeader>
                            <CardContent className="p-4 space-y-5">
                                <form.Field name="appointment.date" children={(field) => (
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Appointment Date</Label>
                                        <DatePicker
                                            value={field.state.value}
                                            onChange={(val) => { field.handleChange(val); field.handleBlur(); }}
                                            placeholder="Select appointment date"
                                        />
                                    </div>
                                )} />
                                <form.Field name="appointment.time" children={(field) => (
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Appointment Time</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input type="time" className={iconicInputClass} value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} />
                                        </div>
                                    </div>
                                )} />
                                <form.Field name="appointment.remark" children={(field) => (
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-tight">Appointment Remarks</Label>
                                        <div className="relative">
                                            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <textarea className={`${iconicInputClass} h-16 w-full pt-2 rounded-lg border-border focus:bg-background transition-all resize-none overflow-hidden`} placeholder="Appointment Remarks" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} />
                                        </div>
                                    </div>
                                )} />
                            </CardContent>
                        </Card>

                        {/* Form Action Button in Sidebar as well or bottom */}
                        <div className="pt-4">
                            <form.Subscribe
                                selector={(state) => [state.canSubmit, state.isSubmitting]}
                                children={([canSubmit, isSubmitting]) => (
                                    <Button
                                        type="submit"
                                        disabled={!canSubmit || isSubmitting}
                                        className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-11 font-bold shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <Save className="h-5 w-5" />
                                        {isSubmitting ? "Saving..." : "Create Lead"}
                                    </Button>
                                )}
                            />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
