import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create account — Time Tracker",
};

/**
 * Страница регистрации.
 */
export default function RegisterPage() {
  return <RegisterForm />;
}
