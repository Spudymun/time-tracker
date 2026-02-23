---
name: Services Standards
description: Business logic patterns for lib/services/**
applyTo: "lib/services/**/*.ts"
---

# Services Standards

## Что такое service

Service — **чистая функция** (или набор функций) с бизнес-логикой, которая не обращается к БД напрямую.

```
lib/services/          ← бизнес-логика (вычисления, трансформации)
lib/db/                ← доступ к БД (репозитории)
app/api/               ← HTTP-слой (роуты)
```

## Структура файла

```ts
// lib/services/report-service.ts
import type { TimeEntry, Project } from "../../generated/prisma/client";

// Локальные типы результата — всегда явные
export interface ProjectReport {
  projectId: string | null;
  projectName: string;
  totalSeconds: number;
  entriesCount: number;
  percentage: number;
}

export interface ReportResult {
  totalSeconds: number;
  byProject: ProjectReport[];
  periodDays: number;
}

// Именованные экспорты функций (не класс, не default)
export function buildReport(
  entries: TimeEntry[],
  projects: Project[],
  periodDays: number
): ReportResult {
  // Создай Map для быстрого поиска проекта по id
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const totalSeconds = entries.reduce((sum, e) => sum + e.durationSeconds, 0);

  // Группировка — только функциональные методы (reduce, map, filter)
  const grouped = entries.reduce<Record<string, number>>((acc, entry) => {
    const key = entry.projectId ?? "none";
    acc[key] = (acc[key] ?? 0) + entry.durationSeconds;
    return acc;
  }, {});

  const byProject: ProjectReport[] = Object.entries(grouped).map(([key, seconds]) => {
    const project = key === "none" ? null : (projectMap.get(key) ?? null);
    return {
      projectId: key === "none" ? null : key,
      projectName: project?.name ?? "Без проекта",
      totalSeconds: seconds,
      entriesCount: entries.filter((e) => (e.projectId ?? "none") === key).length,
      percentage: totalSeconds > 0 ? Math.round((seconds / totalSeconds) * 100) : 0,
    };
  });

  return { totalSeconds, byProject, periodDays };
}
```

## Правила

### Pure functions

```ts
// ✅ Чистая функция — детерминирована, нет side effects
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

// ❌ Плохо: side effect в сервисе
function processEntry(entry: TimeEntry): void {
  console.log(entry); // side effect
  db.save(entry); // DB доступ — это работа репозитория, не сервиса
}
```

### Обработка ошибок в сервисах

```ts
// Сервис бросает доменные ошибки — не HTTP коды
// HTTP коды — ответственность API route

export class ReportError extends Error {
  constructor(
    message: string,
    public readonly code: "INVALID_PERIOD" | "NO_DATA"
  ) {
    super(message);
    this.name = "ReportError";
  }
}

export function buildReport(entries: TimeEntry[], periodDays: number): ReportResult {
  if (periodDays <= 0) {
    throw new ReportError("Period must be positive", "INVALID_PERIOD");
  }
  // ...
}
```

### Тестируемость

Каждая функция в `lib/services/` должна иметь unit тест рядом:

```
lib/services/report-service.ts
lib/services/report-service.test.ts   ← тест рядом
```

Сервисы тестируются без моков БД — передавай данные через параметры.

## Запрещено

- Импортировать `prisma` в service — только через параметры функции или репозиторий
- Импортировать `NextResponse` — сервис не знает о HTTP
- Мутировать входные параметры — возвращай новые объекты
- `any` в сигнатурах функций
