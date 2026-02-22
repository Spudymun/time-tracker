---
name: React Components Standards
description: Structure, composition and patterns for React components
applyTo: "components/**/*.tsx"
---

# React Components Standards

## Структура файла (строгий порядок)

```tsx
// 1. Импорты (группами: react → next → сторонние → @/ внутренние → относительные)
import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/types";

// 2. Interface для props — всегда явный, не inline
interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

// 3. Компонент — именованный экспорт (не default)
export function ProjectCard({ project, onDelete, isLoading = false }: ProjectCardProps) {
  // 3a. Хуки — только в начале
  const [isPending, setIsPending] = useState(false);

  // 3b. Derived state / computed values
  const isDisabled = isLoading || isPending;

  // 3c. Handlers
  const handleDelete = useCallback(async () => {
    setIsPending(true);
    try {
      await onDelete(project.id);
    } finally {
      setIsPending(false);
    }
  }, [project.id, onDelete]);

  // 3d. JSX
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-medium">{project.name}</h3>
      <Button onClick={handleDelete} disabled={isDisabled} variant="destructive">
        {isPending ? "Удаление..." : "Удалить"}
      </Button>
    </div>
  );
}
```

## Лимит размера

**Максимум 150 строк на файл.** Если больше — разбить на subcomponents:

```
components/projects/
  ProjectCard.tsx        ← карточка (≤150 строк)
  ProjectCardActions.tsx ← кнопки внутри карточки
  ProjectsList.tsx       ← список
  ProjectForm.tsx        ← форма создания/редактирования
```

## Композиция вместо дублирования

```tsx
// ❌ Плохо: отдельный компонент для каждой сущности
// ProjectDeleteDialog.tsx
// EntryDeleteDialog.tsx

// ✅ Хорошо: конфигурируемый через props
interface ConfirmDialogProps {
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  variant?: "danger" | "default";
}
export function ConfirmDialog({ ... }: ConfirmDialogProps) { ... }
```

## Server vs Client компоненты

```tsx
// Server Component (по умолчанию) — без "use client"
// ✅ async + await напрямую в компоненте
// ✅ прямой доступ к серверным ресурсам
// ❌ нет useState, useEffect, обработчиков событий

// Client Component — с "use client" в первой строке
"use client";
// ✅ useState, useEffect, обработчики событий
// ✅ Zustand stores
// ❌ нет async/await в теле компонента

// Правило: "use client" — только если компонент ДЕЙСТВИТЕЛЬНО интерактивен
```

## Булевы props

```tsx
// ✅ Сокращённая запись для true
<Button disabled />   // то же что disabled={true}

// Булевы пропсы — префиксы: is, has, can, should
interface Props {
  isLoading: boolean;
  hasError: boolean;
  canEdit: boolean;
}
```

## Обработка пустых состояний

```tsx
// Всегда обрабатывай: loading, error, empty
export function ProjectsList({ projects, isLoading }: Props) {
  if (isLoading) return <LoadingSpinner />;
  if (projects.length === 0) return <EmptyState message="Нет проектов" />;

  return (
    <ul>
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} />
      ))}
    </ul>
  );
}
```

## Compound Components — вместо prop-флагов

Если компонент получает >4-5 boolean-пропсов — используй Compound Component pattern:

```tsx
// ❌ Плохо: prop drilling с флагами
<UserCard user={user} showAvatar isAdmin hasActions onDelete={...} />

// ✅ Хорошо: Compound Components
const UserCardContext = createContext<{ user: User } | null>(null);

export function UserCard({ user, children }: { user: User; children: React.ReactNode }) {
  return (
    <UserCardContext.Provider value={{ user }}>
      <div className="card">{children}</div>
    </UserCardContext.Provider>
  );
}

UserCard.Avatar = function Avatar() {
  const { user } = useContext(UserCardContext)!;
  return <img src={user.avatarUrl} alt={user.name} />;
};

UserCard.Actions = function Actions({ children }: { children: React.ReactNode }) {
  return <div className="card-actions">{children}</div>;
};

// Использование:
<UserCard user={user}>
  <UserCard.Avatar />
  <UserCard.Actions><button onClick={onDelete}>Delete</button></UserCard.Actions>
</UserCard>
```

## server-only — защита серверного кода

```ts
// Добавляй в файлы с секретами / прямым DB-доступом
import "server-only"; // build-time error если импортировать в Client Component
```

## Запрещено

- `any` в props — используй конкретный тип или `unknown`
- `default export` — только именованные экспорты (кроме page.tsx, layout.tsx)
- `React.FC` — устарел, используй явные функции
- Inline styles — только TailwindCSS классы
- Прямые fetch/Prisma вызовы внутри компонента — только через props или store
