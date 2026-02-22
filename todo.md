# todo.md — Time Tracker

> Обновляется в процессе разработки. Агент отмечает [x] после выполнения.

---

## Setup

- [x] Заполнить spec.md
- [x] Заполнить spec/VISION.md
- [x] Заполнить spec/DOMAIN.md
- [x] Заполнить spec/ARCHITECTURE.md
- [x] Заполнить spec/BUSINESS_RULES.md
- [x] Создать spec/FEATURE_timer.md
- [x] Создать spec/FEATURE_entries.md
- [x] Создать spec/FEATURE_projects.md
- [x] Создать spec/FEATURE_tags.md
- [x] Создать spec/FEATURE_reports.md
- [x] Создать spec/FEATURE_dashboard.md
- [x] Создать spec/FEATURE_auth.md
- [x] Создать spec/DESIGN_SYSTEM.md
- [x] Создать spec/UI_STATES.md
- [ ] Скопировать .env.example → .env.local и заполнить DATABASE_URL + AUTH_SECRET + OAuth креденшиалы
- [ ] Запустить `npm install`
- [x] Установить: `npm install next-auth@beta @auth/prisma-adapter bcryptjs recharts`
- [x] Установить devDeps: `npm install -D @types/bcryptjs`
- [x] Запустить `npm run mcp:build`

## UI Примитивы + Design System (Промпт 6а)

- [ ] Установить lucide-react (`npm install lucide-react`)
- [ ] Создать components/ui/Spinner.tsx (sizes: sm|md|lg)
- [ ] Создать components/ui/Button.tsx (варианты primary/secondary/danger/ghost, loading, disabled)
- [ ] Создать components/ui/Input.tsx (label, error, forwardRef)
- [ ] Создать components/ui/Modal.tsx (portal, Escape, backdrop, scroll lock, aria)
- [ ] Создать components/ui/Toast.tsx + useToast hook (success/error/info, auto-dismiss 3s/5s)
- [ ] Добавить ToastProvider в app/layout.tsx
- [ ] Создать components/ui/Badge.tsx (variant: default|archived|billable)
- [ ] Создать components/ui/TagChip.tsx (color, name, onRemove?)
- [ ] Создать components/ui/Select.tsx (базовый select)
- [ ] Создать lib/utils/api-client.ts (apiFetch с 401 interceptor → redirect /login)
- [ ] Обновить stores (заменить fetch на apiFetch в timer-store.ts и entries-store.ts)

## Auth (Prompt 0)

- [x] Создать lib/auth.ts (NextAuth config: Credentials + GitHub + Google, JWT strategy)
- [x] Создать app/api/auth/[...nextauth]/route.ts
- [x] Создать middleware.ts (защита маршрутов + 401 для API)
- [x] Создать types/next-auth.d.ts (расширение Session + JWT типов)
- [x] Создать lib/validations/auth-schema.ts (RegisterSchema, LoginSchema)
- [x] Создать app/api/auth/register/route.ts (POST: bcrypt + create user, 409 on duplicate)

## Infrastructure

- [x] Обновить prisma/schema.prisma — модели User, Account, VerificationToken (от @auth/prisma-adapter)
      • Project/Tag/TimeEntry: добавить userId (FK → User, onDelete:Cascade)
      • Project.name/Tag.name: изменить на @@unique([userId, name])
- [ ] Запустить `npm run db:push`
- [x] Убедиться что lib/prisma.ts singleton создан корректно
- [x] Создать lib/utils/date-utils.ts (toUTC, startOfWeek, formatDate)
- [x] Создать lib/utils/time-format.ts (formatDuration, parseDurationInput)

## Data Layer

- [x] Создать lib/validations/project-schema.ts
      • CreateProjectSchema: name, color, estimatedHours?, hourlyRate?
      • UpdateProjectSchema: + isArchived?
- [x] Создать lib/validations/tag-schema.ts (CreateTagSchema, UpdateTagSchema)
- [x] Создать lib/validations/time-entry-schema.ts (CreateEntrySchema, UpdateEntrySchema, StopEntrySchema)
- [x] Тесты для схем: project-schema.test.ts, tag-schema.test.ts, time-entry-schema.test.ts (59 тестов)
- [x] Создать lib/db/projects-repository.ts
      • ВСЕ методы принимают userId: string (первым аргументом)
      • findAll(userId, filter?), findById, create, update, delete, archive, unarchive
- [x] Создать lib/db/tags-repository.ts — все методы с userId
- [x] Создать lib/db/time-entries-repository.ts
      • все методы с userId; findMany: фильтры tagId, q (подстрока by description)
      • TimeEntryWithRelations тип с project + timeEntryTags.tag
- [x] Создать lib/db/task-names-repository.ts — findRecent(userId, q?)

## Services

- [ ] Создать lib/services/report-service.ts
      • buildReport() — byProject[] с earnings + totalEarnings
      • buildTagReport() — byTag[]
      • calcEarnings(billableSeconds, hourlyRate | null)
      • buildDashboard() — topProjects с earnings + totalEarnings
      • entriesToCsv()
- [ ] Создать lib/services/time-format-service.ts (formatDuration, parseDurationInput)
- [ ] Тесты для report-service.test.ts
      • empty entries, multiple projects, entry with multiple tags, calcEarnings edge cases

## API — Projects

- [ ] GET/POST /api/projects (с `userId` из session)
- [ ] GET/PUT/DELETE /api/projects/[id] (с `userId` из session)

## API — Tags

- [ ] GET/POST /api/tags (с `userId` из session)
- [ ] PUT/DELETE /api/tags/[id] (с `userId` из session)

## API — Time Entries

- [ ] GET/POST /api/time-entries (с userId; POST: авто-стоп предыдущего таймера user'a)
- [ ] GET /api/time-entries/active (с userId)
- [ ] GET/PUT/DELETE /api/time-entries/[id] (с userId)
- [ ] POST /api/time-entries/[id]/stop (с userId)
- [ ] POST /api/time-entries/[id]/continue (с userId)
- [ ] GET /api/task-names?q= (с userId)

## API — Reports & Dashboard

- [ ] GET /api/reports?from=&to= (отвечает byProject[] + byTag[] + totalEarnings)
- [ ] GET /api/reports/export?from=&to= (CSV)
- [ ] GET /api/dashboard?from=&to= (отвечает totalEarnings + earnings в topProjects)

## UI — Timer (FEATURE_timer.md)

- [ ] Создать lib/stores/timer-store.ts
- [ ] TimerDisplay.tsx (тикающий счётчик hh:mm:ss)
- [ ] TaskAutocomplete.tsx (поле с dropdown)
- [ ] ProjectSelect.tsx (dropdown проектов)
- [ ] TagSelect.tsx (мульти-выбор тегов)
- [ ] BillableToggle.tsx (чекбокс)
- [ ] TimerControls.tsx (кнопка Start/Stop)
- [ ] TimerBar.tsx (хедер-контейнер)
- [ ] Подключить TimerBar в app/layout.tsx

## UI — Entries List (FEATURE_entries.md)

- [ ] Создать lib/stores/entries-store.ts (добавить поддержку фильтров: projectId, tagId, billable, q)
- [ ] EntriesFilterBar.tsx (поиск, выбор проекта/тега, billable, кнопка Clear)
- [ ] EntryItem.tsx (display + edit mode + отображение archived проекта)
- [ ] EntryDurationInput.tsx (inline hh:mm input)
- [ ] EntriesProjectGroup.tsx (группа по проекту)
- [ ] EntriesDayGroup.tsx (группа по дате)
- [ ] EntriesList.tsx (главный контейнер)
- [ ] Подключить на главную страницу

## UI — Dashboard (FEATURE_dashboard.md)

- [ ] WeeklyBarChart.tsx (Recharts stacked bar)
- [ ] TopProjectsList.tsx (с earnings если hourlyRate задан)
- [ ] WeeklySummary.tsx (тотал + billable + earnings summary)
- [ ] WeeklyTargetBar.tsx (прогресс к цель, localStorage, цвета: зелёный/жёлтый/синий)
- [ ] DashboardCompact.tsx (свёрнутый вид при скролле, IntersectionObserver)
- [ ] DashboardWidget.tsx (с навигацией по неделям)
- [ ] Подключить на главную страницу (над EntriesList)

## UI — Projects (FEATURE_projects.md)

- [ ] ColorPicker.tsx (swatches + HEX input)
- [ ] ProjectEstimateBar.tsx (прогресс-бар бюджета, цвета по порогам)
- [ ] ProjectForm.tsx (инлайн создание + поля estimate + hourlyRate)
- [ ] ProjectItem.tsx (display + edit + Archive/Unarchive + earnings + estimate bar)
- [ ] ProjectsList.tsx (тоггл "Показать архивные")
- [ ] Создать страницу /projects

## UI — Tags (FEATURE_tags.md)

- [ ] TagChip.tsx (цветной chip, переиспользуемый)
- [ ] TagForm.tsx
- [ ] TagItem.tsx (display + edit)
- [ ] TagsList.tsx
- [ ] Создать страницу /tags

## UI — Reports (FEATURE_reports.md)

- [ ] PeriodSelector.tsx (Today/Week/Month/Custom + DateRangePicker)
- [ ] ReportViewToggle.tsx (переключение By Projects | By Tags)
- [ ] ReportProjectRow.tsx (expandable + earnings column + archived badge)
- [ ] ReportTagRow.tsx (expandable, группа «No tag»)
- [ ] ReportTable.tsx (универсальная, принимает viewMode + показывает earnings колонку если есть данные)
- [ ] ExportButton.tsx (с loading state)
- [ ] ReportsPage.tsx
- [ ] Создать страницу /reports

## UI — Navigation

- [ ] Навигация в layout: главная / projects / tags / reports
- [ ] UserMenu.tsx — аватар/инициалы + имя + dropdown (имя, email, Sign out)

## UI — Auth Pages (Prompt 15)

- [ ] Создать app/(auth)/layout.tsx (центрированный, без TimerBar)
- [ ] Создать app/(auth)/login/page.tsx
- [ ] Создать app/(auth)/register/page.tsx
- [ ] Создать components/auth/LoginForm.tsx (Credentials + GitHub/Google OAuth buttons)
- [ ] Создать components/auth/RegisterForm.tsx (POST /api/auth/register + auto-login)
- [ ] Создать components/auth/OAuthButton.tsx (кнопка с иконкой провайдера)

## Тесты

- [ ] Тесты валидационных схем
- [ ] Тесты report-service (buildReport, entriesToCsv)
- [ ] Тесты time-format-service (formatDuration, parseDurationInput)
- [ ] `npx vitest run` — все тесты зелёные

## Системные страницы + Обработка ошибок (Промпт 16а)

- [ ] Создать app/not-found.tsx (центрированный 404 + кнопка Go to Dashboard)
- [ ] Создать app/error.tsx ("use client", reset() + кнопка Try again)
- [ ] Создать app/global-error.tsx ("use client", minimal HTML + Reload)
- [ ] Создать app/loading.tsx (центрированный <Spinner size="lg" />)
- [ ] Создать app/(main)/loading.tsx (skeleton: Dashboard placeholder + 3 строки entries)
- [ ] Создать app/projects/loading.tsx (skeleton: 4-5 строк проектов)
- [ ] Создать app/reports/loading.tsx (skeleton: selector + 5 строк таблицы)
- [ ] Создать app/(auth)/login/loading.tsx и register/loading.tsx (<Spinner size="md" />)

## Готовность к MVP

- [ ] Все требования из тестового задания реализованы
- [ ] `npm run build` — успешный build
- [ ] `npm run type-check` — без ошибок
- [ ] `npm run lint` — без ошибок
- [ ] Ручная проверка: start/stop таймера, редактирование записей, отчёт + CSV экспорт
- [ ] Ручная проверка: app/not-found.tsx отображается на несуществующем URL
- [ ] Ручная проверка: CSV с 0 записями содержит только заголовок
- [ ] Ручная проверка: истёкшая сессия (очистить cookie) редиректирует на /login
- [ ] Деплой на Vercel
- [ ] DATABASE_URL настроен в Vercel Environment Variables
