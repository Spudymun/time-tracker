import { prisma } from "@/lib/prisma";
import type { Tag } from "@/generated/prisma/client/client";
import type { CreateTagInput, UpdateTagInput } from "@/lib/validations/tag-schema";

export const tagsRepository = {
  async findAll(userId: string): Promise<Tag[]> {
    return prisma.tag.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });
  },

  async findById(id: string, userId: string): Promise<Tag | null> {
    return prisma.tag.findFirst({
      where: { id, userId },
    });
  },

  async create(userId: string, data: CreateTagInput): Promise<Tag> {
    return prisma.tag.create({
      data: {
        userId,
        name: data.name,
        color: data.color,
      },
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
