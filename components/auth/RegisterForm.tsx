"use client";

/**
 * RegisterForm — форма регистрации.
 * Submit: POST /api/auth/register → signIn('credentials', ...) при успехе.
 * Показывает 409 как toast: "Email already in use".
 */

import { useState, useCallback } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function RegisterForm() {
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = useCallback((): boolean => {
    const next: FormErrors = {};

    if (!name.trim()) next.name = "Name is required";
    else if (name.trim().length > 50) next.name = "Name must be 50 characters or less";

    if (!email) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Invalid email address";

    if (!password) next.password = "Password is required";
    else if (password.length < 8) next.password = "Password must be at least 8 characters";
    else if (password.length > 72) next.password = "Password must be 72 characters or less";

    if (!confirmPassword) next.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) next.confirmPassword = "Passwords do not match";

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [name, email, password, confirmPassword]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), email: email.toLowerCase(), password }),
        });

        if (res.status === 409) {
          toast.error("Email already in use");
          return;
        }

        if (!res.ok) {
          toast.error("Registration failed. Please try again.");
          return;
        }

        // Успешная регистрация — сразу входим
        const result = await signIn("credentials", {
          email: email.toLowerCase(),
          password,
          callbackUrl: "/",
          redirect: false,
        });

        if (result?.url) {
          window.location.href = result.url;
        } else {
          toast.error("Account created, but sign in failed. Please sign in manually.");
        }
      } catch {
        toast.error("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [validate, name, email, password, toast]
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-text-1">Create account</h1>
        <p className="mt-1 text-sm text-text-3">Start tracking your time for free.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          type="text"
          label="Name"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoComplete="name"
          required
          disabled={isLoading}
        />
        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
          required
          disabled={isLoading}
        />
        <Input
          type="password"
          label="Password"
          placeholder="Min. 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="new-password"
          required
          disabled={isLoading}
        />
        <Input
          type="password"
          label="Confirm password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
          required
          disabled={isLoading}
        />

        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={isLoading}
          className="w-full"
        >
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-text-3">
        Already have an account?{" "}
        <Link
          href="/login"
          className="rounded font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
