"use client";

/**
 * LoginForm — форма входа с email/password + OAuth.
 * Submit: signIn('credentials', ...) — ошибка показывается через toast.
 */

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { OAuthButton } from "@/components/auth/OAuthButton";
import { useToast } from "@/components/ui/Toast";

export function LoginForm() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"github" | "google" | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      try {
        const result = await signIn("credentials", {
          email,
          password,
          callbackUrl,
          redirect: false,
        });

        if (result?.error) {
          toast.error("Invalid credentials");
        } else if (result?.url) {
          // Успешный вход — выполняем полный редирект
          window.location.href = result.url;
        }
      } catch {
        toast.error("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, callbackUrl, toast]
  );

  const handleOAuth = useCallback(
    async (provider: "github" | "google") => {
      setOauthLoading(provider);
      try {
        await signIn(provider, { callbackUrl });
      } catch {
        toast.error("OAuth sign in failed. Please try again.");
        setOauthLoading(null);
      }
    },
    [callbackUrl, toast]
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-1">Sign in</h1>
        <p className="mt-1 text-sm text-text-3">
          Welcome back. Enter your credentials to continue.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={isLoading}
        />
        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          disabled={isLoading}
        />

        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={isLoading || !email || !password}
          className="w-full"
        >
          Sign in
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-text-3">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="flex flex-col gap-2">
        <OAuthButton
          provider="github"
          onClick={() => handleOAuth("github")}
          isLoading={oauthLoading === "github"}
        />
        <OAuthButton
          provider="google"
          onClick={() => handleOAuth("google")}
          isLoading={oauthLoading === "google"}
        />
      </div>

      <p className="text-center text-sm text-text-3">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="rounded font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
