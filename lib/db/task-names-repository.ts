import { prisma } from "@/lib/prisma";

export const taskNamesRepository = {
  /**
   * Возвращает список уникальных описаний задач пользователя (для автодополнения).
   *
   * @param userId — ОБЯЗАТЕЛЕН: изоляция данных пользователя
   * @param q — необязательная строка поиска (case-insensitive, partial match)
   * @returns до 10 уникальных строк описаний, отсортированных по дате последнего использования
   */
  async findRecent(userId: string, q?: string): Promise<string[]> {
    const results = await prisma.timeEntry.findMany({
      where: {
        userId,
        description: {
          not: null,
          ...(q && q.trim() !== "" ? { contains: q.trim(), mode: "insensitive" } : {}),
        },
      },
      select: { description: true },
      distinct: ["description"],
      orderBy: { startedAt: "desc" },
      take: 10,
    });

    // description is nullable but we filtered NOT NULL above
    return results.map((r) => r.description as string);
  },
};
