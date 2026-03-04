"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";

function NewPasswordFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");
    const loginType = (searchParams.get("type") || "student") as "student" | "admin" | "agent" | "counselor";
    const isStudent = loginType === "student" && !!phone;
    const [isLoading, setIsLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [formData, setFormData] = useState({
        otp: "",
        password: "",
        confirmPassword: "",
    });

    // Role-specific accents
    const accents: Record<string, any> = {
        admin: { text: "text-indigo-600", eyebrow: "Admin Portal", borderHover: "hover:border-indigo-400", focusBorder: "focus-visible:border-indigo-500", ring: "focus-visible:ring-indigo-500/5", bg: "bg-indigo-600", shadow: "shadow-indigo-600/20", groupFocus: "group-focus-within:text-indigo-600" },
        student: { text: "text-teal-600", eyebrow: "Student Portal", borderHover: "hover:border-teal-400", focusBorder: "focus-visible:border-teal-500", ring: "focus-visible:ring-teal-500/5", bg: "bg-gradient-to-r from-teal-600 to-[#1EB3B1]", shadow: "shadow-teal-600/20", groupFocus: "group-focus-within:text-teal-600" },
        agent: { text: "text-blue-600", eyebrow: "Agent Portal", borderHover: "hover:border-blue-400", focusBorder: "focus-visible:border-blue-500", ring: "focus-visible:ring-blue-500/5", bg: "bg-blue-600", shadow: "shadow-blue-600/20", groupFocus: "group-focus-within:text-blue-600" },
        counselor: { text: "text-purple-600", eyebrow: "Counselor Portal", borderHover: "hover:border-purple-400", focusBorder: "focus-visible:border-purple-500", ring: "focus-visible:ring-purple-500/5", bg: "bg-purple-600", shadow: "shadow-purple-600/20", groupFocus: "group-focus-within:text-purple-600" },
    };

    const clr = accents[loginType] || accents.student;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password.length < 8) {
            toast.error("Password must be at least 8 characters long");
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            await axios.post("/api/auth/reset-password", {
                ...(isStudent ? { phone } : { email }),
                otp: formData.otp,
                newPassword: formData.password
            });
            toast.success("Password reset successful!");
            router.push(`/login?reset=success&type=${loginType}`);
        } catch (error: any) {
            const message = error.response?.data?.message || "Reset failed. Please check the OTP and try again.";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setResendLoading(true);
        try {
            await axios.post("/api/auth/forgot-password", {
                ...(isStudent ? { phone } : { email }),
                role: loginType,
            });
            toast.success(isStudent ? "New code sent to your WhatsApp!" : "New code sent to your email!");
        } catch {
            toast.error("Failed to resend code");
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-10">
                <div className={`text-[10px] uppercase tracking-[0.2em] ${clr.text} font-bold mb-2`}>
                    {clr.eyebrow}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                    Set New Password
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                    {isStudent
                        ? <>Enter the code sent to your <strong>WhatsApp ({phone})</strong> and choose a new password.</>
                        : <>Enter the code sent to your email and choose a strong new password.</>
                    }
                </p>
            </div>

            <div className="space-y-6">
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="reset-otp" className="text-[11px] font-bold uppercase tracking-wider text-gray-700 ml-1">
                                6-Digit OTP
                            </Label>
                            <div className="relative group">
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 ${clr.groupFocus} transition-colors`}>
                                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <Input
                                    id="reset-otp"
                                    type="text"
                                    required
                                    maxLength={6}
                                    placeholder="Enter 6-digit code"
                                    value={formData.otp}
                                    onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                                    className={`h-12 pl-11 rounded-xl border-gray-200 bg-white text-gray-900 transition-all placeholder:text-gray-400 ${clr.borderHover} ${clr.focusBorder} focus-visible:ring-4 ${clr.ring} shadow-sm`}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="new-password" className="text-[11px] font-bold uppercase tracking-wider text-gray-700 ml-1">
                                New Password
                            </Label>
                            <div className="relative group">
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 ${clr.groupFocus} transition-colors z-10`}>
                                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
                                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </div>
                                <PasswordInput
                                    id="new-password"
                                    required
                                    placeholder="At least 8 characters"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className={`h-12 pl-11 rounded-xl border-gray-200 bg-white text-gray-900 transition-all placeholder:text-gray-400 ${clr.borderHover} ${clr.focusBorder} focus-visible:ring-4 ${clr.ring} shadow-sm`}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="confirm-password" className="text-[11px] font-bold uppercase tracking-wider text-gray-700 ml-1">
                                Confirm Password
                            </Label>
                            <div className="relative group">
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 ${clr.groupFocus} transition-colors z-10`}>
                                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
                                        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <PasswordInput
                                    id="confirm-password"
                                    required
                                    placeholder="Repeat new password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className={`h-12 pl-11 rounded-xl border-gray-200 bg-white text-gray-900 transition-all placeholder:text-gray-400 ${clr.borderHover} ${clr.focusBorder} focus-visible:ring-4 ${clr.ring} shadow-sm`}
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className={`h-12 w-full rounded-xl ${clr.bg} text-sm font-bold text-white shadow-lg ${clr.shadow} transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50`}
                    >
                        {isLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                </form>

                <div className="text-center text-sm text-gray-500 font-medium pt-4 space-y-3">
                    <p>
                        Didn&apos;t receive the code?{" "}
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={resendLoading}
                            className={`${clr.text} font-bold hover:underline ml-1 disabled:opacity-50`}
                        >
                            {resendLoading ? "Sending..." : "Resend Code"}
                        </button>
                    </p>
                    <Link href={`/login?type=${loginType}`} className={`${clr.text} font-bold hover:underline`}>
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

export function NewPasswordForm() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewPasswordFormContent />
        </Suspense>
    );
}
