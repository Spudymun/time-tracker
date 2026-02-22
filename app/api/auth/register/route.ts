import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { RegisterSchema } from "@/lib/validations/auth-schema";

/**
 * POST /api/auth/register
 *
 * Создаёт нового пользователя с хешированным паролем.
 * Возвращает 201 с данными пользователя (БЕЗ passwordHash).
 *
 * Ошибки:
 *   400 — невалидные данные (Zod)
 *   409 — email уже зарегистрирован
 *   500 — внутренняя ошибка сервера
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body: unknown = await req.json();

    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Проверяем уникальность email ДО хеширования (дорогая операция)
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
