---
name: TypeScript & React Standards
description: Coding conventions for TypeScript, React components and hooks
applyTo: "**/*.ts,**/*.tsx"
---

# TypeScript & React Standards

## TypeScript

### Types and interfaces

**Консенсус 2025 (Matt Pocock / TotalTypeScript):** `type` — по умолчанию. `interface` — только для объектного наследования через `extends`.

Причина: `interface` допускает декларативное слияние (declaration merging) — повторное объявление молча мержится, что приводит к трудноотлавливаемым багам.

```ts
// ✅ Правильно: type по умолчанию
type Project = {
  id: string;
  name: string;
  color: string;
};

type ApiResponse<T> = { data: T } | { error: string }; // union — только через type

// ✅ interface — только для extends-наследования (быстрее чем type &)
interface WithTimestamps {
  createdAt: Date;
  updatedAt: Date;
}
interface ProjectWithDates extends WithTimestamps {
  id: string;
  name: string;
}

// ❌ Неправильно: interface для рядовых типов
interface User { id: string; name: string; } // повторное объявление — молчаливый merge!
interface User { age: number; }              // ← не ошибка в TS, но баг на практике
```

### Discriminated unions вместо optional флагов

```ts
// ❌ Плохо: опциональные поля — неоднозначность
type AsyncState<T> = {
  data?: T;
  error?: string;
  isLoading?: boolean; // 8 возможных комбинаций, не все валидны
};

// ✅ Хорошо: discriminated union — каждое состояние явное
type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };
```

### `unknown` vs `any`

- Никогда не используй `any` — применяй `unknown` и сужай через type guards или Zod
- В catch-блоках: `catch (e: unknown)` — `useUnknownInCatchVariables: true` в tsconfig

```ts
// ❌ Плохо
try { doSomething(); } catch (e: any) { console.error(e.message); }

// ✅ Хорошо
try {
  doSomething();
} catch (e: unknown) {
  if (e instanceof Error) console.error(e.message);
}

// ❌ Плохо: any на API boundary
const data: any = await res.json();

// ✅ Хорошо: unknown + Zod parse
const raw: unknown = await res.json();
const data = UserSchema.parse(raw); // ZodError если невалидно
```

### Return types async функций

Аннотируй return type **только** когда у функции несколько ветвей или это public API. TypeScript выводит тип сам для простых функций.

```ts
// ✅ Аннотация нужна (несколько ветвей)
async function createOrUpdate(data: UserInput): Promise<User> {
  if (data.id) return db.user.update({ where: { id: data.id }, data });
  return db.user.create({ data });
}

// ✅ Аннотация не нужна (TypeScript выведет)
const getUser = async (id: string) => db.user.findUnique({ where: { id } });
```

### Imports

- Порядок групп: 1) React, 2) next, 3) сторонние, 4) внутренние (`@/*`), 5) относительные
- Path aliases: `@/components`, `@/lib`, `@/app`
- Именованные экспорты предпочтительнее default exports (кроме Next.js page/layout conventions)

### Null safety

- Используй optional chaining: `user?.profile?.name`
- Используй nullish coalescing: `value ?? defaultValue`
- Никогда не используй non-null assertion `!` в production без явной причины в комментарии

## React Components

### Структура компонента

```tsx
// 1. Imports (React → next → сторонние → @/ → относительные)
import { useState, useCallback } from "react";

// 2. Type для props (НЕ interface, если нет extends)
type ButtonProps = {
  label: string;
  onClick: () => void;         // ← prop: on* (контракт компонента)
  disabled?: boolean;
  variant?: "primary" | "secondary";
};

// 3. Компонент — именованный export, НЕ React.FC (устарел в React 18+)
export function Button({
  label,
  onClick,
  disabled = false,
  variant = "primary",
}: ButtonProps) {
  // 4. Hooks — только вверху
  const [isLoading, setIsLoading] = useState(false);

  // 5. Обработчики — handle* (реализация)
  const handleClick = useCallback(() => {
    setIsLoading(true);
    onClick();
  }, [onClick]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={variant === "primary" ? "bg-indigo-600" : "bg-gray-200"}
    >
      {label}
    </button>
  );
}
```

### React.FC — устарел, не использовать

```tsx
// ❌ Устарело: React.FC автоматически добавлял children — убрано в React 18+
const Button: React.FC<{ label: string }> = ({ label }) => <button>{label}</button>;

// ✅ Правильно: явная функция
function Button({ label }: { label: string }) { return <button>{label}</button>; }
```

### Именование: on* vs handle*

| Контекст | Конвенция | Пример |
|---|---|---|
| Props (контракт) | `on` + PascalCase | `onDelete`, `onFilterChange` |
| Обработчик внутри | `handle` + PascalCase | `handleDelete`, `handleFilterChange` |

```tsx
type SearchBarProps = {
  onFilterTextChange: (value: string) => void; // ← prop: on*
};
function SearchBar({ onFilterTextChange }: SearchBarProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterTextChange(e.target.value); // ← impl: handle*
  };
  return <input onChange={handleInputChange} />;
}
```

### Точные event types (не any, не React.SyntheticEvent)

```tsx
// ✅ Конкретные типы
(e: React.ChangeEvent<HTMLInputElement>) => void
(e: React.ChangeEvent<HTMLSelectElement>) => void
(e: React.FormEvent<HTMLFormElement>) => void
(e: React.MouseEvent<HTMLButtonElement>) => void
(e: React.KeyboardEvent<HTMLInputElement>) => void

// Ref — типизированный
const inputRef = useRef<HTMLInputElement>(null);
inputRef.current?.focus(); // ✅
```

### Правила

- `"use client"` — только когда НЕОБХОДИМО: useState, useEffect, event handlers, browser APIs
- Server Components по умолчанию — нет `"use client"` без причины
- Не мутировать props или state напрямую
- `key` в списках — всегда стабильный id, никогда index

## Async / Error handling

- Всегда обрабатывай ошибки в async функциях
- В компонентах: try/catch в event handlers
- В server actions и API routes: возвращай правильный HTTP статус
- Никогда не swallow errors молча (`catch (e) {}`)
