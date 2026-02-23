---
name: Naming Conventions
description: Naming rules for all files, variables, functions, types across the project
applyTo: "**/*.ts,**/*.tsx"
---

# Naming Conventions

## Файлы и папки

```
kebab-case        → все файлы и папки
  timer-store.ts
  project-card.tsx
  prisma-errors.ts
  components/active-timer/

PascalCase        → только компоненты (файл = имя компонента)
  ProjectCard.tsx
  ActiveTimer.tsx

page.tsx, layout.tsx, route.ts  → Next.js конвенции, как есть
```

## Переменные и функции

```ts
// camelCase — переменные, функции, параметры
const userEmail = "test@example.com";
function calculateTotal(items: Item[]): number { ... }

// SCREAMING_SNAKE_CASE — константы (compile-time известные значения)
const MAX_ITEMS_PER_PAGE = 20;
const DEFAULT_COLOR = "#6366f1";

// Булевы переменные — префикс is/has/can/should
const isLoading = true;
const hasPermission = false;
const canEdit = user.role === "admin";
const shouldRefetch = staleTime > 0;

// Функции возвращающие boolean — те же префиксы
function isValidColor(value: string): boolean { ... }
function hasActiveTimer(entries: TimeEntry[]): boolean { ... }
```

## Типы и интерфейсы

```ts
// PascalCase — интерфейсы, типы, enum
interface ProjectCardProps { ... }      // props компонента
interface TimeEntry { ... }             // доменная сущность
type LoadingState = "idle" | "loading" | "success" | "error";  // union type
type ButtonVariant = "primary" | "secondary" | "danger";

// ❌ Не добавляй префикс I к интерфейсам
interface IProject { ... }   // устаревший C#-стиль, запрещено
```

## React компоненты

```tsx
// PascalCase — имя компонента = имя файла
export function ProjectCard() { ... }    // файл: ProjectCard.tsx
export function ActiveTimer() { ... }    // файл: ActiveTimer.tsx

// Props интерфейс: ComponentName + "Props"
interface ProjectCardProps { ... }
interface ActiveTimerProps { ... }
```

## Zustand stores

```ts
// Хук: use + Domain + Store
export const useTimerStore = create<TimerState>(...);
export const useEntriesStore = create<EntriesState>(...);

// Actions — глаголы
start, stop, reset, add, remove, update, fetch, set

// State fields — существительные или is/has
entries, projects, isLoading, error, selectedId, activeEntry
```

## API routes и репозитории

```ts
// Репозиторий — camelCase + "Repository"
export const projectsRepository = { ... };
export const timeEntriesRepository = { ... };

// Zod схемы — PascalCase + "Schema"
export const CreateProjectSchema = z.object({ ... });
export const UpdateProjectSchema = z.object({ ... });

// Zod inferred types — PascalCase + "Input"
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
```

## Handler функции в компонентах

Правило: `on*` — пропсы (контракт), `handle*` — реализация (внутри компонента):

```tsx
// Props — on*
type SearchBarProps = {
  onFilterTextChange: (value: string) => void;
  onDelete: (id: string) => Promise<void>;
};

// Реализация внутри — handle*
function SearchBar({ onFilterTextChange }: SearchBarProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterTextChange(e.target.value); // вызываем prop
  };
  return <input onChange={handleInputChange} />;
}

// ❌ Плохо
onClick = { handleX }; // как prop
onChange = { handleX }; // как prop (если это ваш компонент)
// ✅ Хорошо — однозначно читается и native DOM подтверждает
onClick = { handleX }; // native button — prop всегда on*
```

## Запрещённые паттерны

```ts
// ❌ Однобуквенные переменные (кроме итераторов i, j, k в for-loop)
const x = project.id;
const d = new Date();

// ❌ Сокращения которые неочевидны
const usr = user;
const proj = project;

// ✅ Исключение: стандартные сокращения в конкретных контекстах
const i = 0;          // итератор — ок
const e = new Error();  // в catch-блоке — ок
const res = await fetch(...);  // response — общепринято
const req = request;           // request — общепринято
const err = error;             // в catch — ок
```
