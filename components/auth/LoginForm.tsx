"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { FaGoogle, FaFacebookF } from "react-icons/fa";
import { toast } from "sonner";

interface LoginFormProps {
  loginType?: 'student' | 'admin' | 'agent';
}

function LoginFormContent({ loginType = 'student' }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const getWelcomeText = () => {
    switch (loginType) {
      case 'admin':
        return { title: 'Admin Login', subtitle: 'Welcome back, Administrator' };
      case 'agent':
        return { title: 'Agent Login', subtitle: 'Welcome back, Team Member' };
      default:
        return { title: 'Holla,\nWelcome Back', subtitle: 'Hey, welcome back to your special place' };
    }
  };

  const { title, subtitle } = getWelcomeText();

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
      toast.success("Email verified! You can now login.");
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      toast.error("An error occurred during Google sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Basic client-side validation
      if (!formData.email.includes("@")) {
        setError("Please enter a valid email address");
        setIsLoading(false);
        return;
      }

      console.log('LoginForm submitting:', { email: formData.email, loginType });
      // Temporary alert for visual verification
      // alert('Submitting loginType: ' + loginType); 

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        loginType: loginType || 'student', // Ensure it's never undefined
        redirect: false,
      });

      if (result?.error) {
        // NextAuth wraps our thrown errors from lib/auth.ts in result.error
        const errorMessage = result.error === "CredentialsSignin"
          ? "Invalid email or password"
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
      <div className="space-y-2 mb-10 text-center lg:text-left">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-[1.1] whitespace-pre-line">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground font-medium">
          {subtitle}
        </p>
      </div>

      <div className="space-y-6">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                id="login-email"
                type="email"
                placeholder="stanley@gmail.com"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-14 rounded-2xl border-gray-200 bg-white! text-slate-900! transition-all placeholder:text-gray-400 hover:border-teal-400 focus-visible:border-teal-500 focus-visible:ring-4 focus-visible:ring-teal-500/10 shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <PasswordInput
                id="login-password"
                placeholder="••••••••••••"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-14 rounded-2xl border-gray-200 bg-white! text-slate-900! transition-all placeholder:text-gray-400 hover:border-teal-400 focus-visible:border-teal-500 focus-visible:ring-4 focus-visible:ring-teal-500/10 shadow-sm"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
              <span className="text-xs font-semibold text-slate-600 group-hover:text-teal-600 transition-colors">Remember me</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-14 w-40 rounded-2xl bg-teal-600 text-base font-bold text-white shadow-xl shadow-teal-600/20 transition-all hover:bg-teal-700 hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground font-semibold">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={handleGoogleSignIn}
          className="h-14 w-full rounded-2xl border-gray-200 bg-white text-base font-bold text-slate-700 transition-all hover:bg-gray-50 hover:border-teal-400 focus-visible:ring-2 focus-visible:ring-teal-500/10 shadow-sm"
        >
          <FaGoogle className="mr-2 h-5 w-5 text-red-500" />
          Sign in with Google
        </Button>

        <div className="pt-12 text-sm text-muted-foreground font-medium">
          Don't have an account?{" "}
          <Link href="/register" className="text-teal-600 font-bold hover:underline underline-offset-4">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

export function LoginForm({ loginType = 'student' }: LoginFormProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginFormContent loginType={loginType} />
    </Suspense>
  )
}

