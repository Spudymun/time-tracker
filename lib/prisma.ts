import { PrismaClient } from "@/generated/prisma/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/lib/env";

/**
 * Singleton Prisma client с @prisma/adapter-pg.
 *
 * ПОЧЕМУ singleton: Next.js hot reload в dev-режиме создаёт новые модули при
 * каждом изменении файла. Без global.prisma каждый перезапуск открывал бы
 * новое подключение к БД, быстро исчерпывая connection pool Neon.tech.
 */

const createClient = (): PrismaClient => {
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient = global.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
