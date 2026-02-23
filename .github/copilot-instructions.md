# Time Tracker

Веб-приложение для учёта рабочего времени для фрилансеров, вдохновлённое Toggl.
Позволяет запускать/останавливать таймер, вести проекты и теги, отмечать billable-часы,
смотреть дашборд за неделю и экспортировать отчёты в CSV.

## Tech Stack

### Frontend

- Next.js 15 App Router, TypeScript strict mode
- TailwindCSS v4 — единственная система стилизации (без CSS-modules, без styled-components)
- Zustand — клиентское управление состоянием

### Backend / Data

- Next.js API Routes (`app/api/**/route.ts`)
- Auth.js v5 (`next-auth@beta`) — JWT strategy, Credentials + GitHub + Google OAuth
- `@auth/prisma-adapter` + `bcryptjs` — User/Account tables, password hashing
- Prisma ORM v7 + PostgreSQL (через `@prisma/adapter-pg`)
- Zod — валидация входящих данных во всех API routes

### Testing

- Vitest — unit-тесты для сервисов и Zod-схем
- React Testing Library (если настроен vitest jsdom)

## Project Structure

```
app/
  (main)/page.tsx            # Главная: Dashboard + EntriesList
  (auth)/
    layout.tsx               # Центрированный layout (без TimerBar)
    login/page.tsx           # Страница входа
    register/page.tsx        # Страница регистрации
  projects/page.tsx          # Управление проектами
  tags/page.tsx              # Управление тегами
  reports/page.tsx           # Отчёты
  layout.tsx                 # Root layout с TimerBar + UserMenu в хедере
  api/
    auth/
      register/route.ts      # POST — регистрация email+password
      [...nextauth]/route.ts # Auth.js handler
    projects/route.ts
    projects/[id]/route.ts
    tags/route.ts
    tags/[id]/route.ts
    time-entries/route.ts
    time-entries/active/route.ts
    time-entries/[id]/route.ts
    time-entries/[id]/stop/route.ts
    time-entries/[id]/continue/route.ts
    task-names/route.ts
    reports/route.ts
    reports/export/route.ts   # CSV экспорт
    dashboard/route.ts
components/
  auth/                      # LoginForm, RegisterForm, OAuthButton
  timer/                     # TimerBar, TimerControls, TimerDisplay, TaskAutocomplete
  entries/                   # EntriesList, EntriesDayGroup, EntryItem
  projects/                  # ProjectsList, ProjectItem, ColorPicker
  tags/                      # TagsList, TagItem, TagSelect, TagChip
  reports/                   # ReportsPage, PeriodSelector, ReportTable
  dashboard/                 # DashboardWidget, WeeklyBarChart, TopProjectsList
  ui/                        # Button, Input, Select, Modal, Toast, Badge, UserMenu
lib/
  auth.ts                    # Auth.js конфиг (providers, JWT callbacks, pages)
  stores/                    # Zustand: timer-store.ts, entries-store.ts
  services/                  # report-service.ts, time-format-service.ts
  db/                        # *-repository.ts (ВСЕ принимают userId)
  validations/               # project-schema.ts, tag-schema.ts, time-entry-schema.ts, auth-schema.ts
  utils/                     # date-utils.ts, error-utils.ts
  prisma.ts                  # Prisma singleton
prisma/
  schema.prisma              # User, Account, VerificationToken, Project, Tag, TimeEntry, TimeEntryTag
spec/
  VISION.md                  # Что строим, зачем, для кого
  DOMAIN.md                  # Сущности и связи
  ARCHITECTURE.md            # Архитектурные решения
  BUSINESS_RULES.md          # Бизнес-правила
  DESIGN_SYSTEM.md           # Дизайн-система: токены, components/ui/, правила стилей
  UI_STATES.md               # Empty/loading/error states, 401 interceptor, системные страницы
  FEATURE_auth.md            # Аутентификация
  FEATURE_timer.md           # Активный таймер
  FEATURE_entries.md         # Список записей
  FEATURE_projects.md        # Управление проектами
  FEATURE_tags.md            # Управление тегами
  FEATURE_reports.md         # Отчёты и CSV
  FEATURE_dashboard.md       # Dashboard с графиком
mcp/
  server.ts                  # MCP сервер (читает spec-файлы)
middleware.ts                # Auth.js route protection
types/
  next-auth.d.ts             # Расширение Session/JWT типов
```

## Code Guidelines

- TypeScript strict mode — без `any`, используй `unknown` и type guards для сужения
- Функциональные React-компоненты с hooks, без class components
- Именование файлов: `kebab-case` для файлов/папок, `PascalCase` для компонентов
- **Auth first**: каждый API route начинается с `const session = await auth(); if (!session?.user?.id) return 401`
- **userId isolation**: репозитории всегда фильтруют по `userId` из сессии, никогда из body
- Zod-валидация в каждом POST/PUT route ДО обращения к БД
- Ошибки API: 400 validation, 401 unauthorized, 404 not found, 409 conflict, 500 server error
- Возвращать `NextResponse.json()` с правильными status кодами
- Prisma client — только через singleton `lib/prisma.ts`
- Репозитории — plain objects с методами (не классы)
- Никогда не импортировать Prisma в компонентах или stores — только через репозитории
- Тикающий таймер/интервалы: `useEffect + setInterval` только в Client компонентах

## Design System Rules

> Полные правила: `.github/instructions/design-system.instructions.md` — **ОБЯЗАТЕЛЬНО читать перед созданием любого компонента**  
> Спецификация: `spec/DESIGN_SYSTEM.md`  
> Токены: `app/globals.css` (@theme OKLCH)

- **ЕДИНСТВЕННАЯ библиотека стилей** — TailwindCSS v4 CSS-first
- **Запрещены** `style={{}}` inline-стили (кроме `style={{ backgroundColor: color }}` для динамических цветов)
- **Запрещены** Tailwind palette-классы напрямую: `bg-indigo-600`, `text-slate-400`, `bg-gray-100` — только семантические токены
- **Обязательные классы текста**: `text-text-1` / `text-text-2` / `text-text-3` (не slate-\*)
- **Обязательные классы фона**: `bg-bg` / `bg-surface` / `bg-surface-2` (не white/gray)
- **Обязательные классы акцента**: `bg-primary` / `text-primary` (не indigo-\*)
- **Запрещено** создавать `<button>` / `<input>` / модалы вне `components/ui/`
- Все loading-состояния: `<Spinner />` из `components/ui/`, никогда текст "Loading..."
- Время `HH:MM:SS` — всегда через `className="timer-display ..."` (из globals.css)
- Каждый интерактивный элемент: `hover:` + `focus-visible:ring-2 focus-visible:ring-primary` + `disabled:opacity-50` обязательны

## Spec-Driven Workflow

Перед реализацией фичи агент ОБЯЗАН:

1. Прочитать `spec/FEATURE_{name}.md` — требования, правила, edge cases
2. Прочитать `spec/DOMAIN.md` — определения сущностей
3. Прочитать `spec/BUSINESS_RULES.md` — глобальные ограничения
4. Если spec отсутствует — сообщить пользователю, не делать предположений

Используй MCP tool `read_feature(name)` или `#file:spec/FEATURE_{name}.md` для загрузки контекста.

## Build and Test

```bash
npm install              # установить зависимости
npm run dev              # dev server (localhost:3000)
npm run build            # production build
npm run lint             # ESLint
npm run format           # Prettier
npm run type-check       # tsc без emit
npx vitest run           # запуск тестов (CI)
npm run db:push          # применить схему Prisma к БД
npm run db:generate      # генерировать Prisma client
npm run mcp:build        # собрать кастомный MCP сервер
npm run mcp:dev          # запустить MCP сервер в dev режиме
```

## Environment Variables

```
DATABASE_URL=  # PostgreSQL connection string (Neon.tech или локальный)
AUTH_SECRET=   # openssl rand -base64 32 (min 32 chars)
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_GOOGLE_CLIENT_ID=
AUTH_GOOGLE_CLIENT_SECRET=
```
