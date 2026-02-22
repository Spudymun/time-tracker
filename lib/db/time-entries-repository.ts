import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client/client";

/**
 * TimeEntry с включёнными отношениями.
 * Стандартный тип для всех публичных методов репозитория.
 */
export type TimeEntryWithRelations = Prisma.TimeEntryGetPayload<{
  include: {
    project: true;
    timeEntryTags: { include: { tag: true } };
  };
}>;

/** Одиночный include-блок, переиспользуемый во всех запросах. */
const INCLUDE = {
  project: true,
  timeEntryTags: { include: { tag: true } },
} satisfies Prisma.TimeEntryInclude;

export interface FindManyFilters {
  from?: Date;
  to?: Date;
  projectId?: string | null;
  billable?: boolean;
  tagId?: string;
  q?: string;
}

export interface CreateEntryData {
  description?: string | null;
  projectId?: string | null;
  tagIds?: string[];
  billable?: boolean;
  /** Дата старта. Дефолт устанавливается в API route перед вызовом. */
  startedAt: Date;
}

/**
 * Данные для обновления записи.
 * durationMinutes → stoppedAt/durationSeconds вычисляется в API route перед вызовом.
 */
export interface UpdateEntryData {
  description?: string | null;
  projectId?: string | null;
  tagIds?: string[];
  billable?: boolean;
  stoppedAt?: Date | null;
  durationSeconds?: number | null;
}

export const timeEntriesRepository = {
  /**
   * Возвращает записи пользователя с фильтрацией.
   * `where: { userId }` обязателен — изоляция данных.
   */
  async findMany(userId: string, filters: FindManyFilters = {}): Promise<TimeEntryWithRelations[]> {
    const { from, to, projectId, billable, tagId, q } = filters;

    const where: Prisma.TimeEntryWhereInput = {
      userId,
      ...(from !== undefined || to !== undefined
        ? {
            startedAt: {
              ...(from !== undefined && { gte: from }),
              ...(to !== undefined && { lte: to }),
            },
          }
        : {}),
      ...(projectId !== undefined && { projectId }),
      ...(billable !== undefined && { billable }),
      ...(tagId !== undefined && {
        timeEntryTags: { some: { tagId } },
      }),
      ...(q !== undefined && q.trim() !== ""
        ? { description: { contains: q.trim(), mode: "insensitive" } }
        : {}),
    };

    return prisma.timeEntry.findMany({
      where,
      include: INCLUDE,
      orderBy: { startedAt: "desc" },
    });
  },

  /**
   * Возвращает единственную активную запись пользователя (stoppedAt = null).
   * null если активной нет.
   */
  async findActive(userId: string): Promise<TimeEntryWithRelations | null> {
    return prisma.timeEntry.findFirst({
      where: { userId, stoppedAt: null },
      include: INCLUDE,
    });
  },

  async findById(id: string, userId: string): Promise<TimeEntryWithRelations | null> {
    return prisma.timeEntry.findFirst({
      where: { id, userId },
      include: INCLUDE,
    });
  },

  async create(userId: string, data: CreateEntryData): Promise<TimeEntryWithRelations> {
    return prisma.timeEntry.create({
      data: {
        userId,
        description: data.description ?? null,
        projectId: data.projectId ?? null,
        billable: data.billable ?? false,
        startedAt: data.startedAt,
        ...(data.tagIds && data.tagIds.length > 0
          ? {
              timeEntryTags: {
                createMany: {
                  data: data.tagIds.map((tagId) => ({ tagId })),
                },
              },
            }
          : {}),
      },
      include: INCLUDE,
    });
  },

  /**
   * Обновляет запись.
   * Проверяет владельца через findFirst перед обновлением.
   * tagIds — если задан, полностью заменяет набор тегов.
   */
  async update(
    id: string,
    userId: string,
    data: UpdateEntryData
  ): Promise<TimeEntryWithRelations | null> {
    const existing = await prisma.timeEntry.findFirst({ where: { id, userId } });
    if (!existing) return null;

    return prisma.timeEntry.update({
      where: { id },
      data: {
        ...("description" in data && { description: data.description }),
        ...("projectId" in data && { projectId: data.projectId }),
        ...(data.billable !== undefined && { billable: data.billable }),
        ...("stoppedAt" in data && { stoppedAt: data.stoppedAt }),
        ...("durationSeconds" in data && { durationSeconds: data.durationSeconds }),
        ...(data.tagIds !== undefined && {
          timeEntryTags: {
            deleteMany: {},
            ...(data.tagIds.length > 0
              ? { createMany: { data: data.tagIds.map((tagId) => ({ tagId })) } }
              : {}),
          },
        }),
      },
      include: INCLUDE,
    });
  },

  /**
   * Удаляет запись.
   * Проверяет владельца перед удалением.
   */
  async delete(id: string, userId: string): Promise<void> {
    const existing = await prisma.timeEntry.findFirst({ where: { id, userId } });
    if (!existing) return;

    await prisma.timeEntry.delete({ where: { id } });
  },

  /**
   * Останавливает активную запись: устанавливает stoppedAt и вычисляет durationSeconds.
   * Проверяет владельца. Возвращает null если запись не найдена или не принадлежит userId.
   */
  async stopActive(
    id: string,
    userId: string,
    stoppedAt: Date
  ): Promise<TimeEntryWithRelations | null> {
    const existing = await prisma.timeEntry.findFirst({ where: { id, userId } });
    if (!existing) return null;

    const durationSeconds = Math.round((stoppedAt.getTime() - existing.startedAt.getTime()) / 1000);

    return prisma.timeEntry.update({
      where: { id },
      data: {
        stoppedAt,
        durationSeconds: Math.max(0, durationSeconds),
      },
      include: INCLUDE,
    });
  },
};
