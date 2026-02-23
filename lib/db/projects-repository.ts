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

/**
 * Полный тип проекта со статистикой — возвращается API-маршрутами.
 * Включает вычисляемые поля: totalSeconds, billableSeconds, earnings,
 * estimateProgress, entryCount.
 */
export type ProjectWithStats = {
  id: string;
  name: string;
  color: string;
  isArchived: boolean;
  estimatedHours: number | null;
  hourlyRate: number | null;
  createdAt: Date;
  updatedAt: Date;
  totalSeconds: number;
  billableSeconds: number;
  earnings: number | null;
  estimateProgress: number | null;
  entryCount: number;
};

/**
 * Агрегирует totalSeconds, billableSeconds и entryCount
 * для переданного списка projectIds одним (2 запроса).
 */
async function aggregateProjectStats(
  userId: string,
  projectIds: string[]
): Promise<Map<string, { totalSeconds: number; billableSeconds: number; entryCount: number }>> {
  const [allGroups, billableGroups] = await Promise.all([
    prisma.timeEntry.groupBy({
      by: ["projectId"],
      where: { userId, projectId: { in: projectIds }, stoppedAt: { not: null } },
      _sum: { durationSeconds: true },
      _count: { id: true },
    }),
    prisma.timeEntry.groupBy({
      by: ["projectId"],
      where: {
        userId,
        projectId: { in: projectIds },
        stoppedAt: { not: null },
        billable: true,
      },
      _sum: { durationSeconds: true },
    }),
  ]);

  const billableMap = new Map<string, number>();
  for (const g of billableGroups) {
    if (g.projectId) billableMap.set(g.projectId, g._sum.durationSeconds ?? 0);
  }

  const result = new Map<
    string,
    { totalSeconds: number; billableSeconds: number; entryCount: number }
  >();
  for (const g of allGroups) {
    if (g.projectId) {
      result.set(g.projectId, {
        totalSeconds: g._sum.durationSeconds ?? 0,
        billableSeconds: billableMap.get(g.projectId) ?? 0,
        entryCount: g._count.id,
      });
    }
  }
  return result;
}

function toProjectWithStats(
  project: ProjectWithCount,
  stats: { totalSeconds: number; billableSeconds: number; entryCount: number }
): ProjectWithStats {
  const earnings =
    project.hourlyRate != null
      ? Math.round((stats.billableSeconds / 3600) * project.hourlyRate * 100) / 100
      : null;
  const estimateProgress =
    project.estimatedHours != null && project.estimatedHours > 0
      ? stats.totalSeconds / (project.estimatedHours * 3600)
      : null;

  return {
    id: project.id,
    name: project.name,
    color: project.color,
    isArchived: project.isArchived,
    estimatedHours: project.estimatedHours,
    hourlyRate: project.hourlyRate,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    totalSeconds: stats.totalSeconds,
    billableSeconds: stats.billableSeconds,
    earnings,
    estimateProgress,
    entryCount: project._count.timeEntries,
  };
}

export const projectsRepository = {
  /**
   * Возвращает все проекты пользователя со статистикой.
   * @param userId — ОБЯЗАТЕЛЕН: данные фильтруются строго по владельцу
   * @param filter.archived — 'true' = только архивные, 'false' = только активные (default), 'all' = все
   */
  async findAll(
    userId: string,
    filter?: { archived?: "true" | "false" | "all" }
  ): Promise<ProjectWithStats[]> {
    const archived = filter?.archived;
    const isArchivedFilter = archived === "all" ? undefined : archived === "true" ? true : false;

    const projects = await prisma.project.findMany({
      where: {
        userId,
        ...(isArchivedFilter !== undefined && { isArchived: isArchivedFilter }),
      },
      include: { _count: { select: { timeEntries: true } } },
      orderBy: { createdAt: "desc" },
    });

    const projectIds = projects.map((p) => p.id);
    const statsMap = await aggregateProjectStats(userId, projectIds);

    return projects.map((p) =>
      toProjectWithStats(
        p,
        statsMap.get(p.id) ?? {
          totalSeconds: 0,
          billableSeconds: 0,
          entryCount: p._count.timeEntries,
        }
      )
    );
  },

  async findById(id: string, userId: string): Promise<ProjectWithStats | null> {
    const project = await prisma.project.findFirst({
      where: { id, userId },
      include: { _count: { select: { timeEntries: true } } },
    });
    if (!project) return null;

    const statsMap = await aggregateProjectStats(userId, [id]);
    return toProjectWithStats(
      project,
      statsMap.get(id) ?? {
        totalSeconds: 0,
        billableSeconds: 0,
        entryCount: project._count.timeEntries,
      }
    );
  },

  async create(userId: string, data: CreateProjectInput): Promise<ProjectWithStats> {
    const project = await prisma.project.create({
      data: {
        userId,
        name: data.name,
        color: data.color,
        estimatedHours: data.estimatedHours ?? null,
        hourlyRate: data.hourlyRate ?? null,
      },
      include: { _count: { select: { timeEntries: true } } },
    });
    return toProjectWithStats(project, { totalSeconds: 0, billableSeconds: 0, entryCount: 0 });
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
  ): Promise<ProjectWithStats | null> {
    const existing = await prisma.project.findFirst({ where: { id, userId } });
    if (!existing) return null;

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.color !== undefined && { color: data.color }),
        ...("estimatedHours" in data && { estimatedHours: data.estimatedHours }),
        ...("hourlyRate" in data && { hourlyRate: data.hourlyRate }),
        ...(data.isArchived !== undefined && { isArchived: data.isArchived }),
      },
      include: { _count: { select: { timeEntries: true } } },
    });

    const statsMap = await aggregateProjectStats(userId, [id]);
    return toProjectWithStats(
      project,
      statsMap.get(id) ?? {
        totalSeconds: 0,
        billableSeconds: 0,
        entryCount: project._count.timeEntries,
      }
    );
  },

  async delete(id: string, userId: string): Promise<void> {
    // findFirst перед delete чтобы не бросать P2025 на чужие ID
    const existing = await prisma.project.findFirst({ where: { id, userId } });
    if (!existing) return;

    await prisma.project.delete({ where: { id } });
  },

  async archive(id: string, userId: string): Promise<ProjectWithStats | null> {
    const existing = await prisma.project.findFirst({ where: { id, userId } });
    if (!existing) return null;

    const project = await prisma.project.update({
      where: { id },
      data: { isArchived: true },
      include: { _count: { select: { timeEntries: true } } },
    });
    const statsMap = await aggregateProjectStats(userId, [id]);
    return toProjectWithStats(
      project,
      statsMap.get(id) ?? {
        totalSeconds: 0,
        billableSeconds: 0,
        entryCount: project._count.timeEntries,
      }
    );
  },

  async unarchive(id: string, userId: string): Promise<ProjectWithStats | null> {
    const existing = await prisma.project.findFirst({ where: { id, userId } });
    if (!existing) return null;

    const project = await prisma.project.update({
      where: { id },
      data: { isArchived: false },
      include: { _count: { select: { timeEntries: true } } },
    });
    const statsMap = await aggregateProjectStats(userId, [id]);
    return toProjectWithStats(
      project,
      statsMap.get(id) ?? {
        totalSeconds: 0,
        billableSeconds: 0,
        entryCount: project._count.timeEntries,
      }
    );
  },
};
