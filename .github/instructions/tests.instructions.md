---
name: Testing Standards
description: Vitest testing conventions for services and validations
applyTo: "**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx"
---

# Testing Standards

## Структура теста

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildReport } from "@/lib/services/report-service";

describe("buildReport", () => {
  // Один describe на функцию/модуль

  describe("when entries are empty", () => {
    it("should return zero totals", () => {
      const result = buildReport([]);
      expect(result.totalSeconds).toBe(0);
    });
  });

  describe("when entries have projects", () => {
    it("should group entries by project", () => {
      // Arrange
      const entries = [
        { projectId: "p1", durationSeconds: 3600, ... },
        { projectId: "p1", durationSeconds: 1800, ... },
      ];

      // Act
      const result = buildReport(entries);

      // Assert
      expect(result.byProject).toHaveLength(1);
      expect(result.byProject[0].totalSeconds).toBe(5400);
    });
  });
});
```

## Правила именования

- `describe()` — имя функции/компонента/модуля
- `it()` — начинается с `should`: "should return zero totals", "should throw when invalid"
- Вложенные `describe()` — для разных сценариев: "when authenticated", "when empty"

## Моки

```ts
// Мок модуля — в начале файла
vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Получить мок-функцию
import { prisma } from "@/lib/prisma";
const mockFindMany = vi.mocked(prisma.project.findMany);

// Настроить возвращаемое значение
mockFindMany.mockResolvedValue([{ id: "1", name: "Project" }]);
```

## Что тестировать

### ✅ Всегда тестируем

- `lib/services/` — вся бизнес-логика
- `lib/validations/` — Zod-схемы (happy path + error cases)
- `lib/utils/` — все утилитные функции

### ✅ Рекомендуется тестировать

- `lib/db/` — репозитории (с мок prisma)
- API routes (с мок репозиториев)

### ⚠️ Осторожно

- UI компоненты — только критичные, через RTL
- Без тестирования деталей реализации (не тестируй internal state)

## Паттерн тестирования Zod-схем

```ts
describe("CreateProjectSchema", () => {
  it("should accept valid input", () => {
    const result = CreateProjectSchema.safeParse({
      name: "My Project",
      color: "#6366f1",
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = CreateProjectSchema.safeParse({
      name: "",
      color: "#6366f1",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("name");
  });

  it("should reject invalid color format", () => {
    const result = CreateProjectSchema.safeParse({
      name: "Test",
      color: "red",
    });
    expect(result.success).toBe(false);
  });
});
```

## Запуск тестов

```bash
npx vitest run          # CI — запустить все тесты и выйти
npx vitest              # dev — watch mode
npx vitest run --coverage  # с покрытием
npx vitest run lib/services/report-service.test.ts  # конкретный файл
```
