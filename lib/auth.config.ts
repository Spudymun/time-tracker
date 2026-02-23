import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

/**
 * Edge-совместимый конфиг Auth.js.
 *
 * ПОЧЕМУ отдельный файл:
 * middleware.ts работает на Edge Runtime, который НЕ поддерживает node:* API.
 * Prisma и bcryptjs используют node:crypto, node:os и другие Node.js-специфичные
 * модули — они не могут быть инициализированы в Edge Runtime.
 *
 * Этот файл содержит ТОЛЬКО Edge-совместимый код:
 * - провайдеры (без реальной логики authorize — она в auth.ts)
 * - callbacks для jwt/session (работают с уже выданным токеном, без DB)
 * - конфигурация страниц
 *
 * Импортируется в:
 * - middleware.ts (Edge) — через отдельный NextAuth(authConfig)
 * - lib/auth.ts (Node.js) — через spread ...authConfig с переопределением providers
 */
const authConfig: NextAuthConfig = {
  providers: [
    /**
     * Credentials-заглушка для Edge.
     * Реальная логика validateUser (Prisma + bcrypt) живёт в lib/auth.ts.
     * Здесь authorize возвращает null — middleware никогда не вызывает authorize,
     * оно только проверяет наличие сессионного cookie.
     */
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async () => null,
    }),

    GitHub,
    Google,
  ],

  callbacks: {
    /**
     * jwt callback: добавляет userId в токен при первом входе.
     * Не обращается к БД — работает только с объектом user, полученным из authorize.
     */
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },

    /**
     * session callback: переносит userId из JWT в объект сессии.
     * Не обращается к БД.
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
};

export default authConfig;
