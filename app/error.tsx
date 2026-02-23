"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * app/error.tsx — глобальная граница ошибок для Server Components.
 * ОБЯЗАН быть "use client" — требование Next.js для error boundaries.
 */
interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error: _error, reset }: ErrorPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-2">
          <AlertTriangle className="h-10 w-10 text-error" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-text-1">Something went wrong</h1>
          <p className="text-text-2">An unexpected error occurred. Please try again.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="primary" onClick={reset}>
            Try again
          </Button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 font-medium text-text-1 transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
