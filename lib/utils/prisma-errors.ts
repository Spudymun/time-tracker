/**
 * Утилиты для распознавания ошибок Prisma.
 * Используются в API routes для маппинга DB-ошибок на HTTP статусы.
 *
 * Импорт: import { isPrismaNotFound, isPrismaErrorCode } from "@/lib/utils/prisma-errors"
 */

import { Prisma } from "../../generated/prisma/client/client";

/**
 * Возвращает true если ошибка — PrismaClientKnownRequestError с указанным кодом.
 *
 * Коды:
 *   P2002 — Unique constraint violation → 409 Conflict
 *   P2025 — Record not found (update/delete) → 404 Not Found
 *   P2003 — Foreign key constraint violation → 400 Bad Request
 *   P2014 — Required relation violation → 400 Bad Request
 *
 * @example
 * if (isPrismaErrorCode(error, "P2002")) {
 *   return NextResponse.json({ error: "Already exists" }, { status: 409 });
 * }
 */
export function isPrismaErrorCode(
  error: unknown,
  code: string
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

/**
 * Возвращает true если ошибка означает "запись не найдена".
 * Покрывает P2025 (findUniqueOrThrow, update, delete на несуществующую запись).
 *
 * @example
 * if (isPrismaNotFound(error)) {
 *   return NextResponse.json({ error: "Not found" }, { status: 404 });
 * }
 */
export function isPrismaNotFound(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return isPrismaErrorCode(error, "P2025");
}

/**
 * Возвращает true для любой известной Prisma-ошибки.
 * Используй для общего catch блока перед re-throw.
 */
export function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}
