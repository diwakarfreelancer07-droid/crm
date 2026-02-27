"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import axios from "axios";
import { toast } from "sonner";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet";
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
import { ImageUpload } from "@/components/ui/image-upload";
import { useCreateLead } from "@/hooks/use-leads";
import { LeadStatus } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().min(10, "Phone is required"),
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
    imageUrl: z.string().nullable().optional(),
    followUp: z.object({
        date: z.string().optional().or(z.literal("")),
        time: z.string().optional().or(z.literal("")),
        remark: z.string().optional().or(z.literal("")),
        type: z.string().optional().default("CALL"),
    }).optional(),
    appointment: z.object({
        date: z.string().optional().or(z.literal("")),
        time: z.string().optional().or(z.literal("")),
        remark: z.string().optional().or(z.literal("")),
        title: z.string().optional().default("Initial Consultation"),
    }).optional(),
});

type FormData = z.infer<typeof formSchema>;

export function CreateLeadSheet({ onLeadCreated }: { onLeadCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const createLeadMutation = useCreateLead();
    const [websites, setWebsites] = useState<{ id: string; name: string }[]>([]);
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
        const fetchCountries = async () => {
            try {
                const res = await axios.get("/api/master/countries");
                setCountries(res.data);
            } catch (error) {
                console.error("Failed to load countries", error);
            }
        };
        fetchWebsites();
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
            imageUrl: null,
            followUp: { date: "", time: "", remark: "", type: "CALL" },
            appointment: { date: "", time: "", remark: "", title: "Initial Consultation" },
        } as FormData,
        // @ts-ignore
        validatorAdapter: zodValidator(),
        validators: {
            onChange: formSchema as any,
        },
        onSubmit: async ({ value }) => {
            try {
                // Pre-process dates for nested creation
                const payload = {
                    ...value,
                    followUp: (value.followUp?.date && value.followUp?.time) ? {
                        nextFollowUpAt: `${value.followUp.date}T${value.followUp.time}:00Z`,
                        remark: value.followUp.remark,
                        type: value.followUp.type
                    } : undefined,
                    appointment: (value.appointment?.date && value.appointment?.time) ? {
                        startTime: `${value.appointment.date}T${value.appointment.time}:00Z`,
                        remark: value.appointment.remark,
                        title: value.appointment.title
                    } : undefined
                };

                await createLeadMutation.mutateAsync(payload as any);
                toast.success("Lead created successfully");
                setOpen(false);
                form.reset();
                onLeadCreated();
            } catch (error: any) {
                toast.error(error.response?.data?.message || "Failed to create lead");
            }
        },
    });

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 font-bold shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> Add New Lead
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[600px] overflow-y-auto px-0">
                <SheetHeader className="px-6 border-b pb-4">
                    <SheetTitle>Create New Lead</SheetTitle>
                    <SheetDescription>
                        Enter lead details including follow-up and clinical interest.
                    </SheetDescription>
                </SheetHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    className="space-y-6 py-6"
                >
                    <Tabs defaultValue="personal" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mx-6 mb-4 bg-slate-100 rounded-xl h-12 p-1">
                            <TabsTrigger value="personal" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all text-xs font-bold">Personal</TabsTrigger>
                            <TabsTrigger value="academic" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all text-xs font-bold">Academic</TabsTrigger>
                            <TabsTrigger value="nextSteps" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all text-xs font-bold">Next Steps</TabsTrigger>
                        </TabsList>

                        <div className="px-6">
                            <TabsContent value="personal" className="space-y-4">
                                <div className="flex justify-center mb-6">
                                    <form.Field name="imageUrl" children={(field) => (
                                        <ImageUpload value={field.state.value} onChange={field.handleChange} onRemove={() => field.handleChange(null)} />
                                    )} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <form.Field name="firstName" children={(field) => (
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name *</Label>
                                            <Input id="firstName" placeholder="John" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="rounded-xl" />
                                        </div>
                                    )} />
                                    <form.Field name="lastName" children={(field) => (
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name *</Label>
                                            <Input id="lastName" placeholder="Doe" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="rounded-xl" />
                                        </div>
                                    )} />
                                </div>
                                <form.Field name="email" children={(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email address</Label>
                                        <Input id="email" placeholder="john@example.com" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="rounded-xl" />
                                    </div>
                                )} />
                                <div className="grid grid-cols-2 gap-4">
                                    <form.Field name="phone" children={(field) => (
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number *</Label>
                                            <PhoneInput value={field.state.value} onBlur={field.handleBlur} onChange={field.handleChange} className="rounded-xl" />
                                        </div>
                                    )} />
                                    <form.Field name="alternateNo" children={(field) => (
                                        <div className="space-y-2">
                                            <Label htmlFor="alternateNo">Alternate Number</Label>
                                            <PhoneInput value={field.state.value} onBlur={field.handleBlur} onChange={field.handleChange} className="rounded-xl" />
                                        </div>
                                    )} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <form.Field name="dateOfBirth" children={(field) => (
                                        <div className="space-y-2">
                                            <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                            <DatePicker
                                                value={field.state.value}
                                                onChange={(val) => { field.handleChange(val); field.handleBlur(); }}
                                                placeholder="Pick a date"
                                            />
                                        </div>
                                    )} />
                                    <form.Field name="gender" children={(field) => (
                                        <div className="space-y-2">
                                            <Label htmlFor="gender">Gender</Label>
                                            <Select value={field.state.value} onValueChange={field.handleChange}>
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="MALE">Male</SelectItem>
                                                    <SelectItem value="FEMALE">Female</SelectItem>
                                                    <SelectItem value="OTHER">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )} />
                                </div>
                                <form.Field name="address" children={(field) => (
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Input id="address" placeholder="123 Street Name" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="rounded-xl" />
                                    </div>
                                )} />
                            </TabsContent>

                            <TabsContent value="academic" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <form.Field name="highestQualification" children={(field) => (
                                        <div className="space-y-2">
                                            <Label htmlFor="highestQualification">Highest Qualification</Label>
                                            <Input id="highestQualification" placeholder="e.g. B.Tech" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="rounded-xl" />
                                        </div>
                                    )} />
                                    <form.Field name="interestedCourse" children={(field) => (
                                        <div className="space-y-2">
                                            <Label htmlFor="interestedCourse">Interested Course</Label>
                                            <Input id="interestedCourse" placeholder="e.g. MBA" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="rounded-xl" />
                                        </div>
                                    )} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <form.Field name="testName" children={(field) => (
                                        <div className="space-y-2">
                                            <Label htmlFor="testName">Entrance Test</Label>
                                            <Input id="testName" placeholder="e.g. IELTS" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="rounded-xl" />
                                        </div>
                                    )} />
                                    <form.Field name="testScore" children={(field) => (
                                        <div className="space-y-2">
                                            <Label htmlFor="testScore">Score</Label>
                                            <Input id="testScore" placeholder="7.5" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="rounded-xl" />
                                        </div>
                                    )} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <form.Field name="interestedCountry" children={(field) => (
                                        <div className="space-y-2">
                                            <Label htmlFor="interestedCountry">Interested Country</Label>
                                            <Select value={field.state.value} onValueChange={field.handleChange}>
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    {countries.map(c => (
                                                        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )} />
                                    <form.Field name="intake" children={(field) => (
                                        <div className="space-y-2">
                                            <Label htmlFor="intake">Intake</Label>
                                            <Input id="intake" placeholder="Sep 2024" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="rounded-xl" />
                                        </div>
                                    )} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <form.Field name="source" children={(field) => (
                                        <div className="space-y-2">
                                            <Label htmlFor="source">Source *</Label>
                                            <Select value={field.state.value} onValueChange={field.handleChange}>
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue placeholder="Select source" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    {websites.map(w => <SelectItem key={w.id} value={w.name}>{w.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )} />
                                    <form.Field name="status" children={(field) => (
                                        <div className="space-y-2">
                                            <Label htmlFor="status">Initial Status</Label>
                                            <Select value={field.state.value} onValueChange={field.handleChange}>
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="NEW">New</SelectItem>
                                                    <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                                                    <SelectItem value="CONTACTED">Contacted</SelectItem>
                                                    <SelectItem value="COUNSELLING_SCHEDULED">Counselling Scheduled</SelectItem>
                                                    <SelectItem value="COUNSELLING_COMPLETED">Counselling Completed</SelectItem>
                                                    <SelectItem value="FOLLOWUP_REQUIRED">Followup Required</SelectItem>
                                                    <SelectItem value="INTERESTED">Interested</SelectItem>
                                                    <SelectItem value="NOT_INTERESTED">Not Interested</SelectItem>
                                                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                                                    <SelectItem value="CLOSED">Closed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )} />
                                </div>
                            </TabsContent>

                            <TabsContent value="nextSteps" className="space-y-6">
                                <div className="space-y-4 border-b pb-6">
                                    <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                                        <Plus className="h-4 w-4" /> Initial Follow Up
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <form.Field name="followUp.date" children={(field) => (
                                            <div className="space-y-2">
                                                <Label>Date</Label>
                                                <DatePicker
                                                    value={field.state.value}
                                                    onChange={(val) => { field.handleChange(val); field.handleBlur(); }}
                                                    placeholder="Pick a date"
                                                />
                                            </div>
                                        )} />
                                        <form.Field name="followUp.time" children={(field) => (
                                            <div className="space-y-2">
                                                <Label>Time</Label>
                                                <Input type="time" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="rounded-xl" />
                                            </div>
                                        )} />
                                    </div>
                                    <form.Field name="followUp.remark" children={(field) => (
                                        <div className="space-y-2">
                                            <Label>Follow Up Remark</Label>
                                            <Input placeholder="Initial call to discuss interests" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="rounded-xl" />
                                        </div>
                                    )} />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sky-700 font-bold text-sm">
                                        <Plus className="h-4 w-4" /> Initial Appointment
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <form.Field name="appointment.date" children={(field) => (
                                            <div className="space-y-2">
                                                <Label>Date</Label>
                                                <DatePicker
                                                    value={field.state.value}
                                                    onChange={(val) => { field.handleChange(val); field.handleBlur(); }}
                                                    placeholder="Pick a date"
                                                />
                                            </div>
                                        )} />
                                        <form.Field name="appointment.time" children={(field) => (
                                            <div className="space-y-2">
                                                <Label>Time</Label>
                                                <Input type="time" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="rounded-xl" />
                                            </div>
                                        )} />
                                    </div>
                                    <form.Field name="appointment.remark" children={(field) => (
                                        <div className="space-y-2">
                                            <Label>Appointment Remark</Label>
                                            <Input placeholder="Office visit scheduled" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="rounded-xl" />
                                        </div>
                                    )} />
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>

                    <SheetFooter className="px-6 border-t pt-4">
                        <SheetClose asChild>
                            <Button type="button" variant="outline" className="rounded-xl h-11 px-6">Cancel</Button>
                        </SheetClose>
                        <form.Subscribe
                            selector={(state) => [state.canSubmit, state.isSubmitting]}
                            children={([canSubmit, isSubmitting]) => (
                                <Button
                                    type="submit"
                                    className="rounded-xl h-11 px-8 font-bold"
                                    disabled={createLeadMutation.isPending || !canSubmit}
                                >
                                    {createLeadMutation.isPending ? "Creating..." : "Save Lead"}
                                </Button>
                            )}
                        />
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    );
}
