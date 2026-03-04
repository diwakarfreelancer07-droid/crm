"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";

function ForgotPasswordFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const loginType = (searchParams.get("type") || "student") as "student" | "admin" | "agent" | "counselor";
    const isStudent = loginType === "student";
    const [isLoading, setIsLoading] = useState(false);
    const [identifier, setIdentifier] = useState(""); // phone for students, email for others

    const accents: Record<string, any> = {
        admin: { text: "text-indigo-600", eyebrow: "Admin Portal", borderHover: "hover:border-indigo-400", focusBorder: "focus-visible:border-indigo-500", ring: "focus-visible:ring-indigo-500/5", bg: "bg-indigo-600", shadow: "shadow-indigo-600/20", groupFocus: "group-focus-within:text-indigo-600" },
        student: { text: "text-teal-600", eyebrow: "Student Portal", borderHover: "hover:border-teal-400", focusBorder: "focus-visible:border-teal-500", ring: "focus-visible:ring-teal-500/5", bg: "bg-gradient-to-r from-teal-600 to-[#1EB3B1]", shadow: "shadow-teal-600/20", groupFocus: "group-focus-within:text-teal-600" },
        agent: { text: "text-blue-600", eyebrow: "Agent Portal", borderHover: "hover:border-blue-400", focusBorder: "focus-visible:border-blue-500", ring: "focus-visible:ring-blue-500/5", bg: "bg-blue-600", shadow: "shadow-blue-600/20", groupFocus: "group-focus-within:text-blue-600" },
        counselor: { text: "text-purple-600", eyebrow: "Counselor Portal", borderHover: "hover:border-purple-400", focusBorder: "focus-visible:border-purple-500", ring: "focus-visible:ring-purple-500/5", bg: "bg-purple-600", shadow: "shadow-purple-600/20", groupFocus: "group-focus-within:text-purple-600" },
    };

    const clr = accents[loginType] || accents.student;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isStudent) {
            const digits = identifier.replace(/\D/g, '');
            if (digits.length < 10) {
                toast.error("Please enter a valid mobile number");
                return;
            }
        } else if (!identifier.includes("@")) {
            toast.error("Please enter a valid email address");
            return;
        }

        setIsLoading(true);
        try {
            await axios.post("/api/auth/forgot-password", {
                ...(isStudent ? { phone: identifier } : { email: identifier }),
                role: loginType,
            });
            toast.success(isStudent ? "OTP sent to your WhatsApp!" : "If an account exists, an OTP has been sent.");
            const params = new URLSearchParams({
                type: loginType,
                ...(isStudent ? { phone: identifier } : { email: identifier }),
            });
            router.push(`/new-password?${params.toString()}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to send reset code. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="mb-10">
                <div className={`text-[10px] uppercase tracking-[0.2em] ${clr.text} font-bold mb-2`}>
                    {clr.eyebrow}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                    Forgot Password
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                    {isStudent
                        ? "Enter your registered mobile number and we'll send a reset code to your WhatsApp."
                        : "Enter your email address and we'll send you a code to reset your password."}
                </p>
            </div>

            <div className="space-y-6">
                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="forgot-identifier" className="text-[11px] font-bold uppercase tracking-wider text-gray-700 ml-1">
                                {isStudent ? "Mobile Number" : "Email Address"}
                            </Label>
                            <div className="relative group">
                                <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 ${clr.groupFocus} transition-colors`}>
                                    {isStudent ? (
                                        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
                                            <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    ) : (
                                        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
                                            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                </div>
                                <Input
                                    id="forgot-identifier"
                                    type={isStudent ? "tel" : "email"}
                                    placeholder={isStudent ? "+91 98765 43210" : "example@email.com"}
                                    autoComplete={isStudent ? "tel" : "email"}
                                    required
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
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
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Sending...</span>
                            </div>
                        ) : isStudent ? "Send WhatsApp Code" : "Send Reset Code"}
                    </Button>
                </form>

                <div className="text-center text-sm text-gray-500 font-medium pt-4">
                    Remember your password?{" "}
                    <Link href={`/login?type=${loginType}`} className={`${clr.text} font-bold hover:underline`}>
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

export function ForgotPasswordForm() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ForgotPasswordFormContent />
        </Suspense>
    );
}
