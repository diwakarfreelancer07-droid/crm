"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { PhoneInput } from "@/components/ui/phone-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { SheetFooter, SheetClose } from "@/components/ui/sheet";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";

interface LeadFormProps {
    leadId: string;
    onSuccess: () => void;
}

const leadSchema = z.object({
    firstName: z.string().min(1, "First name is required").optional().or(z.literal("")),
    lastName: z.string().min(1, "Last name is required").optional().or(z.literal("")),
    name: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().min(10, "Phone must be at least 10 digits"),
    alternateNo: z.string().optional(),
    dateOfBirth: z.string().optional().or(z.literal("")),
    gender: z.string().optional(),
    nationality: z.string().optional(),
    maritalStatus: z.string().optional(),
    address: z.string().optional(),
    highestQualification: z.string().optional(),
    testName: z.string().optional(),
    testScore: z.string().optional(),
    interestedCourse: z.string().optional(),
    interestedCountry: z.string().optional(),
    intake: z.string().optional(),
    applyLevel: z.string().optional(),
    source: z.string().optional(),
    status: z.string().optional(),
    temperature: z.string().optional(),
    message: z.string().optional(),
    remark: z.string().optional(),
    imageUrl: z.string().nullable(),
});

type LeadFormData = z.infer<typeof leadSchema>;

function ErrorMessage({ field }: { field: any }) {
    // Only show error if the field has been touched and has errors
    if (!field.state.meta.isTouched || !field.state.meta.errors.length) return null

    return (
        <p className="text-sm text-red-500">
            {field.state.meta.errors
                .map((e: any) => (typeof e === 'object' && e?.message ? e.message : e))
                .join(', ')}
        </p>
    )
}


export function LeadForm({ leadId, onSuccess }: LeadFormProps) {
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm({
        // @ts-ignore
        validatorAdapter: zodValidator(),

        defaultValues: {
            firstName: "",
            lastName: "",
            name: "",
            email: "",
            phone: "",
            alternateNo: "",
            dateOfBirth: "",
            gender: "",
            nationality: "",
            maritalStatus: "",
            address: "",
            highestQualification: "",
            testName: "",
            testScore: "",
            interestedCourse: "",
            interestedCountry: "",
            intake: "",
            applyLevel: "",
            source: "",
            status: "",
            temperature: "",
            message: "",
            remark: "",
            imageUrl: null,
        } as LeadFormData,
        validators: {
            onChange: leadSchema,
        },
        onSubmit: async ({ value }) => {
            try {
                await axios.patch(`/api/leads/${leadId}`, value);
                toast.success("Lead updated successfully");
                onSuccess();
            } catch (error) {
                toast.error("Failed to update lead");
            }
        },
    });

    const [websites, setWebsites] = useState<{ id: string; name: string }[]>([]);
    const [qualifications, setQualifications] = useState<{ id: string; name: string }[]>([]);
    const [countries, setCountries] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        const fetchLead = async () => {
            try {
                const response = await axios.get(`/api/leads/${leadId}`);
                const lead = response.data;
                form.reset({
                    firstName: lead.firstName || "",
                    lastName: lead.lastName || "",
                    name: lead.name || "",
                    email: lead.email || "",
                    phone: lead.phone || "",
                    alternateNo: lead.alternateNo || "",
                    dateOfBirth: lead.dateOfBirth ? new Date(lead.dateOfBirth).toISOString().split('T')[0] : "",
                    gender: lead.gender || "",
                    nationality: lead.nationality || "",
                    maritalStatus: lead.maritalStatus || "",
                    address: lead.address || "",
                    highestQualification: lead.highestQualification || "",
                    testName: lead.testName || "",
                    testScore: lead.testScore || "",
                    interestedCourse: lead.interestedCourse || "",
                    interestedCountry: lead.interestedCountry || "",
                    intake: lead.intake || "",
                    applyLevel: lead.applyLevel || "",
                    source: lead.source || "",
                    status: lead.status || "",
                    temperature: lead.temperature || "",
                    message: lead.message || "",
                    remark: lead.remark || "",
                    imageUrl: lead.imageUrl || null,
                });
            } catch (error) {
                toast.error("Failed to load lead details");
            } finally {
                setIsLoading(false);
            }
        };

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

        if (leadId) fetchLead();
        fetchWebsites();
        fetchQualifications();
        fetchCountries();
    }, [leadId]);

    if (isLoading) {
        return <div className="p-4">Loading lead details...</div>;
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
            }}
            className="space-y-6 mt-6"
        >
            <div className="flex justify-center">
                <form.Field
                    name="imageUrl"
                    children={(field) => (
                        <ImageUpload
                            value={field.state.value}
                            onChange={(url) => field.handleChange(url)}
                            onRemove={() => field.handleChange(null)}
                        />
                    )}
                />
            </div>

            {/* Personal Information Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                    <form.Field
                        name="firstName"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className="rounded-xl"
                                />
                                <ErrorMessage field={field} />
                            </div>
                        )}
                    />
                    <form.Field
                        name="lastName"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className="rounded-xl"
                                />
                                <ErrorMessage field={field} />
                            </div>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <form.Field
                        name="email"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={field.state.value || ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className="rounded-xl"
                                />
                                <ErrorMessage field={field} />
                            </div>
                        )}
                    />
                    <form.Field
                        name="phone"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <PhoneInput
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(value) => field.handleChange(value)}
                                    className="rounded-xl"
                                />
                                <ErrorMessage field={field} />
                            </div>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <form.Field
                        name="alternateNo"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="alternateNo">Alternate No</Label>
                                <Input
                                    id="alternateNo"
                                    value={field.state.value || ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>
                        )}
                    />
                    <form.Field
                        name="dateOfBirth"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                <DatePicker
                                    value={field.state.value ?? ""}
                                    onChange={(val) => { field.handleChange(val); field.handleBlur(); }}
                                    placeholder="Pick a date"
                                />
                            </div>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <form.Field
                        name="gender"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select value={field.state.value} onValueChange={(v) => field.handleChange(v)}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MALE">Male</SelectItem>
                                        <SelectItem value="FEMALE">Female</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    />
                    <form.Field
                        name="maritalStatus"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="maritalStatus">Marital Status</Label>
                                <Select value={field.state.value} onValueChange={(v) => field.handleChange(v)}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SINGLE">Single</SelectItem>
                                        <SelectItem value="MARRIED">Married</SelectItem>
                                        <SelectItem value="DIVORCED">Divorced</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    />
                </div>

                <form.Field
                    name="address"
                    children={(field) => (
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={field.state.value || ""}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>
                    )}
                />
            </div>

            {/* Educational Background Section */}
            <div className="space-y-4 pt-4">
                <h3 className="text-lg font-semibold border-b pb-2">Educational Background</h3>
                <form.Field
                    name="highestQualification"
                    children={(field) => (
                        <div className="space-y-2">
                            <Label htmlFor="highestQualification">Highest Qualification</Label>
                            <Select value={field.state.value} onValueChange={(v) => field.handleChange(v)}>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Select qualification" />
                                </SelectTrigger>
                                <SelectContent>
                                    {qualifications.map((q) => (
                                        <SelectItem key={q.id} value={q.name}>{q.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <form.Field
                        name="testName"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="testName">Test Name</Label>
                                <Input
                                    id="testName"
                                    value={field.state.value || ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className="rounded-xl"
                                    placeholder="e.g. IELTS, TOEFL"
                                />
                            </div>
                        )}
                    />
                    <form.Field
                        name="testScore"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="testScore">Test Score</Label>
                                <Input
                                    id="testScore"
                                    value={field.state.value || ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>
                        )}
                    />
                </div>
            </div>

            {/* Course Preference Section */}
            <div className="space-y-4 pt-4">
                <h3 className="text-lg font-semibold border-b pb-2">Course Preference</h3>
                <div className="grid grid-cols-2 gap-4">
                    <form.Field
                        name="interestedCourse"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="interestedCourse">Interested Course</Label>
                                <Input
                                    id="interestedCourse"
                                    value={field.state.value || ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className="rounded-xl"
                                />
                            </div>
                        )}
                    />
                    <form.Field
                        name="interestedCountry"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="interestedCountry">Interested Country</Label>
                                <Select value={field.state.value} onValueChange={(v) => field.handleChange(v)}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countries.map((c) => (
                                            <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <form.Field
                        name="intake"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="intake">Intake</Label>
                                <Input
                                    id="intake"
                                    value={field.state.value || ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className="rounded-xl"
                                    placeholder="e.g. Sept 2024"
                                />
                            </div>
                        )}
                    />
                    <form.Field
                        name="applyLevel"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="applyLevel">Apply Level</Label>
                                <Input
                                    id="applyLevel"
                                    value={field.state.value || ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className="rounded-xl"
                                    placeholder="e.g. UG / PG"
                                />
                            </div>
                        )}
                    />
                </div>
            </div>

            {/* Lead Tracking Section */}
            <div className="space-y-4 pt-4">
                <h3 className="text-lg font-semibold border-b pb-2">Lead Information</h3>
                <div className="grid grid-cols-2 gap-4">
                    <form.Field
                        name="source"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="source">Source</Label>
                                <Select value={field.state.value} onValueChange={(v) => field.handleChange(v)}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Select source" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {websites.map((site) => (
                                            <SelectItem key={site.id} value={site.name}>{site.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    />
                    <form.Field
                        name="status"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={field.state.value} onValueChange={(v) => field.handleChange(v)}>
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
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
                        )}
                    />
                </div>
                <form.Field
                    name="temperature"
                    children={(field) => (
                        <div className="space-y-2">
                            <Label htmlFor="temperature">Temperature</Label>
                            <Select value={field.state.value} onValueChange={(v) => field.handleChange(v)}>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Select temperature" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="COLD">Cold</SelectItem>
                                    <SelectItem value="WARM">Warm</SelectItem>
                                    <SelectItem value="HOT">Hot</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                />
                <form.Field
                    name="remark"
                    children={(field) => (
                        <div className="space-y-2">
                            <Label htmlFor="remark">Remarks</Label>
                            <textarea
                                id="remark"
                                value={field.state.value || ""}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                className="w-full min-h-[80px] p-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </div>
                    )}
                />
                <form.Field
                    name="message"
                    children={(field) => (
                        <div className="space-y-2">
                            <Label htmlFor="message">Note/Message</Label>
                            <textarea
                                id="message"
                                value={field.state.value || ""}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                className="w-full min-h-[80px] p-3 rounded-xl border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </div>
                    )}
                />
            </div>

            <SheetFooter className="gap-2">
                <SheetClose asChild>
                    <Button variant="outline" type="button" className="rounded-xl">Cancel</Button>
                </SheetClose>
                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isSubmitting]) => (
                        <Button type="submit" className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-sm px-8" disabled={!canSubmit}>
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    )}
                />
            </SheetFooter>
        </form>
    );
}
