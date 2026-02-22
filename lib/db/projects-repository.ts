import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client/client";
import type { CreateProjectInput, UpdateProjectInput } from "@/lib/validations/project-schema";

/**
 * Тип проекта с количеством связанных записей времени.
 * Используется как возвращаемый тип для findAll и findById.
 */
export type ProjectWithCount = Prisma.ProjectGetPayload<{
  include: { _count: { select: { timeEntries: true } } };
}>;

export const projectsRepository = {
  /**
   * Возвращает все проекты пользователя.
   * @param userId — ОБЯЗАТЕЛЕН: данные фильтруются строго по владельцу
   * @param filter.archived — 'true' = только архивные, 'false' = только активные (default), 'all' = все
   */
  async findAll(
    userId: string,
    filter?: { archived?: "true" | "false" | "all" }
  ): Promise<ProjectWithCount[]> {
    const archived = filter?.archived;

    const isArchivedFilter = archived === "all" ? undefined : archived === "true" ? true : false;

    return prisma.project.findMany({
      where: {
        userId,
        ...(isArchivedFilter !== undefined && { isArchived: isArchivedFilter }),
      },
      include: {
        _count: { select: { timeEntries: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string, userId: string): Promise<ProjectWithCount | null> {
    return prisma.project.findFirst({
      where: { id, userId },
      include: {
        _count: { select: { timeEntries: true } },
      },
    });
  },

  async create(userId: string, data: CreateProjectInput): Promise<ProjectWithCount> {
    return prisma.project.create({
      data: {
        userId,
        name: data.name,
        color: data.color,
        estimatedHours: data.estimatedHours ?? null,
        hourlyRate: data.hourlyRate ?? null,
      },
      include: {
        _count: { select: { timeEntries: true } },
      },
    });
  },

  /**
   * Обновляет проект.
   * Сначала проверяет существование и владельца через findFirst, чтобы вернуть
   * null вместо исключения Prisma P2025, не раскрывая чужие ID.
   */
  async update(
    id: string,
    userId: string,
    data: UpdateProjectInput
  ): Promise<ProjectWithCount | null> {
    const existing = await prisma.project.findFirst({ where: { id, userId } });
    if (!existing) return null;

    return prisma.project.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.color !== undefined && { color: data.color }),
        ...("estimatedHours" in data && { estimatedHours: data.estimatedHours }),
        ...("hourlyRate" in data && { hourlyRate: data.hourlyRate }),
        ...(data.isArchived !== undefined && { isArchived: data.isArchived }),
      },
      include: {
        _count: { select: { timeEntries: true } },
      },
    });
  },

  async delete(id: string, userId: string): Promise<void> {
    // findFirst перед delete чтобы не бросать P2025 на чужие ID
    const existing = await prisma.project.findFirst({ where: { id, userId } });
    if (!existing) return;

    await prisma.project.delete({ where: { id } });
  },

  async archive(id: string, userId: string): Promise<ProjectWithCount | null> {
    const existing = await prisma.project.findFirst({ where: { id, userId } });
    if (!existing) return null;

    return prisma.project.update({
      where: { id },
      data: { isArchived: true },
      include: { _count: { select: { timeEntries: true } } },
    });
  },

  async unarchive(id: string, userId: string): Promise<ProjectWithCount | null> {
    const existing = await prisma.project.findFirst({ where: { id, userId } });
    if (!existing) return null;

    return prisma.project.update({
      where: { id },
      data: { isArchived: false },
      include: { _count: { select: { timeEntries: true } } },
    });
  },
};
