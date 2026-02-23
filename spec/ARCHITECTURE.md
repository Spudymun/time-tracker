# Time Tracker — Architecture

> Архитектурные решения и паттерны.
> Объясняет ПОЧЕМУ код организован именно так.

## Стек

| Слой       | Технология             | Версия | Причина выбора                       |
| ---------- | ---------------------- | ------ | ------------------------------------ |
| Framework  | Next.js App Router     | 15     | SSR + API routes в одном проекте     |
| Language   | TypeScript             | 5.x    | Strict mode для надёжности           |
| Styling    | TailwindCSS            | v4     | Utility-first, нет CSS bloat         |
| State      | Zustand                | 5.x    | Minimal boilerplate                  |
| ORM        | Prisma v7 + PG adapter | 7.x    | Type-safe queries, schema migrations |
| Auth       | Auth.js v5 (next-auth) | 5.x    | Native Next.js 15 App Router support |
| Auth DB    | @auth/prisma-adapter   | latest | User + Account таблицы через Prisma  |
| Passwords  | bcryptjs               | 3.x    | Pure JS, Edge-compatible             |
| Forms      | react-hook-form        | 7.x    | Controlled forms, Zod resolver       |
| Validation | Zod                    | 4.x    | Runtime + compile-time validation    |
| Tests      | Vitest                 | 3.x    | Fast, ESM-native                     |
| DB         | PostgreSQL (Neon.tech) | 16     | Serverless-friendly                  |

## Структура папок

```
app/                    # Next.js App Router
  (main)/               # Route group без URL сегмента
  api/                  # API handlers
components/             # React компоненты
  [feature]/            # По фиче: timer/, entries/, projects/
  ui/                   # Общие: Button, Input, Modal
lib/
  stores/               # Zustand (client-only, "use client")
  services/             # Бизнес-логика (pure functions, testable)
  db/                   # Репозитории (Prisma доступ)
  validations/          # Zod-схемы
  utils/                # Утилиты (format, errors)
  prisma.ts             # Singleton Prisma Client
spec/                   # Спецификация (не попадает в production)
mcp/                    # Кастомный MCP сервер
```

## Ключевые паттерны

### Layered Architecture (dependency flow)

```
UI (components) → Stores/Hooks → API Routes → Repositories → Prisma → DB
                                      ↓
                                  Services (business logic)
```

- UI никогда не обращается в БД напрямую
- Stores не знают о Prisma
- API routes — thin: валидация + вызов репозитория/сервиса

### Repository Pattern

Каждая сущность имеет свой репозиторий в `lib/db/`:

```ts
export const projectsRepository = {
  findAll: () => prisma.project.findMany(...),
  create: (data) => prisma.project.create(...),
  // ...
};
```

**Почему**: изолирует DB-логику, легко мокировать в тестах.

### Prisma Singleton

```ts
// lib/prisma.ts — единственный инстанс для всего приложения
const globalForPrisma = globalThis as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (dev) globalForPrisma.prisma = prisma;
```

**Почему**: предотвращает connection pool exhaustion при hot-reload в dev.

### Zod-first Validation

Входящие данные валидируются **до** любой бизнес-логики или DB-операций.

```ts
const result = Schema.safeParse(body);
if (!result.success) return 400;
// только теперь работаем с данными
```

### Client/Server разделение

- `"use client"` — только при необходимости: useState, useEffect, event handlers
- Server Components — по умолчанию (без директивы)
- Zustand stores — только в Client компонентах

## Аутентификация

### Стратегия: Auth.js v5 + JWT

- **`lib/auth.ts`** — конфиг Auth.js: Credentials + GitHub + Google providers, JWT strategy, колбэки `jwt` и `session` добавляют `userId` в токен
- **`middleware.ts`** (корень проекта) — защищает все маршруты кроме `/login`, `/register`, `/api/auth/**`
- **JWT** — нет Session-таблицы, быстрее на serverless
- **`@auth/prisma-adapter`** — User + Account в БД (для OAuth linking)

### Изоляция данных (ключевое соображение)

Все репозитории получают `userId` из сессии, **никогда** из тела запроса.
Доступ к не своему ресурсу возвращает `404` (не `403`) — не раскрывает наличие чужих записей.

```
API Route: const session = await auth(); // всегда первым действием
if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
const result = await repository.findAll({ userId: session.user.id }); // обязательно
```

### Middleware стратегия

Добавить `/login` и `/register` в публичные маршруты, все остальные — защищены.
API-маршруты без сессии: `401 Unauthorized` (не редирект, чтобы не ломать fetch).

---

## Решения и компромиссы

| Решение                     | Альтернатива          | Почему выбрали                                            |
| --------------------------- | --------------------- | --------------------------------------------------------- |
| Prisma adapter-pg           | Стандартный Prisma    | Edge runtime совместимость                                |
| Auth.js v5 JWT strategy     | Iron Session / Custom | Стандарт для Next.js 15, OAuth out of the box             |
| TailwindCSS v4              | CSS Modules           | Нет конфига, встроен в CSS                                |
| Vitest без RTL              | Jest + RTL            | Быстрее, ESM-native, достаточно для unit-тестов           |
| Recharts                    | Chart.js / D3         | React-native, легкая интеграция, достаточно для bar chart |
| No next.config.ts изменений | Кастомные настройки   | YAGNI — добавлять по мере необходимости                   |

## Структура папок (детальная)

```
app/
  (main)/
    page.tsx              # Главная: Dashboard + EntriesList
  (auth)/
    layout.tsx            # Центрированный layout (без TimerBar)
    login/page.tsx
    register/page.tsx
  projects/page.tsx       # Управление проектами
  tags/page.tsx           # Управление тегами
  reports/page.tsx        # Отчёты
  layout.tsx              # Root layout с TimerBar + UserMenu в хедере
  api/
    auth/
      register/route.ts     # POST — регистрация email+password
      [...nextauth]/route.ts # Auth.js handler
    projects/route.ts         # GET, POST
    projects/[id]/route.ts    # GET, PUT, DELETE
    tags/route.ts             # GET, POST
    tags/[id]/route.ts        # PUT, DELETE
    time-entries/route.ts     # GET, POST
    time-entries/active/route.ts       # GET
    time-entries/[id]/route.ts         # GET, PUT, DELETE
    time-entries/[id]/stop/route.ts    # POST
    time-entries/[id]/continue/route.ts # POST
    task-names/route.ts       # GET (?q=)
    reports/route.ts          # GET
    reports/export/route.ts   # GET (CSV)
    dashboard/route.ts        # GET

components/
  auth/                    # LoginForm, RegisterForm, OAuthButton
  timer/                   # TimerBar, TimerControls, TimerDisplay, TaskAutocomplete
  entries/                 # EntriesList, EntriesDayGroup, EntryItem...
  projects/                # ProjectsList, ProjectItem, ColorPicker...
  tags/                    # TagsList, TagItem, TagSelect, TagChip...
  reports/                 # ReportsPage, PeriodSelector, ReportTable...
  dashboard/               # DashboardWidget, WeeklyBarChart...
  ui/                      # Button, Input, Select, Modal, Toast, Badge...
                           # UserMenu (header user avatar + sign out)

lib/
  auth.ts                  # Auth.js конфиг: providers, JWT callbacks, pages
  stores/
    timer-store.ts         # Активный таймер, elapsed seconds
    entries-store.ts       # Список записей
  services/
    report-service.ts      # buildReport, entriesToCsv
    time-format-service.ts # formatDuration, parseDurationInput
  db/
    projects-repository.ts
    tags-repository.ts
    time-entries-repository.ts
    task-names-repository.ts
  validations/
    project-schema.ts
    tag-schema.ts
    time-entry-schema.ts
    auth-schema.ts         # RegisterSchema, LoginSchema (Zod)
  utils/
    date-utils.ts          # startOfWeek, formatDate, toUTC
    error-utils.ts         # handleApiError
  prisma.ts
middleware.ts              # Auth.js middleware: защита маршрутов
```
