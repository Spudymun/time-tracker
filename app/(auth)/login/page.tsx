import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = {
  title: "Sign in — Time Tracker",
};

/**
 * Страница входа.
 * Обёрнута в Suspense т.к. LoginForm использует useSearchParams().
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-8">
          <Spinner size="md" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
