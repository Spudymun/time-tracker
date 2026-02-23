import Link from "next/link";
import { Clock } from "lucide-react";

/**
 * app/not-found.tsx — глобальная 404 страница.
 * Server Component — TimerBar не нужен.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-2">
          <Clock className="h-10 w-10 text-text-3" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-text-1">Page not found</h1>
          <p className="text-text-2">The page you&apos;re looking for doesn&apos;t exist.</p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 font-medium text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
