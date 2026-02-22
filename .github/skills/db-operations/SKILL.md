---
name: db-operations
description: >
  Creates Prisma repositories, Zod schemas, and handles DB operations.
  Use when adding new entities, repositories, or database queries.
user-invokable: true
argument-hint: "[entity-name]"
---

# Database Operations Skill

## Когда использовать

Используй для: создания репозиториев, Zod-схем, изменений Prisma schema.

## Workflow для новой сущности

### Шаг 1: Prisma Schema

```prisma
model EntityName {
  id        String   @id @default(uuid())
  name      String   @unique    // или без @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt  // только если нужна история

  // FK (nullable = optional relation):
  parentId  String?
  parent    Parent?  @relation(fields: [parentId], references: [id], onDelete: SetNull)

  // Индексы на поля WHERE и ORDER BY:
  @@index([createdAt])
  @@index([parentId])
}
```

После изменения schema: `npm run db:push` (dev) или `npm run db:generate`

### Шаг 2: Zod Schema (`lib/validations/{entity}-schema.ts`)

```ts
import { z } from "zod";

export const Create{Entity}Schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a hex color"),
  parentId: z.string().uuid().optional(),
});

export const Update{Entity}Schema = Create{Entity}Schema.partial();

export type Create{Entity}Input = z.infer<typeof Create{Entity}Schema>;
export type Update{Entity}Input = z.infer<typeof Update{Entity}Schema>;
```

### Шаг 3: Repository (`lib/db/{entity}-repository.ts`)

```ts
import { prisma } from "@/lib/prisma";
import type { EntityName, Prisma } from "../../generated/prisma/client";

export const {entity}Repository = {
  async findAll(): Promise<EntityName[]> {
    return prisma.entityName.findMany({ orderBy: { createdAt: "desc" } });
  },

  async findById(id: string): Promise<EntityName | null> {
    return prisma.entityName.findUnique({ where: { id } });
  },

  async create(data: Prisma.EntityNameCreateInput): Promise<EntityName> {
    return prisma.entityName.create({ data });
  },

  async update(id: string, data: Prisma.EntityNameUpdateInput): Promise<EntityName> {
    return prisma.entityName.update({ where: { id }, data });
  },

  async delete(id: string): Promise<void> {
    await prisma.entityName.delete({ where: { id } });
  },
};
```

## Правила

- Репозиторий = plain object, НЕ класс
- Один файл = одна сущность
- Импорт: только из `@/lib/prisma`, Prisma types из `generated/prisma/client`
- Никогда не добавляй бизнес-логику в репозиторий — только CRUD + фильтры
- Тест репозитория — с мок prisma через `vi.mock("@/lib/prisma")`

## Prisma ошибки в API routes

```ts
import { isPrismaErrorCode, isPrismaNotFound } from "@/lib/utils/prisma-errors";

// P2002 → 409 Conflict (unique constraint)
if (isPrismaErrorCode(error, "P2002")) {
  return NextResponse.json({ error: "Already exists" }, { status: 409 });
}
// P2025 → 404 Not Found
if (isPrismaNotFound(error)) {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
```
