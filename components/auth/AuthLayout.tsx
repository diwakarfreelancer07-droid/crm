"use client";

import type { ReactNode } from "react";

/**
 * Auth layout: Form positioned inside the illustration container.
 * Desktop/Tablet: Equal spacing around illustration with dark green background visible.
 * Mobile: Full-screen illustration background with no outer spacing.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50 overflow-hidden">
      {/* Left Column: Form */}
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 lg:p-20 order-2 lg:order-1 h-full overflow-y-auto lg:overflow-visible">
        <div className="w-full max-w-md">
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-black rounded-lg shadow-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white/20 blur-[1px] rounded-sm animate-pulse" />
              </div>
              <span className="font-bold text-xl tracking-tight text-black">Inter CRM</span>
            </div>
          </div>
          {children}
        </div>

        <div className="mt-auto pt-12 text-center lg:text-left w-full max-w-md">
          <p className="text-xs text-muted-foreground/60">© 2026 Inter CRM. All rights reserved.</p>
        </div>
      </div>

      {/* Right Column: Illustration (Hidden on mobile) */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-[#0f766e] via-[#0d9488] to-[#14b8a6] items-center justify-center order-1 lg:order-2 m-4 rounded-[2.5rem]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="relative z-10 w-full max-w-xl px-12">
          {/* The image will be placed here once generated or using a fallback */}
          <div className="aspect-square relative flex items-center justify-center scale-110 lg:scale-125">
            {/* SVG Fingerprint Illustration */}
            <svg viewBox="0 0 200 200" className="w-full h-full text-white/90 drop-shadow-2xl animate-float-slow" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M100 30c-38.66 0-70 31.34-70 70v20c0 10.66 8.66 20 20 20s20-9.34 20-20v-20c0-16.57 13.43-30 30-30s30 13.43 30 30v20c0 10.66 8.66 20 20 20s20-9.34 20-20v-20c0-38.66-31.34-70-70-70z" opacity="0.4" />
              <path d="M100 60c-22.09 0-40 17.91-40 40v10c0 10.66 8.66 20 20 20s20-9.34 20-20v-10c0-5.52 4.48-10 10-10s10 4.48 10 10v10c0 10.66 8.66 20 20 20s20-9.34 20-20v-10c0-22.09-17.91-40-40-40z" opacity="0.6" />
              <circle cx="100" cy="110" r="10" strokeWidth="3" className="animate-pulse" />
              <path d="M70 160c15-5 45-5 60 0" opacity="0.3" strokeWidth="4" />
              <path d="M60 180c20-8 60-8 80 0" opacity="0.2" strokeWidth="4" />
            </svg>

            {/* Animated UI decorations as fallback/overlay */}
            <div className="absolute top-[15%] right-[10%] w-24 h-24 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl animate-bounce-slow flex items-center justify-center shadow-xl">
              <div className="w-10 h-10 rounded-full bg-teal-400/30 flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <div className="w-2.5 h-1.5 border-b-2 border-r-2 border-teal-600 -rotate-45 mb-0.5" />
                </div>
              </div>
            </div>

            <div className="absolute bottom-[20%] left-[5%] w-32 h-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] animate-pulse-slow p-4 flex flex-col gap-2 shadow-xl">
              <div className="h-2 w-16 bg-teal-400/40 rounded-full" />
              <div className="h-2 w-full bg-white/20 rounded-full" />
              <div className="h-2 w-2/3 bg-white/20 rounded-full" />
            </div>

            <div className="absolute top-[40%] -left-4 w-12 h-12 bg-teal-400 rounded-full blur-2xl opacity-50 animate-pulse" />
          </div>

          <div className="mt-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-2">Smart CRM for Modern Business</h3>
            <p className="text-teal-50/70 text-sm max-w-xs mx-auto">Manage your leads, track performance, and grow your conversions with ease.</p>
          </div>
        </div>

        {/* Floating clouds/shapes */}
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-[-5%] right-[-5%] w-48 h-48 bg-teal-300/10 rounded-full blur-3xl font-sans" />
      </div>

      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.4; }
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
