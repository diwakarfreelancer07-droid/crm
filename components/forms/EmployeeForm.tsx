"use client"

import { useSession } from 'next-auth/react'
import { useForm } from '@tanstack/react-form'
import { toast } from "sonner"
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { parseDate } from '@internationalized/date'
import { Label } from '@/components/ui/label'
import { useCreateEmployee, useUpdateEmployee, useEmployees } from '@/hooks/use-employees'
import { Employee } from '@/types/api'
import { PhoneInput } from '@/components/ui/phone-input'

const employeeSchema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    role: z.enum(["ADMIN", "MANAGER", "SALES_REP", "SUPPORT_AGENT", "EMPLOYEE", "AGENT", "COUNSELOR"]).optional(), // Made optional based on context
    department: z.string().min(2, "Department is required"),
    salary: z.coerce.number().min(0, "Salary must be a positive number"),
    joiningDate: z.string(),
    designation: z.string(),
    imageUrl: z.string().nullable(),
    agentId: z.string().optional().nullable(),
    // Agent specific
    companyName: z.string().optional(),
    address: z.string().optional(),
    commission: z.coerce.number().optional(),
});

interface EmployeeFormProps {
    employee?: Employee
    onSuccess?: () => void
    formId?: string
    defaultRole?: string
}

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

export default function EmployeeForm({ employee, onSuccess, formId, defaultRole }: EmployeeFormProps) {
    const createMutation = useCreateEmployee()
    const updateMutation = useUpdateEmployee()
    const { data: session } = useSession() as any;

    // Fetch staff members who can have counselors reporting to them
    const { data: managersData } = useEmployees("active", 1, 100, ""); // Will filter manually below to be safe or use query params if API supports multiple roles
    const availableManagers = managersData?.employees?.filter((emp: any) =>
        ["AGENT", "SALES_REP", "MANAGER", "ADMIN"].includes(emp.role)
    ) || [];


    const form = useForm({
        defaultValues: {
            phone: employee?.phone || '',
            email: employee?.email || '',
            firstName: employee?.firstName || '',
            lastName: employee?.lastName || '',
            department: employee?.department || '',
            designation: employee?.designation || '',
            joiningDate: employee?.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : '',
            salary: employee?.salary || 0,
            imageUrl: employee?.imageUrl || null,
            password: '',
            role: employee?.role || defaultRole || 'EMPLOYEE',
            agentId: (employee as any)?.counselorProfile?.agentId || '',
            companyName: (employee as any)?.agentProfile?.companyName || '',
            address: (employee as any)?.agentProfile?.address || '',
            commission: (employee as any)?.agentProfile?.commission || 0,
        },
        // @ts-ignore
        validatorAdapter: zodValidator(),
        validators: {
            onChange: employeeSchema,
        },
        onSubmit: async ({ value }) => {
            try {
                // Construct the payload matching the API expectation
                const payload: any = {
                    ...value,
                    name: `${value.firstName} ${value.lastName}`.trim(),
                    salary: value.salary ? parseFloat(value.salary.toString()) : 0,
                    imageUrl: value.imageUrl
                };

                if (payload.password === "") {
                    delete payload.password;
                }

                if (employee && employee.id) {
                    await updateMutation.mutateAsync({ id: employee.id, data: payload })
                    toast.success("Counselor updated successfully");
                } else {
                    // For creation, password is required
                    if (!payload.password) {
                        toast.error("Password is required for new employees");
                        return;
                    }
                    // @ts-ignore
                    await createMutation.mutateAsync(payload)
                    toast.success("Counselor created successfully");
                }
                onSuccess?.()
            } catch (error: any) {
                console.error("Form submission error:", error)
                const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || "Failed to submit form";
                toast.error(errorMsg);
            }
        },
    })

    return (
        <div className="space-y-4 py-4">
            <form
                id={formId}
                onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    form.handleSubmit()
                }}
                className="space-y-4"
            >
                <div className="flex justify-center mb-6">
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

                <div className="grid grid-cols-2 gap-4">
                    <form.Field
                        name="firstName"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>First Name</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                                <ErrorMessage field={field} />
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
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
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
                                <Label htmlFor={field.name}>Phone</Label>
                                <PhoneInput
                                    value={field.state.value}
                                    onChange={(phone) => field.handleChange(phone)}
                                    error={!!field.state.meta.errors.length && field.state.meta.isTouched}
                                />
                                <ErrorMessage field={field} />
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
                                    name={field.name}
                                    type="email"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                                <ErrorMessage field={field} />
                            </div>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <form.Field
                        name="password"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Password {employee ? "(Leave blank to keep)" : "*"}</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    type="password"
                                    value={field.state.value || ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={employee ? "••••••••" : "Enter password"}
                                />
                                <ErrorMessage field={field} />
                            </div>
                        )}
                    />
                </div>

                {(session?.user?.role === 'ADMIN') && (
                    <div className="grid grid-cols-2 gap-4">
                        <form.Field
                            name="role"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>Role</Label>
                                    <select
                                        id={field.name}
                                        name={field.name}
                                        value={field.state.value || "EMPLOYEE"}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value as any)}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="EMPLOYEE">Staff / Employee</option>
                                        <option value="COUNSELOR">Counselor</option>
                                        <option value="AGENT">Agent / Partner</option>
                                        <option value="SALES_REP">Sales Rep</option>
                                        <option value="SUPPORT_AGENT">Support Agent</option>
                                        <option value="MANAGER">Manager</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                    <ErrorMessage field={field} />
                                </div>
                            )}
                        />
                    </div>
                )}

                {form.state.values.role === 'AGENT' && (
                    <div className="grid grid-cols-2 gap-4">
                        <form.Field
                            name="companyName"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>Company Name</Label>
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                    <ErrorMessage field={field} />
                                </div>
                            )}
                        />
                        <form.Field
                            name="commission"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>Commission (%)</Label>
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        type="number"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(Number(e.target.value))}
                                    />
                                    <ErrorMessage field={field} />
                                </div>
                            )}
                        />
                    </div>
                )}

                {form.state.values.role === 'AGENT' && (
                    <div className="grid grid-cols-1 gap-4">
                        <form.Field
                            name="address"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>Office Address</Label>
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                    <ErrorMessage field={field} />
                                </div>
                            )}
                        />
                    </div>
                )}

                {form.state.values.role === 'COUNSELOR' && session?.user?.role === 'ADMIN' && (
                    <div className="grid grid-cols-2 gap-4">
                        <form.Field
                            name="agentId"
                            children={(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>Reports To (Manager/Agent)</Label>
                                    <select
                                        id={field.name}
                                        name={field.name}
                                        value={field.state.value || ""}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">Select Manager / Agent</option>
                                        {availableManagers.map((manager: any) => (
                                            <option key={manager.id} value={manager.agentProfile?.id || manager.id}>
                                                {manager.name} ({manager.role})
                                            </option>
                                        ))}
                                    </select>
                                    <ErrorMessage field={field} />
                                </div>
                            )}
                        />
                    </div>
                )}


                <div className="grid grid-cols-2 gap-4">
                    <form.Field
                        name="department"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Department</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                                <ErrorMessage field={field} />
                            </div>
                        )}
                    />
                    <form.Field
                        name="designation"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Designation</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                                <ErrorMessage field={field} />
                            </div>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <form.Field
                        name="joiningDate"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Joining Date</Label>
                                <DatePicker
                                    id={field.name}
                                    name={field.name}
                                    value={(() => {
                                        try {
                                            return field.state.value ? [parseDate(field.state.value)] : []
                                        } catch (e) {
                                            return []
                                        }
                                    })()}
                                    onValueChange={(details) => {
                                        if (details.value && details.value[0]) {
                                            field.handleChange(details.value[0].toString())
                                        } else {
                                            field.handleChange('')
                                        }
                                    }}
                                    placeholder="Select date"
                                />
                                <ErrorMessage field={field} />
                            </div>
                        )}
                    />
                    <form.Field
                        name="salary"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Salary</Label>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    type="number"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(Number(e.target.value))}
                                />
                                <ErrorMessage field={field} />
                            </div>
                        )}
                    />
                </div>

                <div className="hidden">
                    {/* Buttons are now handled externally via formId */}
                    <Button type="submit" id="submit-employee-form">Submit</Button>
                </div>
            </form>
        </div>
    )
}
