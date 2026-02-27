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
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { useRouter } from "next/navigation";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
    name: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    phone: z.string().min(10, "Phone must be at least 10 digits"),
    alternateNo: z.string().optional().or(z.literal("")),
    dateOfBirth: z.string().optional().or(z.literal("")),
    gender: z.string().optional().or(z.literal("")),
    nationality: z.string().optional().or(z.literal("")),
    passportNo: z.string().optional().or(z.literal("")),
    passportIssueDate: z.string().optional().or(z.literal("")),
    passportExpiryDate: z.string().optional().or(z.literal("")),
    highestQualification: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
});

type ConvertToStudentFormData = z.infer<typeof formSchema>;

interface ConvertToStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: any;
    onSuccess?: (studentId: string) => void;
}

function ErrorMessage({ field }: { field: any }) {
    if (!field.state.meta.isTouched || !field.state.meta.errors.length) return null;
    return (
        <p className="text-[10px] text-red-500 font-medium">
            {field.state.meta.errors.join(", ")}
        </p>
    );
}

export function ConvertToStudentModal({ isOpen, onClose, lead, onSuccess }: ConvertToStudentModalProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm({
        defaultValues: {
            name: lead?.name || "",
            email: lead?.email || "",
            phone: lead?.phone || "",
            alternateNo: lead?.alternateNo || "",
            dateOfBirth: lead?.dateOfBirth ? new Date(lead.dateOfBirth).toISOString() : "",
            gender: lead?.gender || "",
            nationality: lead?.nationality || "",
            passportNo: lead?.passportNo || "",
            passportIssueDate: lead?.passportIssueDate ? new Date(lead.passportIssueDate).toISOString() : "",
            passportExpiryDate: lead?.passportExpiryDate ? new Date(lead.passportExpiryDate).toISOString() : "",
            highestQualification: lead?.highestQualification || "",
            address: lead?.address || "",
        } as ConvertToStudentFormData,
        validators: {
            onChange: formSchema,
        },
        onSubmit: async ({ value }) => {
            setIsSubmitting(true);
            try {
                const response = await axios.post(`/api/leads/${lead.id}/convert-to-student`, value);
                toast.success(response.data.message || "Lead converted to student successfully");

                // Invalidate all relevant queries
                queryClient.invalidateQueries({ queryKey: ["leads"] });
                queryClient.invalidateQueries({ queryKey: ["students"] });
                queryClient.invalidateQueries({ queryKey: ["lead-stats"] });
                queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
                queryClient.invalidateQueries({ queryKey: ["lead", lead.id] });

                onClose();
                if (onSuccess) {
                    onSuccess(response.data.studentId);
                } else {
                    router.push(`/admin/students/${response.data.studentId}`);
                }
            } catch (error: any) {
                console.error("Conversion error:", error);
                const errorMsg = error.response?.data?.details || error.response?.data?.error || "Failed to convert lead";
                toast.error(errorMsg);
            } finally {
                setIsSubmitting(false);
            }
        },
    });

    if (!lead) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Convert Lead to Student</DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    className="space-y-6 pt-4 max-h-[75vh] overflow-y-auto px-1"
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="name"
                                children={(field) => (
                                    <div className="space-y-1">
                                        <Label htmlFor="name" className="text-xs">Full Name *</Label>
                                        <Input
                                            id="name"
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
                                name="email"
                                children={(field) => (
                                    <div className="space-y-1">
                                        <Label htmlFor="email" className="text-xs">Email</Label>
                                        <Input
                                            id="email"
                                            value={field.state.value || ""}
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
                                name="phone"
                                children={(field) => (
                                    <div className="space-y-1">
                                        <Label htmlFor="phone" className="text-xs">Phone *</Label>
                                        <Input
                                            id="phone"
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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="dateOfBirth"
                                children={(field) => (
                                    <div className="space-y-1">
                                        <Label htmlFor="dateOfBirth" className="text-xs">Date of Birth</Label>
                                        <DatePicker
                                            value={field.state.value ?? ""}
                                            onChange={(val) => { field.handleChange(val); field.handleBlur(); }}
                                            placeholder="Pick a date"
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                )}
                            />
                            <form.Field
                                name="gender"
                                children={(field) => (
                                    <div className="space-y-1">
                                        <Label htmlFor="gender" className="text-xs">Gender</Label>
                                        <Select value={field.state.value} onValueChange={(v) => field.handleChange(v)}>
                                            <SelectTrigger className="h-8 text-sm">
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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="nationality"
                                children={(field) => (
                                    <div className="space-y-1">
                                        <Label htmlFor="nationality" className="text-xs">Nationality</Label>
                                        <Input
                                            id="nationality"
                                            value={field.state.value || ""}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                )}
                            />
                            <form.Field
                                name="passportNo"
                                children={(field) => (
                                    <div className="space-y-1">
                                        <Label htmlFor="passportNo" className="text-xs">Passport No</Label>
                                        <Input
                                            id="passportNo"
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
                                name="passportIssueDate"
                                children={(field) => (
                                    <div className="space-y-1">
                                        <Label htmlFor="passportIssueDate" className="text-xs">Passport Issue Date</Label>
                                        <DatePicker
                                            value={field.state.value ?? ""}
                                            onChange={(val) => { field.handleChange(val); field.handleBlur(); }}
                                            placeholder="Pick a date"
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                )}
                            />
                            <form.Field
                                name="passportExpiryDate"
                                children={(field) => (
                                    <div className="space-y-1">
                                        <Label htmlFor="passportExpiryDate" className="text-xs">Passport Expiry Date</Label>
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

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <form.Subscribe
                            selector={(state) => [state.canSubmit]}
                            children={([canSubmit]) => (
                                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" disabled={!canSubmit || isSubmitting}>
                                    {isSubmitting ? "Converting..." : "Convert & Save"}
                                </Button>
                            )}
                        />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
