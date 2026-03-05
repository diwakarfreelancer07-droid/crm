"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface LoginFormProps {
  loginType?: 'student' | 'admin' | 'agent' | 'counselor';
}

function LoginFormContent({ loginType = 'student' }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // For students: phone + password. For others: email + password.
  const isStudent = loginType === 'student';
  const [formData, setFormData] = useState({
    identifier: "", // phone for student, email for others
    password: "",
  });

  const getWelcomeText = () => {
    switch (loginType) {
      case 'admin':
        return { eyebrow: 'Restricted Access', title: 'Welcome back', subtitle: 'Sign in with your admin credentials to continue.' };
      case 'agent':
        return { eyebrow: 'InterWise Agent', title: 'Welcome back', subtitle: 'Sign in with your Agent ID and password to access your recruitment dashboard.' };
      case 'counselor':
        return { eyebrow: 'Counselor Portal', title: 'Welcome back', subtitle: 'Sign in with your counselor credentials to continue.' };
      default:
        return { eyebrow: 'Student Portal', title: 'Welcome back', subtitle: 'Enter your mobile number and password to access your global journey.' };
    }
  };

  const { eyebrow, title, subtitle } = getWelcomeText();

  const accents: Record<string, any> = {
    admin: { text: "text-indigo-600", borderHover: "hover:border-indigo-400", focusBorder: "focus-visible:border-indigo-500", ring: "focus-visible:ring-indigo-500/5", accent: "accent-indigo-600", groupFocus: "group-focus-within:text-indigo-600", groupHoverText: "group-hover:text-indigo-600", focusRing: "focus:ring-indigo-500" },
    student: { text: "text-cyan-600", borderHover: "hover:border-cyan-400", focusBorder: "focus-visible:border-cyan-500", ring: "focus-visible:ring-cyan-500/5", accent: "accent-cyan-600", groupFocus: "group-focus-within:text-cyan-600", groupHoverText: "group-hover:text-cyan-600", focusRing: "focus:ring-cyan-500" },
    agent: { text: "text-blue-600", borderHover: "hover:border-blue-400", focusBorder: "focus-visible:border-blue-500", ring: "focus-visible:ring-blue-500/5", accent: "accent-blue-600", groupFocus: "group-focus-within:text-blue-600", groupHoverText: "group-hover:text-blue-600", focusRing: "focus:ring-blue-500" },
    counselor: { text: "text-purple-600", borderHover: "hover:border-purple-400", focusBorder: "focus-visible:border-purple-500", ring: "focus-visible:ring-purple-500/5", accent: "accent-purple-600", groupFocus: "group-focus-within:text-purple-600", groupHoverText: "group-hover:text-purple-600", focusRing: "focus:ring-purple-500" },
  };

  const clr = accents[loginType] || accents.student;

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      if (errorParam === "Callback") {
        const errorMsg = "Login failed. You may not be authorized.";
        setError(errorMsg);
        toast.error(errorMsg);
      } else if (errorParam === "OAuthAccountNotLinked") {
        const errorMsg = "To confirm your identity, sign in with the same account you used originally.";
        setError(errorMsg);
        toast.error(errorMsg);
      } else if (errorParam === "AccessDenied") {
        const errorMsg = "You are not authorized to access this application. Please contact the administrator.";
        setError(errorMsg);
        toast.error(errorMsg);
      } else {
        setError(errorParam);
        toast.error(errorParam);
      }
    }

    if (searchParams.get("verified")) {
      const channel = searchParams.get("channel");
      if (channel === "whatsapp") {
        toast.success("WhatsApp verified! You can now login.");
      } else {
        toast.success("Email verified! You can now login.");
      }
    }
  }, [searchParams]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // For students: validate phone; for others: validate email
      if (isStudent) {
        const cleanPhone = formData.identifier.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
          setError("Please enter a valid mobile number");
          setIsLoading(false);
          return;
        }
      } else {
        if (!formData.identifier.includes("@")) {
          setError("Please enter a valid email address");
          setIsLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email: formData.identifier, // field name kept as 'email' for NextAuth compat; auth.ts handles it
        password: formData.password,
        loginType: loginType || 'student',
        redirect: false,
      });

      if (result?.error) {
        const errorMessage = result.error === "CredentialsSignin"
          ? isStudent ? "Invalid mobile number or password" : "Invalid email or password"
          : result.error;
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        if (result?.ok) {
          toast.success("Login successful!");
          const redirectMap: Record<string, string> = {
            admin: "/admin/dashboard",
            agent: "/agent/dashboard",
            student: "/student/dashboard",
            counselor: "/counselor/dashboard",
          };
          router.push(redirectMap[loginType] ?? "/admin/dashboard");
          router.refresh();
        }
      }
    } catch (error) {
      setError("An unexpected error occurred during login.");
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-10">
        <div className={`text-[10px] uppercase tracking-[0.2em] ${clr.text} font-bold mb-2`}>
          {eyebrow}
        </div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
          {title}
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed font-medium">
          {subtitle}
        </p>
      </div>

      <div className="space-y-6">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-identifier" className="text-[11px] font-bold uppercase tracking-wider text-gray-700 ml-1">
                {isStudent ? 'Mobile Number' : loginType === 'agent' ? 'Agent ID / Email' : 'Email Address'}
              </Label>
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 ${clr.groupFocus} transition-colors`}>
                  {isStudent ? (
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
                      <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  ) : (
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                </div>
                <Input
                  id="login-identifier"
                  type={isStudent ? "tel" : "email"}
                  placeholder={isStudent ? "+91 98765 43210" : loginType === 'admin' ? "Enter your Admin ID" : "enter your email address"}
                  autoComplete={isStudent ? "tel" : "email"}
                  required
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  className={`h-12 pl-11 rounded-xl border-gray-200 bg-white text-gray-900 transition-all placeholder:text-gray-400 ${clr.borderHover} ${clr.focusBorder} focus-visible:ring-4 ${clr.ring} shadow-sm`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password" className="text-[11px] font-bold uppercase tracking-wider text-gray-700 ml-1">
                Password
              </Label>
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 ${clr.groupFocus} transition-colors z-10`}>
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <PasswordInput
                  id="login-password"
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`h-12 pl-11 rounded-xl border-gray-200 bg-white text-gray-900 transition-all placeholder:text-gray-400 ${clr.borderHover} ${clr.focusBorder} focus-visible:ring-4 ${clr.ring} shadow-sm`}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className={`w-4 h-4 rounded border-gray-300 ${clr.focusRing} ${clr.accent}`} />
              <span className={`text-xs font-medium text-gray-500 ${clr.groupHoverText} transition-colors`}>Keep me signed in</span>
            </label>
            <Link
              href={`/forgot-password?type=${loginType}`}
              className={`text-xs font-bold ${clr.text} hover:underline underline-offset-4`}
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className={`h-12 w-full rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 ${loginType === 'admin' ? 'bg-indigo-600 shadow-indigo-600/20' :
              loginType === 'agent' ? 'bg-blue-600 shadow-blue-600/20' :
                loginType === 'counselor' ? 'bg-purple-600 shadow-purple-600/20' :
                  'bg-gradient-to-r from-[#1d6fce] to-[#17b8a6] shadow-cyan-600/20'
              }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : "Sign In to Dashboard"}
          </Button>
        </form>


        <div className="pt-6 text-center text-sm text-gray-500 font-medium">
          {loginType === 'student' ? (
            <>Don't have an account? <Link href="/register" className={`${clr.text} font-bold hover:underline`}>Create an account</Link></>
          ) : loginType === 'agent' ? (
            <>New agent? <Link href="/agent/register" className={`${clr.text} font-bold hover:underline`}>Register as an Agent</Link></>
          ) : (
            <>Not an admin? <Link href="/login" className={`${clr.text} font-bold hover:underline`}>Go to Student Login →</Link></>
          )}
        </div>
      </div>
    </div>
  );
}

export function LoginForm({ loginType = 'student' }: LoginFormProps) {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center text-teal-600 font-bold animate-pulse">Loading Portal...</div>}>
      <LoginFormContent loginType={loginType} />
    </Suspense>
  )
}
