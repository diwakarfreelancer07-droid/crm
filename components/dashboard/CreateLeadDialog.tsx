"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

const formSchema = z.object({
    firstName: z.string().min(1, "First name is required").optional().or(z.literal("")),
    lastName: z.string().min(1, "Last name is required").optional().or(z.literal("")),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
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
    remark: z.string().optional(),
    message: z.string().optional(),
});

type CreateLeadFormData = z.infer<typeof formSchema>;

import { useCreateLead } from "@/hooks/use-leads";

function ErrorMessage({ field }: { field: any }) {
    if (!field.state.meta.isTouched || !field.state.meta.errors.length) return null
    return (
        <p className="text-[10px] text-red-500 font-medium">
            {field.state.meta.errors.join(", ")}
        </p>
    )
}

export function CreateLeadDialog({ onLeadCreated }: { onLeadCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [websites, setWebsites] = useState<{ id: string; name: string }[]>([]);
    const createLeadMutation = useCreateLead();

    const fetchWebsites = async () => {
        try {
            const res = await fetch("/api/websites");
            if (res.ok) {
                const data = await res.json();
                setWebsites(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Fetch websites when dialog opens
    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            fetchWebsites();
        }
    };

    const form = useForm({
        defaultValues: {
            firstName: "",
            lastName: "",
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
            remark: "",
            message: "",
        } as CreateLeadFormData,
        validators: {
            onChange: formSchema,
        },
        onSubmit: async ({ value }) => {
            try {
                // Ensure dateOfBirth is handled as a Date if required by API or back-converted
                // Our API handles string to date conversion, but let's be safe.
                await createLeadMutation.mutateAsync(value as any);
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
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl px-6">
                    <Plus className="mr-2 h-4 w-4" /> Add New Lead
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Add New Lead</DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    className="space-y-6 pt-4 max-h-[70vh] overflow-y-auto px-1"
                >
                    {/* Personal Information Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold border-b pb-1 text-cyan-700">Personal Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="firstName"
                                children={(field) => (
                                    <div className="space-y-1">
                                        <Label htmlFor="firstName" className="text-xs">First Name</Label>
                                        <Input
                                            id="firstName"
                                            placeholder="John"
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                        <ErrorMessage field={field} />
                                    </div>
                                )}
                            />
                            <form.Field
                                name="lastName"
                                children={(field) => (
                                    <div className="space-y-1">
                                        <Label htmlFor="lastName" className="text-xs">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            placeholder="Doe"
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="h-8 text-sm"
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
                                    <div className="space-y-1">
                                        <Label htmlFor="email" className="text-xs">Email</Label>
                                        <Input
                                            id="email"
                                            placeholder="john@example.com"
                                            value={field.state.value || ""}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                        <ErrorMessage field={field} />
                                    </div>
                                )}
                            />
                            <form.Field
                                name="phone"
                                children={(field) => (
                                    <div className="space-y-1">
                                        <Label htmlFor="phone" className="text-xs">Phone</Label>
                                        <Input
                                            id="phone"
                                            placeholder="1234567890"
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="h-8 text-sm"
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
                                    <div className="space-y-1">
                                        <Label htmlFor="alternateNo" className="text-xs">Alternate No</Label>
                                        <Input
                                            id="alternateNo"
                                            value={field.state.value || ""}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                )}
                            />
                            <form.Field
                                name="dateOfBirth"
                                children={(field) => (
                                    <div className="space-y-1">
                                        <Label htmlFor="dateOfBirth" className="text-xs">DOB</Label>
                                        <DatePicker
                                            value={field.state.value ?? ""}
                                            onChange={(val) => { field.handleChange(val); field.handleBlur(); }}
                                            placeholder="Pick a date"
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="gender"
                                children={(field) => (
                                    <div className="space-y-1">
                                        <Label htmlFor="gender" className="text-xs">Gender</Label>
                                        <Select value={field.state.value} onValueChange={(v) => field.handleChange(v)}>
                                            <SelectTrigger className="h-8 text-sm">
                                                <SelectValue placeholder="Gender" />
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
                                    <div className="space-y-1">
                                        <Label htmlFor="maritalStatus" className="text-xs">Marital Status</Label>
                                        <Select value={field.state.value} onValueChange={(v) => field.handleChange(v)}>
                                            <SelectTrigger className="h-8 text-sm">
                                                <SelectValue placeholder="Status" />
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
                                <div className="space-y-1">
                                    <Label htmlFor="address" className="text-xs">Address</Label>
                                    <Input
                                        id="address"
                                        value={field.state.value || ""}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                            )}
                        />
                    </div>

                    {/* Academic Section */}
                    <div className="space-y-4 pt-2">
                        <h3 className="text-sm font-semibold border-b pb-1 text-cyan-700">Academic & Tests</h3>
                        <form.Field
                            name="highestQualification"
                            children={(field) => (
                                <div className="space-y-1">
                                    <Label htmlFor="highestQualification" className="text-xs">Highest Qualification</Label>
                                    <Input
                                        id="highestQualification"
                                        value={field.state.value || ""}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="testName"
                                children={(field) => (
                                    <div className="space-y-1">
                                        <Label htmlFor="testName" className="text-xs">Test Name</Label>
                                        <Input
                                            id="testName"
                                            placeholder="IELTS/TOEFL"
                                            value={field.state.value || ""}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                )}
                            />
                            <form.Field
                                name="testScore"
                                children={(field) => (
                                    <div className="space-y-1">
                                        <Label htmlFor="testScore" className="text-xs">Test Score</Label>
                                        <Input
                                            id="testScore"
                                            value={field.state.value || ""}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                )}
                            />
                        </div>
                    </div>

                    {/* Course Preference Section */}
                    <div className="space-y-4 pt-2">
                        <h3 className="text-sm font-semibold border-b pb-1 text-cyan-700">Course Preference</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="interestedCourse"
                                children={(field) => (
                                    <div className="space-y-1">
                                        <Label htmlFor="interestedCourse" className="text-xs">Interested Course</Label>
                                        <Input
                                            id="interestedCourse"
                                            value={field.state.value || ""}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                )}
                            />
                            <form.Field
                                name="interestedCountry"
                                children={(field) => (
                                    <div className="space-y-1">
                                        <Label htmlFor="interestedCountry" className="text-xs">Interested Country</Label>
                                        <Input
                                            id="interestedCountry"
                                            value={field.state.value || ""}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="intake"
                                children={(field) => (
                                    <div className="space-y-1">
                                        <Label htmlFor="intake" className="text-xs">Intake</Label>
                                        <Input
                                            id="intake"
                                            placeholder="e.g. Sept 2024"
                                            value={field.state.value || ""}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                )}
                            />
                            <form.Field
                                name="applyLevel"
                                children={(field) => (
                                    <div className="space-y-1">
                                        <Label htmlFor="applyLevel" className="text-xs">Apply Level</Label>
                                        <Input
                                            id="applyLevel"
                                            placeholder="UG / PG"
                                            value={field.state.value || ""}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                )}
                            />
                        </div>
                    </div>

                    {/* Source & Notes Section */}
                    <div className="space-y-4 pt-2">
                        <h3 className="text-sm font-semibold border-b pb-1 text-cyan-700">Source & Other</h3>
                        <form.Field
                            name="source"
                            children={(field) => (
                                <div className="space-y-1">
                                    <Label htmlFor="source" className="text-xs">Source</Label>
                                    <Select
                                        value={field.state.value}
                                        onValueChange={(v) => field.handleChange(v as any)}
                                    >
                                        <SelectTrigger className="h-8 text-sm">
                                            <SelectValue placeholder="Select source" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {websites.map((site) => (
                                                <SelectItem key={site.id} value={site.name}>{site.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <ErrorMessage field={field} />
                                </div>
                            )}
                        />
                        <form.Field
                            name="remark"
                            children={(field) => (
                                <div className="space-y-1">
                                    <Label htmlFor="remark" className="text-xs">Remark</Label>
                                    <Input
                                        id="remark"
                                        value={field.state.value || ""}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                            )}
                        />
                        <form.Field
                            name="message"
                            children={(field) => (
                                <div className="space-y-1">
                                    <Label htmlFor="message" className="text-xs">Notes</Label>
                                    <Input
                                        id="message"
                                        placeholder="Inquiry about..."
                                        value={field.state.value || ""}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                            )}
                        />
                    </div>

                    <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                        children={([canSubmit, isSubmitting]) => (
                            <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700" disabled={createLeadMutation.isPending || !canSubmit}>
                                {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
                            </Button>
                        )}
                    />
                </form>
            </DialogContent>
        </Dialog>
    );
}
