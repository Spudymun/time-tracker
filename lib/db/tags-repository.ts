import { prisma } from "@/lib/prisma";
import type { Prisma, Tag } from "@/generated/prisma/client/client";
import type { CreateTagInput, UpdateTagInput } from "@/lib/validations/tag-schema";

/**
 * Тег с количеством использований в записях.
 * usageCount = кол-во строк TimeEntryTag, ссылающихся на этот тег.
 */
export type TagWithCount = Prisma.TagGetPayload<{
  include: { _count: { select: { timeEntryTags: true } } };
}>;

export const tagsRepository = {
  async findAll(userId: string): Promise<TagWithCount[]> {
    return prisma.tag.findMany({
      where: { userId },
      include: { _count: { select: { timeEntryTags: true } } },
      orderBy: { name: "asc" },
    });
  },

  async findById(id: string, userId: string): Promise<Tag | null> {
    return prisma.tag.findFirst({
      where: { id, userId },
    });
  },

  async create(userId: string, data: CreateTagInput): Promise<TagWithCount> {
    return prisma.tag.create({
      data: {
        userId,
        name: data.name,
        color: data.color,
      },
      include: { _count: { select: { timeEntryTags: true } } },
    });
  },

  /**
   * Обновляет тег.
   * Проверяет владельца через findFirst перед обновлением.
   */
  async update(id: string, userId: string, data: UpdateTagInput): Promise<Tag | null> {
    const existing = await prisma.tag.findFirst({ where: { id, userId } });
    if (!existing) return null;

    return prisma.tag.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.color !== undefined && { color: data.color }),
      },
    });
  },

  async delete(id: string, userId: string): Promise<void> {
    const existing = await prisma.tag.findFirst({ where: { id, userId } });
    if (!existing) return;

    await prisma.tag.delete({ where: { id } });
  },
};
