# Time Tracker

Веб-приложение для учёта рабочего времени для фрилансеров, вдохновлённое Toggl.
Позволяет запускать/останавливать таймер, вести проекты и теги, отмечать billable-часы,
просматривать дашборд за неделю и экспортировать отчёты в CSV.

**Live Demo:** _ссылка появится после деплоя_

---

## Функциональность

### Основной трекер времени
- Кнопки **Start / Stop** для учёта времени
- Поле названия задачи с **автодополнением** из предыдущих задач
- Выбор **проекта** из выпадающего списка, выбор **тегов** (мульти-выбор, до 10)
- Отметка **Billable** (оплачиваемые часы)
- Активный таймер **всегда виден** в шапке страницы

### Управление записями
- Список записей с группировкой по **дате** (Today / Yesterday / дата)
- Группировка внутри дня по **проектам** с суммой времени
- **Инлайн-редактирование**: название задачи, проект, теги, billable
- **Ручная коррекция времени** (формат гг:мм, диапазон 00:01–99:59)
- Удаление записей с подтверждением
- Фильтрация по проекту, тегу, billable, тексту
- **Continue** — повторить запись одним кликом

### Управление проектами
- Создание и редактирование проектов с цветовой меткой
- Бюджет часов (estimatedHours) с прогресс-баром
- Почасовая ставка (hourlyRate) для расчёта заработка
- Архивирование/разархивирование проектов

### Теги
- Создание, редактирование, удаление тегов с цветом
- Привязка к записям времени

### Дашборд
- График за текущую неделю (stacked bar по проектам)
- Топ проектов с заработком
- Прогресс к цели недели (сохраняется в localStorage)
- Навигация по неделям

### Отчёты
- Выбор периода: День / Неделя / Месяц / Произвольный диапазон
- Группировка по проектам или по тегам
- Колонка заработка (если задана hourlyRate)
- **Экспорт в CSV**

### Аутентификация
- Регистрация / вход по email + пароль (bcrypt)
- OAuth: GitHub, Google
- JWT-стратегия (Auth.js v5), полная изоляция данных по userId

---

## Стек технологий

| Слой | Технология |
|------|-----------|
| Frontend | Next.js 15, App Router, React 19 |
| Язык | TypeScript (strict mode) |
| Стили | TailwindCSS v4 |
| Состояние | Zustand v5 |
| Auth | Auth.js v5 (next-auth@beta) + @auth/prisma-adapter |
| ORM | Prisma v7 + @prisma/adapter-pg |
| База данных | PostgreSQL (Neon.tech) |
| Валидация | Zod v4 |
| Графики | Recharts |
| Тесты | Vitest (103 теста) |

---

## Архитектура

```
app/                          # Next.js App Router
  (main)/page.tsx             # Главная: Dashboard + EntriesList
  (auth)/login|register/      # Auth-страницы (отдельный layout)
  projects/page.tsx           # Управление проектами
  tags/page.tsx               # Управление тегами
  reports/page.tsx            # Отчёты
  api/                        # API Routes

components/
  auth/                       # LoginForm, RegisterForm, OAuthButton
  timer/                      # TimerBar, TimerControls, TimerDisplay, TaskAutocomplete
  entries/                    # EntriesList, EntriesDayGroup, EntryItem, EntryDurationInput
  projects/                   # ProjectsList, ProjectItem, ColorPicker
  tags/                       # TagsList, TagItem, TagForm
  reports/                    # ReportsPage, PeriodSelector, ReportTable, ExportButton
  dashboard/                  # DashboardWidget, WeeklyBarChart, TopProjectsList
  ui/                         # Button, Input, Select, Modal, Toast, Badge, Spinner, UserMenu

lib/
  auth.ts                     # Auth.js config (providers, JWT callbacks)
  stores/                     # Zustand: timer-store.ts, entries-store.ts
  services/                   # report-service.ts, time-format-service.ts
  db/                         # *-repository.ts (все методы принимают userId)
  validations/                # Zod-схемы: project, tag, time-entry, auth
  utils/                      # date-utils.ts, api-client.ts (401 interceptor)
  prisma.ts                   # Prisma client singleton

prisma/
  schema.prisma               # User, Account, Project, Tag, TimeEntry, TimeEntryTag
```

**Ключевые решения:**
- Репозитории — единственный путь к БД (Prisma не используется напрямую в компонентах)
- `userId` всегда из сессии Auth.js, никогда из request body
- Zustand stores используют `apiFetch` с 401-interceptor → redirect /login
- TailwindCSS v4 CSS-first: только семантические токены (`bg-primary`, `text-text-1`)

---

## Запуск локально

### Требования
- Node.js 20+
- PostgreSQL (или аккаунт [Neon.tech](https://neon.tech))

### Шаги

```bash
# 1. Клонировать репозиторий
git clone https://github.com/YOUR_USERNAME/time-tracker.git
cd time-tracker

# 2. Установить зависимости
npm install

# 3. Настроить окружение
cp .env.example .env.local
# → заполнить переменные (см. ниже)

# 4. Применить схему к БД
npm run db:push

# 5. Запустить dev server
npm run dev
# → http://localhost:3000
```

### Переменные окружения

```env
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"
AUTH_SECRET="your-32-char-secret"   # openssl rand -base64 32

# OAuth (опционально)
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_GOOGLE_CLIENT_ID=
AUTH_GOOGLE_CLIENT_SECRET=
```

---

## Скрипты

```bash
npm run dev           # Dev server (localhost:3000)
npm run build         # Production build
npm run type-check    # TypeScript без emit
npm run lint          # ESLint
npm run format        # Prettier
npx vitest run        # Тесты (103 теста)
npm run db:push       # Применить Prisma schema к БД
npm run db:studio     # Prisma Studio
npm run db:generate   # Сгенерировать Prisma client
```

---

## Тесты

Unit-тесты сервисов и Zod-схем (Vitest, node environment):

```bash
npx vitest run
# 103 тестов, 0 failed
```

Покрытие:
- `lib/validations/project-schema.test.ts` — 20 тестов
- `lib/validations/tag-schema.test.ts` — 16 тестов
- `lib/validations/time-entry-schema.test.ts` — 23 теста
- `lib/services/report-service.test.ts` — 44 теста

---

## Деплой на Vercel

1. Запушить код на GitHub
2. Зайти на [vercel.com](https://vercel.com) → **Import Project** → выбрать репо
3. Добавить **Environment Variables** в настройках Vercel:
   - `DATABASE_URL` — PostgreSQL строка подключения (Neon.tech)
   - `AUTH_SECRET` — случайная строка (≥32 символа)
   - OAuth-ключи при необходимости
4. Нажать **Deploy**
5. После деплоя выполнить `npx prisma db push` с production `DATABASE_URL` — создать таблицы

> `postinstall: prisma generate` в package.json гарантирует генерацию Prisma client на Vercel автоматически.
