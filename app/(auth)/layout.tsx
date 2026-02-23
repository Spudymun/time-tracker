import type { Metadata } from "next";
import { Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Time Tracker — Auth",
};

/**
 * Auth layout — центрированный layout без TimerBar и навигации.
 * Используется для страниц /login и /register.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-12">
      {/* Logo / App name */}
      <div className="mb-8 flex items-center gap-2">
        <Clock className="h-7 w-7 text-primary" aria-hidden="true" />
        <span className="text-xl font-bold text-text-1">Time Tracker</span>
      </div>

      {/* Centered card */}
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
