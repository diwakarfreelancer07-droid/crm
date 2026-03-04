"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";

export function RegisterForm({
    onRoleChange,
    fixedRole
}: {
    onRoleChange?: (role: "student" | "agent") => void;
    fixedRole?: "student" | "agent";
}) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: (fixedRole || "student") as "student" | "agent",
    });

    const handleRoleChange = (newRole: "student" | "agent") => {
        if (fixedRole) return; // Prevent change if fixed
        setFormData({ ...formData, role: newRole });
        onRoleChange?.(newRole);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Validation
        if (formData.password.length < 8) {
            toast.error("Password must be at least 8 characters long");
            return;
        }

        if (formData.phone.length < 10) {
            toast.error("Please enter a valid phone number");
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post("/api/auth/register", formData);
            toast.success(response.data.message);
            // Pass email, phone and role to verification page via search params
            const params = new URLSearchParams({
                email: formData.email,
                phone: formData.phone,
                role: formData.role,
                channel: response.data.otpChannel || 'email',
            });
            router.push(`/verify-otp?${params.toString()}`);
        } catch (error: any) {
            const message = error.response?.data?.message || "Registration failed. Please try again.";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const isStudent = formData.role === "student";

    // Role-specific accents
    const accents: Record<string, any> = {
        admin: { text: "text-indigo-600", eyebrow: "Admin Portal", borderHover: "hover:border-indigo-400", focusBorder: "focus-visible:border-indigo-500", ring: "focus-visible:ring-indigo-500/5", bg: "bg-indigo-600", shadow: "shadow-indigo-600/20", groupFocus: "group-focus-within:text-indigo-600" },
        student: { text: "text-teal-600", eyebrow: "Student Portal", borderHover: "hover:border-teal-400", focusBorder: "focus-visible:border-teal-500", ring: "focus-visible:ring-teal-500/5", bg: "bg-gradient-to-r from-teal-600 to-[#1EB3B1]", shadow: "shadow-teal-600/20", groupFocus: "group-focus-within:text-teal-600" },
        agent: { text: "text-blue-600", eyebrow: "Agent Portal", borderHover: "hover:border-blue-400", focusBorder: "focus-visible:border-blue-500", ring: "focus-visible:ring-blue-500/5", bg: "bg-blue-600", shadow: "shadow-blue-600/20", groupFocus: "group-focus-within:text-blue-600" },
        counselor: { text: "text-purple-600", eyebrow: "Counselor Portal", borderHover: "hover:border-purple-400", focusBorder: "focus-visible:border-purple-500", ring: "focus-visible:ring-purple-500/5", bg: "bg-purple-600", shadow: "shadow-purple-600/20", groupFocus: "group-focus-within:text-purple-600" },
    };

    const clr = accents[formData.role] || accents.student;

    return (
        <div className="w-full">
            <div className="mb-8">
                <div className={`text-[10px] uppercase tracking-[0.2em] ${clr.text} font-bold mb-2 transition-colors`}>
                    {clr.eyebrow}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                    Create Account
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                    {formData.role === "student"
                        ? "Join our global community and start your education journey."
                        : "Partner with us to help students achieve their dreams."}
                </p>
            </div>

            <div className="space-y-6">
                {/* Role Selector - Only show if role is NOT fixed */}
                {!fixedRole && (
                    <div className="flex p-1 bg-gray-100 rounded-xl mb-2">
                        <button
                            type="button"
                            onClick={() => handleRoleChange("student")}
                            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${isStudent ? "bg-white text-teal-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Student
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRoleChange("agent")}
                            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${!isStudent ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Agent
                        </button>
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="reg-name" className="text-[11px] font-bold uppercase tracking-wider text-gray-700 ml-1">
                                Full Name
                            </Label>
                            <div className="relative group">
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 ${clr.groupFocus} transition-colors`}>
                                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                                <Input
                                    id="reg-name"
                                    type="text"
                                    placeholder="John Doe"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={`h-11 pl-11 rounded-xl border-gray-200 bg-white text-gray-900 transition-all placeholder:text-gray-400 ${clr.borderHover} ${clr.focusBorder} focus-visible:ring-4 ${clr.ring} shadow-sm`}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="reg-email" className="text-[11px] font-bold uppercase tracking-wider text-gray-700 ml-1">
                                Email Address
                            </Label>
                            <div className="relative group">
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 ${clr.groupFocus} transition-colors`}>
                                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
                                        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <Input
                                    id="reg-email"
                                    type="email"
                                    placeholder="example@email.com"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={`h-11 pl-11 rounded-xl border-gray-200 bg-white text-gray-900 transition-all placeholder:text-gray-400 ${clr.borderHover} ${clr.focusBorder} focus-visible:ring-4 ${clr.ring} shadow-sm`}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="reg-phone" className="text-[11px] font-bold uppercase tracking-wider text-gray-700 ml-1">
                                Phone Number
                            </Label>
                            <div className="relative group">
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 ${clr.groupFocus} transition-colors`}>
                                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
                                        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <Input
                                    id="reg-phone"
                                    type="tel"
                                    placeholder="+91 98765 43210"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className={`h-11 pl-11 rounded-xl border-gray-200 bg-white text-gray-900 transition-all placeholder:text-gray-400 ${clr.borderHover} ${clr.focusBorder} focus-visible:ring-4 ${clr.ring} shadow-sm`}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="reg-password" className="text-[11px] font-bold uppercase tracking-wider text-gray-700 ml-1">
                                Password
                            </Label>
                            <div className="relative group">
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 ${clr.groupFocus} transition-colors z-10`}>
                                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
                                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </div>
                                <PasswordInput
                                    id="reg-password"
                                    placeholder="At least 8 characters"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className={`h-11 pl-11 rounded-xl border-gray-200 bg-white text-gray-900 transition-all placeholder:text-gray-400 ${clr.borderHover} ${clr.focusBorder} focus-visible:ring-4 ${clr.ring} shadow-sm`}
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className={`h-12 w-full rounded-xl ${clr.bg} text-sm font-bold text-white shadow-lg ${clr.shadow} transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2`}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Creating account...</span>
                            </div>
                        ) : "Register Account"}
                    </Button>
                </form>

                <div className="text-center text-sm text-gray-500 font-medium">
                    Already have an account?{" "}
                    <Link href={`/login?type=${formData.role}`} className={`${clr.text} font-bold hover:underline transition-colors`}>
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
