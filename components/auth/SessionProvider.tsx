"use client";

/**
 * SessionProvider wrapper для Auth.js v5.
 * Оборачивает дерево компонентов, которым нужен useSession().
 * Добавлен в app/layout.tsx.
 */

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
