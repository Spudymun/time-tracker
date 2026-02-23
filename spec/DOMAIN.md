# Time Tracker — Domain Model

> Источник правды для всех сущностей проекта.
> Перед реализацией любой фичи — сверяйся с этим документом.

## Глоссарий

| Термин          | Определение                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------- |
| User            | Зарегистрированный пользователь. Все данные изолированы по userId                                 |
| TimeEntry       | Запись об отрезке рабочего времени. Активная = stoppedAt нулл, завершённая = есть stoppedAt       |
| ActiveEntry     | Единственная запись с stoppedAt = null. Одна **на пользователя**                                  |
| Project         | Проект / клиент, к которому привязываются TimeEntry                                               |
| Tag             | Метка для классификации (например: "meeting", "dev", "design")                                    |
| Billable        | Флаг на TimeEntry: время выставляется клиенту                                                     |
| Duration        | Длительность в секундах, вычисляется при остановке                                                |
| Estimate        | Плановые часы на проект (Project.estimatedHours). Используется для отслеживания выхода за бюджет  |
| HourlyRate      | Почасовая ставка проекта. Позволяет вычислить заработок: billableSeconds / 3600 \* hourlyRate     |
| ArchivedProject | Проект с isArchived=true. Не отображается в выпадающих списках, но его записи участвуют в отчётах |

## Сущности

### User

**Описание:** Зарегистрированный пользователь приложения. Все данные (`Project`, `Tag`, `TimeEntry`) изолированы по `userId`.

**Поля:**
| Поле | Тип | Обязательное | Описание |
|------|-----|-------------|-------|
| id | string (UUID) | да | Генерируется Auth.js / Prisma |
| name | string | нет | Отображаемое имя, 1–50 симв. |
| email | string | нет | Уникальный email (nullable для OAuth без email) |
| emailVerified | DateTime | нет | Дата верификации email (Auth.js поле) |
| image | string | нет | Аватар URL (из OAuth provider) |
| passwordHash | string | нет | bcrypt hash пароля. null для OAuth-only пользователей |
| createdAt | DateTime (UTC) | да | Автоматически |
| updatedAt | DateTime (UTC) | да | Автоматически |

**Constraints:**

- `email` уникально по всей системе
- `passwordHash` **никогда** не возвращается в API responses

---

### Account (Auth.js системная таблица)

**Описание:** Хранит OAuth-аккаунты пользователя (Google, GitHub). Управляется Auth.js + Prisma adapter.

> Не изменять вручную. Структура определяется `@auth/prisma-adapter`.

---

### VerificationToken (Auth.js системная таблица)

**Описание:** Токены для верификации email. Управляется Auth.js.

> Не изменять вручную.

---

### Project

**Описание:** Проект или клиент, к которому привязываются записи времени.

**Поля:**
| Поле | Тип | Обязательное | Описание |
|------|-----|-------------|-------|
| id | string (UUID) | да | Уникальный ID |
| userId | string (UUID, FK) | да | Владелец проекта |
| name | string | да | Название, уникальное **per-user**, 1–50 симв. |
| color | string (#RRGGBB) | да | HEX-цвет для визуального выделения, default `#6366f1` |
| estimatedHours | float | нет | Плановое количество часов на проект (бюджет времени), null = без лимита |
| hourlyRate | float | нет | Почасовая ставка в условных единицах (USD/EUR/etc.), null = не задана |
| isArchived | boolean | да | default `false`. Архивированный проект не показывается в выборе, но виден в отчётах |
| createdAt | DateTime (UTC) | да | Автоматически |
| updatedAt | DateTime (UTC) | да | Автоматически |

**Constraints:**

- `name` уникально **per-user** (Prisma: `@@unique([userId, name])`), включая архивированные
- `color` регекс: `^#[0-9A-Fa-f]{6}$`
- `estimatedHours` > 0 если задано
- `hourlyRate` >= 0 если задано

---

### Tag

**Описание:** Метка для классификации записей времени.

**Поля:**
| Поле | Тип | Обязательное | Описание |
|------|-----|-------------|-------|
| id | string (UUID) | да | |
| userId | string (UUID, FK) | да | Владелец тега |
| name | string | да | Уникальное **per-user**, 1–30 симв. |
| color | string (#RRGGBB) | да | default `#10b981` |
| createdAt | DateTime (UTC) | да | Автоматически |

**Constraints:**

- `name` уникально per-user (Prisma: `@@unique([userId, name])`), lowercase-трим, макс 30 симв.

---

### TimeEntry

**Описание:** Запись о рабочем отрезке времени. Два состояния: active (stoppedAt = null) и completed.

**Поля:**
| Поле | Тип | Обязательное | Описание |
|------|-----|-------------|-------|
| id | string (UUID) | да | |
| userId | string (UUID, FK) | да | Владелец записи |
| description | string | нет | Описание задачи, макс 255 симв. |
| projectId | string (UUID, FK) | нет | Нуллабельная ссылка на Project (того же userId) |
| billable | boolean | да | default `false` |
| startedAt | DateTime (UTC) | да | Момент старта |
| stoppedAt | DateTime (UTC) | нет | null = активная запись |
| durationSeconds | integer | нет | null для активных, вычисляется при остановке |
| createdAt | DateTime (UTC) | да | Автоматически |
| updatedAt | DateTime (UTC) | да | Автоматически |

**Constraints:**

- `stoppedAt` > `startedAt` (никогда раньше)
- Одновременно может быть лишь **одна активная запись per User**
- `description` nullable, но не пустая строка (trim и null)
- `projectId` должен принадлежать тому же `userId` (проверяется в API route)

**State Machine:**

```
active (stoppedAt=null) → completed (stoppedAt≠null)
                            ↓
Невозможно вернуть в active (только Continue = новая запись)
```

---

### TimeEntryTag (junction table)

**Описание:** M2M связь между TimeEntry и Tag.

**Поля:**
| Поле | Тип | Обязательное |
|------|-----|-------------|
| timeEntryId | string (UUID, FK) | да |
| tagId | string (UUID, FK) | да |

PK = (timeEntryId, tagId)

---

## Связи между сущностями

```
User ──< Project        (one-to-many: User has many Project)
User ──< Tag            (one-to-many: User has many Tag)
User ──< TimeEntry      (one-to-many: User has many TimeEntry)
Project ──< TimeEntry   (one-to-many: Project has many TimeEntry, nullable)
TimeEntry >──< Tag      (many-to-many через TimeEntryTag)
```

**Правила удаления (onDelete):**
| Родитель | Дочерний | Поведение |
|----------|----------|----------|
| User удалён | Project | Cascade |
| User удалён | Tag | Cascade |
| User удалён | TimeEntry | Cascade |
| Project удалён | TimeEntry.projectId | SetNull |
| Tag удалён | TimeEntryTag | Cascade |
| TimeEntry удалён | TimeEntryTag | Cascade |
