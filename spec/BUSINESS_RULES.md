# Time Tracker — Business Rules

> Глобальные бизнес-правила и ограничения.
> Применяются ко ВСЕМУ приложению, независимо от фичи.

## Правила аутентификации

- Регистрация: email (unique) + name + password (min 8 симв, bcryptjs rounds=10)
- OAuth (ГитХаб/Google): при первом входе автоматически создаётся User
- OAuth email совпадает с Credentials email: возвращать OAuthAccountNotLinked error, советовать войти через email
- `passwordHash` никогда не возвращается в API responses
- JWT secret — `AUTH_SECRET` env var, min 32 символа

## Правила данных

### Идентификаторы

- Все ID — UUID v4 (`@default(uuid())`)
- Никогда не использовать sequential integers как публичные ID
- ID генерируются на уровне БД, не на уровне приложения

### Даты и время

- Все даты хранятся в UTC в БД
- Форматирование (локальный timezone, human-readable) — исключительно на уровне UI
- `createdAt` и `updatedAt` — автоматически, не принимаются от клиента
- `startedAt` по умолчанию = текущий UTC момент, если не передан

### Удаление

- Все удаления — жёсткие (hard delete), без `deletedAt`
- При удалении `Project` → все `TimeEntry.projectId` становятся `null` (SetNull)
- При удалении `Tag` → все `TimeEntryTag` удаляются (Cascade)
- При удалении `TimeEntry` → его `TimeEntryTag` удаляются (Cascade)
- Нельзя удалить активную `TimeEntry` — сначала нужно остановить (400 error)

## Правила проектов

### Архивация

- **Правило:** Архивированный проект (`isArchived=true`) не отображается в списках выбора (TimerBar, EntryItem edit mode)
- **При этом:** Его записи остаются в отчётах и списке entries
- **В списке проектов:** Архивные скрыты по умолчанию, toggle «Показать архивные» в UI
- **Имя остаётся уникальным per-user:** Нельзя создать проект с именем как у архивного (у того же пользователя)
- **Разархивировать:** PUT `/api/projects/[id]` с `{ isArchived: false }`
- **Архивация с активным таймером:** Таймер продолжает работать; при следующем запросе к `/api/time-entries/active` проект будет отмечен `isArchived:true` — UI показывает метку (archived) рядом с именем

### Estimates (бюджет времени)

- **Правило:** `estimatedHours` отслеживает **общее** время (totalSeconds), не только billable
- **Прогресс:** `estimateProgress = totalSeconds / (estimatedHours * 3600)`
- **Пороги:** 0..0.79 = зелёный; 0.80..0.99 = жёлтый (предупреждение); >= 1.0 = красный (перерасход)
- **Опциональность:** Без `estimatedHours` прогресс-бар не отображается; проект работает в штатном режиме

### Hourly Rate и Earnings

- **Правило:** `hourlyRate` применяется только к billable-записям: `earnings = billableSeconds / 3600 * hourlyRate`
- **Округление:** Earnings округляются до 2 знаков после запятой
- **Валюта:** В MVP нет поддержки валют — просто числовое значение («условные единицы»)
- **Единица расчёта:** hourlyRate задаётся в Project; можно изменить — это влияет на все расчёты earnings в отчётах с текущего момента; исторические данные не пересчитываются (нет `TimeEntry.hourlyRate`)

## Правила таймера

### Одна активная запись

- **Правило:** У каждого пользователя может существовать только одна `TimeEntry` с `stoppedAt = null` (по userId)
- **Применяется к:** `/api/time-entries` POST, `/api/time-entries/[id]/continue`
- **Проверяется в:** репозиторий `time-entries-repository` + API route (фильтр по userId)
- **Edge cases:**
  - При старте нового таймера, если есть активный → автоматически остановить предыдущий (set stoppedAt = now)
  - Не показывать ошибку пользователю, просто остановить и запустить

### Продолжение записи

- **Правило:** `Continue` создаёт НОВУЮ запись с теми же `description`, `projectId`, тегами и `billable`
- Оригинальная запись НЕ изменяется
- Если есть активная запись → остановить перед созданием новой

### Длительность

- `durationSeconds` = `Math.round((stoppedAt - startedAt) / 1000)`, минимум 1
- Для активной записи `durationSeconds = null` в БД; фронтенд вычисляет на лету

### Ручная коррекция времени

- Пользователь может ввести время в формате `hh:mm` (часы:минуты)
- Допустимый диапазон: 00:01 – 99:59
- При сохранении: `stoppedAt = startedAt + введённые_секунды`; `startedAt` не меняется

## Правила API

### Аутентификация

- Все API-маршруты требуют валидной JWT-сессии (Auth.js v5)
- Отсутствие сессии → `401 Unauthorized` (не redirect, чтобы не ломать fetch-запросы из Zustand)
- `userId` всегда берётся из `session.user.id`, **никогда** из тела запроса
- Доступ к чужому ресурсу → `404` (не `403`) — не раскрывать наличие чужих записей

### Валидация

- Все POST/PUT routes валидируют тело через Zod до обращения к БД
- Невалидные данные → 400 с `{ error: string, details?: ZodIssue[] }`
- `id` в URL — приоритет; `id` в body игнорируется
- Пустые строки нормализуются в `null` для nullable полей

### HTTP коды

| Ситуация                               | Код |
| -------------------------------------- | --- |
| Успешное создание                      | 201 |
| Успешное получение / обновление        | 200 |
| Успешное удаление                      | 204 |
| Невалидные данные                      | 400 |
| Ресурс не найден                       | 404 |
| Конфликт (например, дублирование name) | 409 |
| Серверная ошибка                       | 500 |

### Список entries

- GET `/api/time-entries` принимает query params: `from` (ISO date), `to` (ISO date), `projectId`, `tagId`, `billable`, `q` (substring search)
- `projectId=none` возвращает записи без проекта
- `q` — case-insensitive поиск substring по полю `description`; игнорируется если пустой
- Максимум 200 записей за один запрос; по умолчанию последние 7 дней
- Сортировка: `startedAt DESC`

### Отчёты

- GET `/api/reports` принимает `from`, `to` (обязательные ISO dates)
- Если `from` или `to` отсутствуют → `400` с `{ error: "from and to query params are required" }`
- Если `from > to` → `400` с `{ error: "from must be before or equal to to" }`
- Максимальный период: 366 дней; если превышен → `400` с `{ error: "Period exceeds maximum of 366 days" }`
- Дата `to` может быть в будущем — API возвращает данные до текущего момента
- Возвращает агрегацию по проектам (`byProject`) И по тегам (`byTag`) в одном ответе
- `byProject`: `{ projectId, projectName, color, isArchived, totalSeconds, billableSeconds, earnings, entryCount, percentage }`
- `byTag`: `{ tagId, tagName, color, totalSeconds, billableSeconds, entryCount, percentage }`
- `earnings = billableSeconds / 3600 * hourlyRate` (null если нет ставки)
- GET `/api/reports/export` возвращает CSV с `Content-Disposition: attachment`
- CSV при 0 записях: возвращает только строку-заголовок (не пустой файл)

## Правила цветов

- `color` для Project и Tag — строка в формате `#RRGGBB` (7 символов, hex)
- Дефолтные значения: Project → `#6366f1`, Tag → `#10b981`
- Валидация regex: `/^#[0-9A-Fa-f]{6}$/`

## Правила Toast-уведомлений

Все компоненты используют единый `useToast()` хук из `components/ui/Toast.tsx`.

| Тип               | Когда показывать                                  | Примеры                                             |
| ----------------- | ------------------------------------------------- | --------------------------------------------------- |
| `toast.success()` | После успешного CUD-действия                      | «Project created», «Entry deleted», «Timer stopped» |
| `toast.error()`   | Сетевая/серверная ошибка (4xx кроме 401/404, 5xx) | «Failed to save», «Project name already exists»     |
| `toast.info()`    | Нейтральные системные события                     | «Previous timer stopped automatically»              |

**НЕ показывать toast:**

- При 404 (тихая обработка — empty state или не найдено)
- При 401 (перенаправление на `/login`, см. `UI_STATES.md`)
- При валидационных ошибках формы (inline-сообщение рядом с полем)

**Auto-dismiss:** 3 секунды для success/info, 5 секунд для error.  
**Максимум:** 3 одновременных toast (старые вытесняются новыми).

## Правила безопасности

- Никогда не раскрывать stack traces в API responses клиенту
- Секреты только через переменные окружения (`.env.local`)
- `.env.local` — в `.gitignore`; только `.env.example` с placeholders в репозитории
- Prisma защищает от SQL инъекций; никаких `$queryRaw` без параметризации
- Все входящие данные — через Zod, до любой бизнес-логики
