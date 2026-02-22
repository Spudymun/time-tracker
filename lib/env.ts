/**
 * Валидация переменных окружения при старте приложения.
 *
 * ПОЧЕМУ: Без этого Prisma/приложение падает с криптической ошибкой вида
 * "invalid connection string" или "Cannot read property of undefined".
 * С этим файлом — чёткое сообщение ЧТО именно не заполнено в .env.local
 *
 * Использование: импортируй в lib/prisma.ts и любых server-side файлах,
 * которые зависят от env-переменных.
 *
 * @example
 * import { env } from "@/lib/env";
 * console.log(env.DATABASE_URL); // string, гарантированно валидный
 */

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .url("DATABASE_URL must be a valid URL (postgresql://...)"),

  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters (run: openssl rand -base64 32)"),

  // OAuth провайдеры — опциональны (не нужны для email+password)
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),
  AUTH_GOOGLE_CLIENT_ID: z.string().optional(),
  AUTH_GOOGLE_CLIENT_SECRET: z.string().optional(),
});

// parse() выбрасывает ZodError с понятным описанием при старте,
// если переменная отсутствует или некорректна.
// Это intentional fail-fast — лучше упасть на старте, чем в runtime.
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues
    .map((e) => `  ${e.path.map(String).join(".")}: ${e.message}`)
    .join("\n");

  throw new Error(
    `\n\n❌ Invalid environment variables:\n${missing}\n\nCheck your .env.local file.\n`
  );
}

export const env = parsed.data;
