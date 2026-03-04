"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";

function OTPVerificationFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");
    const channel = searchParams.get("channel") || "email"; // "whatsapp" | "email"
    const loginType = (searchParams.get("role") || "student") as "student" | "admin" | "agent" | "counselor";
    const [isLoading, setIsLoading] = useState(false);
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);

    // Role-specific accents
    const accents: Record<string, any> = {
        admin: { text: "text-indigo-600", eyebrow: "Admin Portal", borderHover: "hover:border-indigo-400", focusBorder: "focus-visible:border-indigo-500", ring: "focus-visible:ring-indigo-500/5", bg: "bg-indigo-600", shadow: "shadow-indigo-600/20", groupFocus: "group-focus-within:text-indigo-600" },
        student: { text: "text-teal-600", eyebrow: "Student Portal", borderHover: "hover:border-teal-400", focusBorder: "focus-visible:border-teal-500", ring: "focus-visible:ring-teal-500/5", bg: "bg-gradient-to-r from-teal-600 to-[#1EB3B1]", shadow: "shadow-teal-600/20", groupFocus: "group-focus-within:text-teal-600" },
        agent: { text: "text-blue-600", eyebrow: "Agent Portal", borderHover: "hover:border-blue-400", focusBorder: "focus-visible:border-blue-500", ring: "focus-visible:ring-blue-500/5", bg: "bg-blue-600", shadow: "shadow-blue-600/20", groupFocus: "group-focus-within:text-blue-600" },
        counselor: { text: "text-purple-600", eyebrow: "Counselor Portal", borderHover: "hover:border-purple-400", focusBorder: "focus-visible:border-purple-500", ring: "focus-visible:ring-purple-500/5", bg: "bg-purple-600", shadow: "shadow-purple-600/20", groupFocus: "group-focus-within:text-purple-600" },
    };

    const clr = accents[loginType] || accents.student;

    // WhatsApp icon SVG inline
    const WhatsAppIcon = () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-500 inline-block mr-1">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
    );

    useEffect(() => {
        if (!email) {
            toast.error("Invalid verification session");
            router.push("/register");
        }
    }, [email, router]);

    const handleChange = (index: number, value: string) => {
        if (value.length <= 1 && /^\d*$/.test(value)) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            if (value && index < 5) {
                const nextInput = document.getElementById(`otp-${index + 1}`);
                nextInput?.focus();
            } else if (value && index === 5) {
                // Auto-submit when the last digit is entered
                const fullOtp = newOtp.join("");
                if (fullOtp.length === 6) {
                    setTimeout(() => {
                        handleVerify(null as any, fullOtp);
                    }, 100);
                }
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleVerify = async (e?: React.FormEvent, overrideCode?: string) => {
        if (e) e.preventDefault();
        const code = overrideCode || otp.join("");
        if (code.length !== 6) {
            toast.error("Please enter 6-digit code");
            return;
        }

        setIsLoading(true);
        try {
            await axios.post("/api/auth/verify", { email, otp: code });
            toast.success(channel === "whatsapp" ? "WhatsApp verified successfully!" : "Email verified successfully!");
            router.push(`/login?verified=true&type=${loginType}&channel=${channel}`);
        } catch (error: any) {
            const message = error.response?.data?.message || "Verification failed. Please check the code and try again.";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            // For students, send phone so the backend triggers WhatsApp OTP
            await axios.post("/api/auth/forgot-password", {
                email,
                phone: loginType === "student" ? phone : undefined,
                role: loginType,
            });
            toast.success(channel === "whatsapp" ? "New code sent to your WhatsApp!" : "New code sent to your email!");
        } catch (error) {
            toast.error("Failed to resend code");
        }
    };

    // Determine where OTP was sent
    const otpDestination = channel === "whatsapp" && phone
        ? `your WhatsApp (${phone.replace(/(\+?\d{2})(\d{3})(\d{3})(\d{4})/, "$1 $2 $3 $4")})`
        : email;

    const headingText = channel === "whatsapp" ? "Verify WhatsApp" : "Verify Email";

    return (
        <div className="w-full">
            <div className="mb-10">
                <div className={`text-[10px] uppercase tracking-[0.2em] ${clr.text} font-bold mb-2 transition-colors`}>
                    {clr.eyebrow}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                    {headingText}
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                    {channel === "whatsapp" ? (
                        <>
                            Enter the 6-digit code sent to{" "}
                            <strong className="flex items-center inline-flex">
                                <WhatsAppIcon />
                                {otpDestination}
                            </strong>
                        </>
                    ) : (
                        <>Enter the 6-digit code sent to <strong>{otpDestination}</strong> to verify your account.</>
                    )}
                </p>
            </div>

            <div className="space-y-8">
                <form className="space-y-6" onSubmit={handleVerify}>
                    <div className="flex gap-2 sm:gap-3 justify-between">
                        {otp.map((digit, index) => (
                            <div key={index} className="relative group">
                                <Input
                                    id={`otp-${index}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className={`h-12 w-10 sm:h-14 sm:w-14 text-center text-xl font-bold rounded-xl border-gray-200 bg-white text-gray-900 transition-all ${clr.borderHover} ${clr.focusBorder} focus-visible:ring-4 ${clr.ring} shadow-sm`}
                                />
                            </div>
                        ))}
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className={`h-12 w-full rounded-xl ${clr.bg} text-sm font-bold text-white shadow-lg ${clr.shadow} transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50`}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Verifying...</span>
                            </div>
                        ) : "Verify Code"}
                    </Button>
                </form>

                <div className="text-center space-y-4 pt-2">
                    <p className="text-sm text-gray-500 font-medium">
                        Didn&apos;t receive the code?{" "}
                        <button
                            type="button"
                            onClick={handleResend}
                            className={`${clr.text} font-bold hover:underline ml-1 transition-colors`}
                        >
                            Resend Code
                        </button>
                    </p>
                    <div className="pt-2 border-t border-gray-100">
                        <Link href={`/login?type=${loginType}`} className="text-sm text-gray-400 font-bold hover:text-gray-600 transition-colors">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function OTPVerificationForm() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <OTPVerificationFormContent />
        </Suspense>
    )
}
