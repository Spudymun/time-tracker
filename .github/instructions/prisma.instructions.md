---
name: Prisma & Database Standards
description: Prisma ORM, repositories and database access patterns
applyTo: "lib/db/**,prisma/**,lib/prisma.ts"
---

# Prisma & Database Standards

## Prisma Client Singleton

```ts
// lib/prisma.ts — единственный способ получить DB-клиент
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/lib/env"; // валидация DATABASE_URL при старте

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

## Репозитории (data layer)

### Структура файла репозитория

```ts
// lib/db/projects-repository.ts
import { prisma } from "@/lib/prisma";
import type { Project, Prisma } from "../../generated/prisma/client";

export const projectsRepository = {
  async findAll(): Promise<Project[]> {
    return prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  },

  async findById(id: string): Promise<Project | null> {
    return prisma.project.findUnique({ where: { id } });
  },

  async create(data: Prisma.ProjectCreateInput): Promise<Project> {
    return prisma.project.create({ data });
  },

  async update(id: string, data: Prisma.ProjectUpdateInput): Promise<Project> {
    return prisma.project.update({ where: { id }, data });
  },

  async delete(id: string): Promise<void> {
    await prisma.project.delete({ where: { id } });
  },
};
```

### Правила репозиториев

- Plain objects с методами — НЕ классы
- Каждый метод — async, явный return type
- Используй `Prisma.{Model}CreateInput` / `Prisma.{Model}UpdateInput` для типов входных данных
- Никогда не раскрывать Prisma types в API layer — создавай domain types если нужен маппинг
- Repository не содержит валидацию — только DB-операции

### N+1 Prevention — relationLoadStrategy

```ts
// ❌ N+1: отдельный запрос на каждый проект
const projects = await prisma.project.findMany();
for (const p of projects) {
  const entries = await prisma.timeEntry.findMany({ where: { projectId: p.id } });
}

// ✅ Один JOIN-запрос (Prisma v7+)
const projects = await prisma.project.findMany({
  relationLoadStrategy: "join", // один SQL с JOIN
  include: { timeEntries: true },
});
```

## Обработка Prisma ошибок

```ts
// lib/utils/prisma-errors.ts — всегда используй эти утилиты в route handlers
export function isPrismaErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === code
  );
}

export function isPrismaNotFound(error: unknown): boolean {
  return isPrismaErrorCode(error, "P2025");
}
```

Коды ошибок Prisma:

- `P2002` — Unique constraint violation → 409 Conflict
- `P2025` — Record not found → 404 Not Found
- `P2003` — Foreign key constraint failed → 400 Bad Request

## Schema conventions

```prisma
model EntityName {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt      // если нужна история изменений

  // FK:
  parentId  String?
  parent    Parent?  @relation(fields: [parentId], references: [id], onDelete: SetNull)

  // Индексы на поля фильтрации:
  @@index([parentId])
  @@index([createdAt])
}
```

## prisma.config.ts

DATABASE_URL передаётся программно — не хранится в schema.prisma:

```ts
config({ path: ".env.local" });
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: process.env.DATABASE_URL },
});
```
