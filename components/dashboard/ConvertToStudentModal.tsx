"use client";

import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
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
import {
    User,
    Phone,
    Mail,
    Calendar,
    IdCard,
    MapPin,
    BookOpen,
    Briefcase,
    UserCheck,
    Loader2,
    GraduationCap,
} from "lucide-react";

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
    agentId: z.string().optional().or(z.literal("")),
    counselorId: z.string().optional().or(z.literal("")),
});

type ConvertToStudentFormData = z.infer<typeof formSchema>;

interface ConvertToStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: any;
    onSuccess?: (studentId: string) => void;
}

function FieldWrapper({ icon: Icon, label, required, children }: {
    icon?: any;
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                {Icon && <Icon className="h-3 w-3" />}
                {label}{required && <span className="text-rose-500">*</span>}
            </Label>
            {children}
        </div>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2 py-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">{children}</span>
            <div className="h-px flex-1 bg-border" />
        </div>
    );
}

function ErrorMessage({ field }: { field: any }) {
    if (!field.state.meta.isTouched || !field.state.meta.errors.length) return null;
    return (
        <p className="text-[10px] text-rose-500 font-medium mt-0.5">
            {field.state.meta.errors.join(", ")}
        </p>
    );
}

export function ConvertToStudentModal({ isOpen, onClose, lead, onSuccess }: ConvertToStudentModalProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [agents, setAgents] = useState<any[]>([]);
    const [counselors, setCounselors] = useState<any[]>([]);

    // Fetch agents and counselors for assignment dropdowns
    useEffect(() => {
        if (!isOpen) return;
        axios.get("/api/agents")
            .then(res => setAgents(res.data?.agents || res.data || []))
            .catch(() => setAgents([]));
        axios.get("/api/counselors")
            .then(res => setCounselors(res.data?.counselors || res.data || []))
            .catch(() => setCounselors([]));
    }, [isOpen]);

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
            agentId: "",
            counselorId: "",
        } as ConvertToStudentFormData,
        validators: { onChange: formSchema },
        onSubmit: async ({ value }) => {
            setIsSubmitting(true);
            try {
                const response = await axios.post(`/api/leads/${lead.id}/convert-to-student`, value);
                toast.success(response.data.message || "Lead converted to student successfully");

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
            <DialogContent className="p-0 gap-0 sm:max-w-[640px] overflow-hidden rounded-2xl border-0 shadow-2xl">
                {/* ── Gradient Header ── */}
                <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 px-6 pt-6 pb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-white text-lg font-bold leading-tight">
                                Convert Lead to Student
                            </DialogTitle>
                            <p className="text-blue-100 text-xs mt-0.5">
                                Review and confirm details before converting <span className="font-semibold">{lead?.name}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Form Body ── */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    className="flex flex-col"
                >
                    <div className="px-6 py-5 space-y-5 max-h-[66vh] overflow-y-auto">

                        {/* Personal Details */}
                        <SectionTitle>Personal Details</SectionTitle>
                        <div className="grid grid-cols-2 gap-3">
                            <form.Field name="name" children={(field) => (
                                <FieldWrapper icon={User} label="Full Name" required>
                                    <Input value={field.state.value} onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        className="h-9 rounded-xl bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-blue-500/50 text-sm" />
                                    <ErrorMessage field={field} />
                                </FieldWrapper>
                            )} />
                            <form.Field name="email" children={(field) => (
                                <FieldWrapper icon={Mail} label="Email">
                                    <Input value={field.state.value || ""} onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)} type="email"
                                        className="h-9 rounded-xl bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-blue-500/50 text-sm" />
                                    <ErrorMessage field={field} />
                                </FieldWrapper>
                            )} />
                            <form.Field name="phone" children={(field) => (
                                <FieldWrapper icon={Phone} label="Phone" required>
                                    <Input value={field.state.value} onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        className="h-9 rounded-xl bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-blue-500/50 text-sm" />
                                    <ErrorMessage field={field} />
                                </FieldWrapper>
                            )} />
                            <form.Field name="alternateNo" children={(field) => (
                                <FieldWrapper icon={Phone} label="Alternate No">
                                    <Input value={field.state.value || ""} onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        className="h-9 rounded-xl bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-blue-500/50 text-sm" />
                                </FieldWrapper>
                            )} />
                            <form.Field name="dateOfBirth" children={(field) => (
                                <FieldWrapper icon={Calendar} label="Date of Birth">
                                    <DatePicker value={field.state.value ?? ""}
                                        onChange={(val) => { field.handleChange(val); field.handleBlur(); }}
                                        placeholder="Pick a date" className="h-9 rounded-xl bg-muted/50 border-0 text-sm" />
                                </FieldWrapper>
                            )} />
                            <form.Field name="gender" children={(field) => (
                                <FieldWrapper icon={User} label="Gender">
                                    <Select value={field.state.value} onValueChange={(v) => field.handleChange(v)}>
                                        <SelectTrigger className="h-9 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-blue-500/50 text-sm">
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MALE">Male</SelectItem>
                                            <SelectItem value="FEMALE">Female</SelectItem>
                                            <SelectItem value="OTHER">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FieldWrapper>
                            )} />
                            <form.Field name="nationality" children={(field) => (
                                <FieldWrapper label="Nationality">
                                    <Input value={field.state.value || ""} onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        className="h-9 rounded-xl bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-blue-500/50 text-sm" />
                                </FieldWrapper>
                            )} />
                            <form.Field name="highestQualification" children={(field) => (
                                <FieldWrapper icon={BookOpen} label="Highest Qualification">
                                    <Input value={field.state.value || ""} onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        className="h-9 rounded-xl bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-blue-500/50 text-sm" />
                                </FieldWrapper>
                            )} />
                        </div>

                        {/* Passport Details */}
                        <SectionTitle>Passport Details</SectionTitle>
                        <div className="grid grid-cols-3 gap-3">
                            <form.Field name="passportNo" children={(field) => (
                                <FieldWrapper icon={IdCard} label="Passport No">
                                    <Input value={field.state.value || ""} onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        className="h-9 rounded-xl bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-blue-500/50 text-sm" />
                                </FieldWrapper>
                            )} />
                            <form.Field name="passportIssueDate" children={(field) => (
                                <FieldWrapper icon={Calendar} label="Issue Date">
                                    <DatePicker value={field.state.value ?? ""}
                                        onChange={(val) => { field.handleChange(val); field.handleBlur(); }}
                                        placeholder="Pick date" className="h-9 rounded-xl bg-muted/50 border-0 text-sm" />
                                </FieldWrapper>
                            )} />
                            <form.Field name="passportExpiryDate" children={(field) => (
                                <FieldWrapper icon={Calendar} label="Expiry Date">
                                    <DatePicker value={field.state.value ?? ""}
                                        onChange={(val) => { field.handleChange(val); field.handleBlur(); }}
                                        placeholder="Pick date" className="h-9 rounded-xl bg-muted/50 border-0 text-sm" />
                                </FieldWrapper>
                            )} />
                        </div>

                        {/* Address */}
                        <form.Field name="address" children={(field) => (
                            <FieldWrapper icon={MapPin} label="Address">
                                <Input value={field.state.value || ""} onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className="h-9 rounded-xl bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-blue-500/50 text-sm" />
                            </FieldWrapper>
                        )} />

                        {/* Assignment */}
                        <SectionTitle>Assignment</SectionTitle>
                        <div className="grid grid-cols-2 gap-3">
                            <form.Field name="agentId" children={(field) => (
                                <FieldWrapper icon={Briefcase} label="Assign Agent">
                                    <Select value={field.state.value || ""} onValueChange={(v) => field.handleChange(v === "__none__" ? "" : v)}>
                                        <SelectTrigger className="h-9 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-blue-500/50 text-sm">
                                            <SelectValue placeholder="Select agent (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">None</SelectItem>
                                            {agents.map((a: any) => (
                                                <SelectItem key={a.id} value={a.id}>
                                                    {a.name}
                                                    {a.agentProfile?.companyName ? ` — ${a.agentProfile.companyName}` : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FieldWrapper>
                            )} />
                            <form.Field name="counselorId" children={(field) => (
                                <FieldWrapper icon={UserCheck} label="Assign Counselor">
                                    <Select value={field.state.value || ""} onValueChange={(v) => field.handleChange(v === "__none__" ? "" : v)}>
                                        <SelectTrigger className="h-9 rounded-xl bg-muted/50 border-0 focus:ring-2 focus:ring-blue-500/50 text-sm">
                                            <SelectValue placeholder="Select counselor (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">None</SelectItem>
                                            {counselors.map((c: any) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FieldWrapper>
                            )} />
                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30 gap-3">
                        <p className="text-[11px] text-muted-foreground">
                            A welcome email with login credentials will be sent automatically.
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}
                                className="h-9 rounded-xl px-4 text-sm">
                                Cancel
                            </Button>
                            <form.Subscribe
                                selector={(state) => [state.canSubmit]}
                                children={([canSubmit]) => (
                                    <Button
                                        type="submit"
                                        disabled={!canSubmit || isSubmitting}
                                        className="h-9 rounded-xl px-5 text-sm bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-md shadow-blue-500/30 border-0"
                                    >
                                        {isSubmitting ? (
                                            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Converting...</>
                                        ) : (
                                            <><GraduationCap className="h-4 w-4 mr-2" />Convert & Save</>
                                        )}
                                    </Button>
                                )}
                            />
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
