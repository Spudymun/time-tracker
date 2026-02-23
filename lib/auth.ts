import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import authConfig from "@/lib/auth.config";

/**
 * Находит пользователя по email и проверяет пароль.
 *
 * ПОЧЕМУ отдельная функция: упрощает unit-тестирование без вызова NextAuth.
 * Возвращает null (не бросает исключение) — CredentialsProvider требует null при ошибке.
 */
async function validateUser(
  email: string,
  password: string
): Promise<{ id: string; name: string | null; email: string | null; image: string | null } | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return null;

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return null;

  return { id: user.id, name: user.name, email: user.email, image: user.image };
}

/**
 * Полный конфиг Auth.js для Node.js среды (API routes, Server Components).
 *
 * ПОЧЕМУ spread + override providers:
 * authConfig содержит Edge-совместимые providers-заглушки.
 * Здесь мы переопределяем providers реальными реализациями, включающими
 * Prisma (для adapter) и bcryptjs (для Credentials.authorize).
 *
 * middleware.ts импортирует authConfig напрямую и создаёт отдельный NextAuth
 * без Prisma — только для проверки сессионного cookie на Edge.
 */
export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  session: { strategy: "jwt" },

  // Spread Edge-совместимого конфига (callbacks, pages)
  ...authConfig,

  // Переопределяем providers: реальная логика authorize с Prisma + bcrypt
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (typeof credentials?.email !== "string" || typeof credentials?.password !== "string") {
          return null;
        }
        return validateUser(credentials.email, credentials.password);
      },
    }),

    GitHub({
      clientId: process.env.AUTH_GITHUB_ID ?? "",
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? "",
    }),

    Google({
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
});
