"use client"

import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateStudent, useUpdateStudent } from '@/hooks/useApi'
import { Student } from '@/types/api'
import { useEffect } from 'react'
import { PhoneInput } from '@/components/ui/phone-input'
import { AddressSelector } from '@/components/ui/address-selector'
import { ImageUpload } from "@/components/ui/image-upload";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const studentSchema = z.object({
    phone: z.string().min(10, 'Phone must be at least 10 characters'),
    email: z.string().email('Invalid email address'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    status: z.string().default('NEW'),
    savedAddresses: z.array(z.object({
        name: z.string().min(1, 'Label is required'),
        address: z.string().min(1, 'Address is required'),
        city: z.string(),
        state: z.string(),
        country: z.string(),
        isDefault: z.boolean().optional(),
    })),
    imageUrl: z.string().nullable(),
})

interface StudentFormProps {
    student?: Student
    onSuccess?: () => void
    formId?: string
}

// Helper to split full name
const splitName = (fullName: string = '') => {
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    return { firstName, lastName };
};

export default function StudentForm({ student, onSuccess, formId }: StudentFormProps) {
    const createMutation = useCreateStudent()
    const updateMutation = useUpdateStudent()

    // Derive initial values
    const initialName = student?.name || student?.user?.name || '';
    const { firstName: initialFirst, lastName: initialLast } = splitName(initialName);

    const form = useForm({
        defaultValues: {
            phone: student?.phone || student?.user?.phone || '',
            email: student?.email || student?.user?.email || '',
            firstName: initialFirst,
            lastName: initialLast,
            status: student?.status || 'NEW',
            savedAddresses: student?.savedAddresses || [],
            imageUrl: student?.imageUrl || null,
        },
        // @ts-ignore
        validatorAdapter: zodValidator(),
        validators: {
            onBlur: studentSchema,
        },
        onSubmit: async ({ value }) => {
            try {
                // Construct payload for API
                const payload = {
                    ...value,
                    name: `${value.firstName} ${value.lastName}`.trim(),
                };

                if (student?.id) {
                    await updateMutation.mutateAsync({ id: student.id, data: payload })
                } else {
                    await createMutation.mutateAsync(payload)
                }
                onSuccess?.()
            } catch (error: any) {
                console.error('Form submission error:', error)
                toast.error(error.message || "Failed to submit form. Please check details.")
            }
        },
    })

    useEffect(() => {
        if (student) {
            const nameToSplit = student.name || student.user?.name || '';
            const { firstName, lastName } = splitName(nameToSplit);

            form.setFieldValue('phone', student.phone || student.user?.phone || '')
            form.setFieldValue('email', student.email || student.user?.email || '')
            form.setFieldValue('firstName', firstName)
            form.setFieldValue('lastName', lastName)
            form.setFieldValue('status', student.status || 'NEW')
            form.setFieldValue('savedAddresses', student.savedAddresses || [])
            form.setFieldValue('imageUrl', student.imageUrl || null)
        }
    }, [student])

    return (
        <div className="py-2">
            <form
                id={formId}
                onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    form.handleSubmit()
                }}
                className="space-y-8"
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

                {/* Personal Information */}
                <div className="space-y-5">
                    <div className="flex items-center gap-2 pb-3 border-b">
                        <div className="h-1 w-1 rounded-full bg-primary"></div>
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Personal Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <form.Field
                            name="firstName"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>First Name</Label>
                                    <Input
                                        id={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                    {field.state.meta.errors && field.state.meta.isTouched ? (
                                        <p className="text-sm text-red-500">{field.state.meta.errors.join(', ')}</p>
                                    ) : null}
                                </div>
                            )}
                        />

                        <form.Field
                            name="lastName"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>Last Name</Label>
                                    <Input
                                        id={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                    {field.state.meta.errors && field.state.meta.isTouched ? (
                                        <p className="text-sm text-red-500">{field.state.meta.errors.join(', ')}</p>
                                    ) : null}
                                </div>
                            )}
                        />
                    </div>

                    <form.Field
                        name="status"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Status</Label>
                                <Select
                                    value={field.state.value}
                                    onValueChange={field.handleChange}
                                >
                                    <SelectTrigger id={field.name}>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NEW">New</SelectItem>
                                        <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                                        <SelectItem value="COUNSELLING_SCHEDULED">Counselling Scheduled</SelectItem>
                                        <SelectItem value="COUNSELLING_COMPLETED">Counselling Completed</SelectItem>
                                        <SelectItem value="DOCUMENT_PENDING">Document Pending</SelectItem>
                                        <SelectItem value="DOCUMENT_VERIFIED">Document Verified</SelectItem>
                                        <SelectItem value="INTERESTED">Interested</SelectItem>
                                        <SelectItem value="NOT_INTERESTED">Not Interested</SelectItem>
                                        <SelectItem value="NOT_ELIGIBLE">Not Eligible</SelectItem>
                                        <SelectItem value="ON_HOLD">On Hold</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    />

                    <form.Field
                        name="phone"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Phone</Label>
                                <PhoneInput
                                    value={field.state.value}
                                    onChange={(phone) => field.handleChange(phone)}
                                />
                                {field.state.meta.errors && field.state.meta.isTouched ? (
                                    <p className="text-sm text-red-500">{field.state.meta.errors.join(', ')}</p>
                                ) : null}
                            </div>
                        )}
                    />

                    <form.Field
                        name="email"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Email</Label>
                                <Input
                                    id={field.name}
                                    type="email"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                                {field.state.meta.errors && field.state.meta.isTouched ? (
                                    <p className="text-sm text-red-500">{field.state.meta.errors.join(', ')}</p>
                                ) : null}
                            </div>
                        )}
                    />
                </div>

                {/* Saved Addresses */}
                <div className="space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b">
                        <div className="flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-primary"></div>
                            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Saved Addresses</h3>
                        </div>
                        <form.Field
                            name="savedAddresses"
                            mode="array"
                            children={(field) => (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => field.pushValue({
                                        name: '',
                                        address: '',
                                        city: '',
                                        state: '',
                                        country: '',
                                        isDefault: false,
                                    })}
                                    size="sm"
                                >
                                    + Add Address
                                </Button>
                            )}
                        />
                    </div>

                    <form.Field
                        name="savedAddresses"
                        mode="array"
                        children={(field) => (
                            <div className="space-y-4">
                                {field.state.value?.map((_, i) => (
                                    <div key={i} className="relative group">
                                        <div className="flex flex-col gap-5 p-5 border border-border rounded-xl bg-card hover:shadow-sm transition-shadow">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                                        {i + 1}
                                                    </div>
                                                    <span className="text-sm font-medium text-muted-foreground">Address #{i + 1}</span>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => field.removeValue(i)}
                                                >
                                                    ✕
                                                </Button>
                                            </div>

                                            <form.Field
                                                name={`savedAddresses[${i}].name`}
                                                children={(subField) => (
                                                    <div className="space-y-2">
                                                        <Label>Label (e.g. Home, Work)</Label>
                                                        <Input
                                                            value={subField.state.value}
                                                            onBlur={subField.handleBlur}
                                                            onChange={(e) => subField.handleChange(e.target.value)}
                                                            placeholder="Home, Work, etc."
                                                        />
                                                    </div>
                                                )}
                                            />

                                            <form.Field
                                                name={`savedAddresses[${i}]`}
                                                children={(subField) => (
                                                    <AddressSelector
                                                        key={`address-${i}-${subField.state.value.country || 'new'}`}
                                                        value={subField.state.value.address}
                                                        initialCountry={subField.state.value.country}
                                                        initialState={subField.state.value.state}
                                                        initialCity={subField.state.value.city}
                                                        onChange={(val) => {
                                                            // Handled by onStructuredChange
                                                        }}
                                                        onStructuredChange={(data) => {
                                                            subField.setValue({
                                                                ...subField.state.value,
                                                                address: data.address,
                                                                city: data.city,
                                                                state: data.state,
                                                                country: data.country
                                                            })
                                                        }}
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    />
                </div>

                <button type="submit" className="hidden" />
            </form>
        </div>
    )
}
