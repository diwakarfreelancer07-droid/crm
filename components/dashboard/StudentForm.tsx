"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SheetClose } from "@/components/ui/sheet";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";

interface CustomerFormProps {
    customerId?: string;
    onSuccess: () => void;
}

const customerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().min(10, "Phone must be at least 10 digits"),
});

type CustomerFormData = z.infer<typeof customerSchema>;

function ErrorMessage({ field }: { field: any }) {
    if (!field.state.meta.isTouched || !field.state.meta.errors.length) return null

    return (
        <p className="text-sm text-red-500">
            {field.state.meta.errors
                .map((e: any) => (typeof e === 'object' && e?.message ? e.message : e))
                .join(', ')}
        </p>
    )
}

export function CustomerForm({ customerId, onSuccess }: CustomerFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm({
        // @ts-ignore
        validatorAdapter: zodValidator(),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
        } as CustomerFormData,
        validators: {
            onChange: customerSchema,
        },
        onSubmit: async ({ value }) => {
            setIsLoading(true);
            try {
                if (customerId) {
                    await axios.patch(`/api/customers/${customerId}`, value);
                    toast.success("Customer updated successfully");
                } else {
                    await axios.post("/api/customers", value);
                    toast.success("Customer created successfully");
                }
                onSuccess();
            } catch (error: any) {
                toast.error(error.response?.data?.error || "Failed to save customer");
            } finally {
                setIsLoading(false);
            }
        },
    });

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-2">
                <form
                    id="customer-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    className="space-y-6"
                >
                    <form.Field
                        name="name"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
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
                                <Label htmlFor="phone">Phone *</Label>
                                <Input
                                    id="phone"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className="rounded-xl"
                                />
                                <ErrorMessage field={field} />
                            </div>
                        )}
                    />
                </form>
            </div>

            <div className="p-6 border-t bg-background sticky bottom-0 flex justify-end gap-3 custom-sheet-footer">
                <SheetClose asChild>
                    <Button variant="outline" type="button" className="rounded-xl">Cancel</Button>
                </SheetClose>
                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isSubmitting]) => (
                        <Button
                            onClick={() => form.handleSubmit()}
                            type="button"
                            className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-sm px-8"
                            disabled={!canSubmit || isLoading}
                        >
                            {isLoading ? "Saving..." : (customerId ? "Update Customer" : "Create Customer")}
                        </Button>
                    )}
                />
            </div>
        </div>
    );
}
