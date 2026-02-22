# spec.md — Time Tracker

> Создан: 2026-02-22
> Источник: AI Developer Test Task (acw.solutions) + Toggl-inspired scope

---

## Идея

Веб-приложение для учёта рабочего времени для фрилансеров и небольших команд.
Позволяет трекать время по задачам и проектам, отмечать billable-часы, добавлять теги,
и строить отчёты за выбранный период с экспортом в CSV.

## Аудитория

**Основной пользователь:** Фрилансер или разработчик, который ведёт несколько проектов
одновременно и хочет понимать куда уходит время и сколько billable часов выставлять клиенту.

## Функциональные требования

### Обязательно (MVP)

1. Активный таймер — Start/Stop, поле описания задачи с автодополнением, выбор проекта
2. Таймер всегда виден в шапке страницы
3. Список записей за сегодня с группировкой по проекту и подсчётом итогового времени
4. Редактирование и удаление записей, ручная коррекция времени (hh:mm)
5. Продолжить запись — кнопка «Continue» на любой прошлой записи
6. Страница управления проектами (CRUD, цвет HEX)
7. Теги для записей (CRUD, цвет, мульти-тег на одну запись)
8. Billable флаг на каждой записи
9. Отчёты за период (день / неделя / месяц) с группировкой и экспортом CSV
10. Dashboard — недельный bar chart по часам + breakdown по проектам
11. Аутентификация — регистрация/вход (email+password, GitHub OAuth, Google OAuth)

### Следующая итерация (не входит в MVP)

1. Командное пространство (workspaces) / multi-user
2. Интеграции (Jira, Asana, GitHub Issues)
3. Мобильное приложение / PWA

## Архитектура

**Frontend:** Next.js 15 App Router, TypeScript strict, TailwindCSS v4, Zustand  
**Auth:** Auth.js v5 (`next-auth@beta`), JWT strategy, `@auth/prisma-adapter`  
**Passwords:** bcryptjs  
**Backend:** Next.js API Routes, Prisma v7 + @prisma/adapter-pg, Zod v4  
**Infrastructure:** PostgreSQL (Neon.tech), Vercel  
**Charts:** Recharts

## Data Model

| Сущность  | Ключевые поля                                                                               | Связи                                 |
| --------- | ------------------------------------------------------------------------------------------- | ------------------------------------- |
| User      | id, email (unique), name?, passwordHash?, image?                                            | has many Project, Tag, TimeEntry      |
| Account   | id, userId, provider, providerAccountId...                                                  | belongs to User (Auth.js OAuth links) |
| Project   | id, **userId**, name, color, estimatedHours?, hourlyRate?, isArchived                       | belongs to User, has many TimeEntry   |
| Tag       | id, **userId**, name (unique per user), color                                               | belongs to User, M2M with TimeEntry   |
| TimeEntry | id, **userId**, description?, projectId?, billable, startedAt, stoppedAt?, durationSeconds? | belongs to User+Project, has many Tag |

## API Endpoints

| Method         | Route                           | Описание                                       |
| -------------- | ------------------------------- | ---------------------------------------------- |
| POST           | /api/auth/register              | Регистрация: `{ name, email, password }` → 201 |
| \*             | /api/auth/[...nextauth]         | Auth.js handler (login, OAuth, signout)        |
| GET/POST       | /api/projects                   | Список / создать проект                        |
| GET/PUT/DELETE | /api/projects/[id]              | Один проект                                    |
| GET/POST       | /api/tags                       | Список / создать тег                           |
| PUT/DELETE     | /api/tags/[id]                  | Обновить / удалить тег                         |
| GET/POST       | /api/time-entries               | Список (с фильтрами) / создать                 |
| GET/PUT/DELETE | /api/time-entries/[id]          | Одна запись                                    |
| GET            | /api/time-entries/active        | Активная запись                                |
| POST           | /api/time-entries/[id]/stop     | Остановить таймер                              |
| POST           | /api/time-entries/[id]/continue | Продолжить запись                              |
| GET            | /api/reports                    | Отчёт за период                                |
| GET            | /api/reports/export             | CSV экспорт                                    |
| GET            | /api/task-names                 | Автодополнение описаний                        |
| GET            | /api/dashboard                  | Данные для дашборда                            |

## Бизнес-правила

1. Одновременно может быть только одна активная запись (stoppedAt = null)
2. При старте нового таймера — предыдущий активный автоматически останавливается
3. При удалении проекта — TimeEntry получают projectId = null (SetNull)
4. При удалении тега — связи TimeEntry↔Tag удаляются (Cascade)
5. durationSeconds вычисляется при остановке: stoppedAt - startedAt
6. Минимальная длительность записи — 1 секунда
7. Нельзя установить stoppedAt раньше startedAt
8. Все даты в UTC в БД, форматирование — на UI

## Error Handling

- Validation errors → 400 с Zod-деталями
- Not found → 404
- Conflict → 409
- Server error → 500, no internal details exposed

## Testing Plan

**Unit тесты:** Сервисы в `lib/services/`, схемы в `lib/validations/`
**Ручная проверка:** timer start/stop, continue entry, reports CSV export, auth flow (email + OAuth)
