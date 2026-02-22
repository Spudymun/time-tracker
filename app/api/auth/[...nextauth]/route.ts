import { handlers } from "@/lib/auth";

/**
 * Auth.js v5 handler для Next.js App Router.
 * Обрабатывает все маршруты: /api/auth/signin, /api/auth/callback/*, /api/auth/signout и т.д.
 */
export const { GET, POST } = handlers;
