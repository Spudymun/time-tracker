---
name: API Route Standards
description: Standards for Next.js API route handlers in app/api/**
applyTo: "app/api/**/*.ts"
---

# API Route Standards

## Структура каждого route handler

```ts
import { type NextRequest } from "next/server";
import { someSchema } from "@/lib/validations/some-schema";
import { someRepository } from "@/lib/db/some-repository";
import { isPrismaNotFound, isPrismaErrorCode } from "@/lib/utils/prisma-errors";

export async function POST(request: NextRequest): Promise<Response> {
  // 1. Парсинг body — unknown, НЕ any
  const body: unknown = await request.json();

  // 2. Zod v4 safeParse — ДО любой логики
  const result = someSchema.safeParse(body);
  if (!result.success) {
    // flatten() вместо format() — структурированные ошибки по полям
    return Response.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // 3. Бизнес-логика через репозиторий
  try {
    const data = await someRepository.create(result.data);
    return Response.json(data, { status: 201 }); // Response.json — нативный, не NextResponse
  } catch (error) {
    if (isPrismaErrorCode(error, "P2002")) {
      return Response.json({ error: "Already exists" }, { status: 409 });
    }
    if (isPrismaNotFound(error)) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## HTTP статус коды

| Ситуация                  | Статус |
| ------------------------- | ------ |
| Успешное создание         | 201    |
| Успешный GET/PUT          | 200    |
| Zod-валидация провалилась | 400    |
| Запись не найдена         | 404    |
| Unique constraint (P2002) | 409    |
| Неожиданная ошибка        | 500    |

## Правила

- Zod-валидация ВСЕГДА перед DB-операцией, без исключений
- Zod-схемы импортируются из `lib/validations/`
- Репозитории импортируются из `lib/db/`
- Никогда не импортировать Prisma напрямую в route — только через репозиторий
- `console.error(error)` перед 500-ответом — для логирования
- Никогда не раскрывать внутренние ошибки клиенту (Prisma errors, stack traces)

## URL параметры

```ts
// app/api/projects/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params; // Next.js 15: params — Promise
  // ...
}
```

## Query параметры

```ts
const { searchParams } = new URL(request.url);
const date = searchParams.get("date"); // string | null
const DateSchema = z.string().date().optional();
const parsed = DateSchema.safeParse(date ?? undefined);
```

## Формат ответов

- Успех: возвращаем данные напрямую `{ id, name, ... }` или массив `[...]`
- Ошибка: `{ error: string }` или `{ error: string, details: Record<string, string[]> }` для validation
- Никаких обёрток типа `{ success: true, data: ... }` — добавляет сложность без пользы

## Zod v4 — изменения в схемах

```ts
// ❌ Zod v3 (deprecated)
z.string().email()
z.string().url()
z.string().uuid()
z.string().min(1, { message: "Required" })

// ✅ Zod v4
z.email()              // top-level форматы
z.url()
z.uuidv4()
z.string().min(1, { error: "Required" })  // единый параметр error

// coerce — только для внешних данных (query params, form data)
const pageSchema = z.coerce.number().int().min(1).default(1); // "2" → 2
```

## Response.json vs NextResponse.json

В Next.js 15 предпочтительнее нативный `Response.json()` — работает в любом runtime:

```ts
// ✅ Нативный Web API — предпочтительно
return Response.json({ id: "123" }, { status: 201 });

// ✅ NextResponse — когда нужны Next.js-специфичные фичи (cookies, headers)
import { NextResponse } from "next/server";
return NextResponse.json(data).cookies.set(...);
```
