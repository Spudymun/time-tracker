import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

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

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  session: { strategy: "jwt" },

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

  callbacks: {
    /**
     * jwt callback: вызывается при создании/обновлении JWT-токена.
     * Добавляем userId в токен при первом входе (когда user доступен).
     */
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },

    /**
     * session callback: вызывается при каждом вызове auth().
     * Переносим userId из JWT в объект сессии, доступный в компонентах/routes.
     */
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
});
