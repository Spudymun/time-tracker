import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/lib/auth.config";

/**
 * Edge-совместимый NextAuth — инициализируется БЕЗ Prisma adapter.
 *
 * ПОЧЕМУ отдельная инициализация (не импорт из lib/auth.ts):
 * lib/auth.ts подключает PrismaAdapter → Prisma → node:crypto / node:os,
 * которые несовместимы с Edge Runtime, используемым middleware.
 *
 * Middleware нужна только функция auth() для проверки сессионного cookie.
 * Никаких обращений к БД здесь не происходит.
 */
const { auth } = NextAuth(authConfig);

/**
 * Публичные маршруты — доступны без сессии.
 * Всё остальное защищено.
 */
const PUBLIC_PAGES = ["/login", "/register"];
const PUBLIC_API_PREFIX = "/api/auth";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const path = nextUrl.pathname;

  const isPublic = PUBLIC_PAGES.includes(path) || path.startsWith(PUBLIC_API_PREFIX);

  // API routes без сессии → 401 JSON (не редирект)
  if (!isLoggedIn && path.startsWith("/api/") && !isPublic) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Незалогиненный пользователь → редирект на /login с callbackUrl
  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  // Залогиненный пользователь на /login или /register → на главную
  if (isLoggedIn && PUBLIC_PAGES.includes(path)) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // Matcher: всё кроме статики и _next
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
