# Feature: Time Entries List

> Создан: 2026-02-22
> Статус: Ready
> Источник требований: AI Developer Test Task (обязательно) + Continue button inspired by Toggl

## Обзор

**Актор:** Пользователь
**Цель:** Видеть историю записей, редактировать их, удалять, продолжать прошлые записи
**MVP приоритет:** Must Have

## Пользовательские сценарии

### Happy Path — просмотр списка

1. Главная страница (`/`) показывает список записей сгруппированных по дате
2. Для каждой даты — подгруппировка по проекту с суммарным временем на проект
3. Каждая запись: цвет проекта, описание, теги (chips), billable-иконка, длительность

### Happy Path — редактирование

1. Пользователь кликает на запись (или иконку edit)
2. Инлайн-форма открывается прямо в строке записи (не модал)
3. Можно изменить: описание, проект, теги, billable, время (hh:mm формат)
4. Enter или кнопка «Save» → PUT запрос → запись обновляется без перезагрузки страницы

### Happy Path — ручная коррекция времени

1. Пользователь кликает на время записи (например «1:23»)
2. Появляется inline-инпут с форматом `hh:mm`
3. Пользователь вводит новое значение, нажимает Enter
4. `stoppedAt = startedAt + введённые_секунды`; startedAt не меняется
5. Запись обновляется

### Happy Path — удаление

1. Пользователь наводит на запись → появляется иконка «Удалить»
2. Кликает → появляется короткое подтверждение (inline, не модал)
3. Подтверждает → запись удаляется анимированно из списка

### Happy Path — Continue

1. Пользователь видит прошлую запись «Task A → Project X, теги: dev»
2. Нажимает «Continue» (иконка ▶ появляется при hover)
3. Создаётся новая активная запись с теми же параметрами
4. Если была активная → остановить её первой
5. Хедер обновляется: таймер тикает с новой записью

### Happy Path — фильтрация записей

1. Над списком записей есть фильтр-бар: поле поиска, выбор проекта, выбор тега, billable-тоггл
2. Пользователь выбирает проект «Acme Corp» → список мгновенно обновляется
3. Вводит текст в поиск — фильтрация по `description` (case-insensitive substring)
4. Фильтры комбинируются (AND): клиент AND тег AND billable
5. Сброс фильтров кнопкой «Clear»

## Бизнес-правила

- Список загружает записи за последние 7 дней по умолчанию (lazy load / scroll)
- Записи сгруппированы по дате (calendar date в local timezone) — TODAY, YESTERDAY, дата
- Внутри каждой даты — группировка по `projectId` (no project отдельная группа)
- Для каждой группы проекта в пределах дня: сумма `durationSeconds`
- Нельзя редактировать активную запись через entries list — только через TimerBar
- При редактировании `durationSeconds` < 1 секунды → 400 error
- Фильтрация по `projectId`, `tagId`, `billable`, `q` (текст) — все параметры опциональны и комбинируются AND
- `q` — поиск substring (без учёта регистра) по полю `description`; мин 1 символ
- Архивированные проекты: в списке отображаются с пометкой (archived) вместо цветного индикатора

## Edge Cases

- Активная запись отображается первой (вверху TODAY) с анимированным индикатором
- Запись без проекта → группа «No project» с серым цветом
- Описание пустое → отображается «(no description)» серым курсивом
- Несколько тегов: показывать первые 3 chips, остальные сворачиваются в «+N more» (например «+2 more»); по клику на «+N more» все чипсы разворачиваются
- При ручной коррекции времени: ввод `00:00` → 400 валидация (`durationMinutes` обязано быть ≥ 1); inline-сообщение ошибки «Minimum 1 minute»
- При удалении последней записи за день — дата-группа исчезает

## Пагинация / ленивая загрузка

- По умолчанию: записи за последние 7 дней (Entries API `from=today-7d&to=today`)
- Если записей больше 200 (макс API) — внизу списка появляется кнопка «Показать больше» (увеличивает период ещё на 7 дней)
- Кнопка «Показать больше»: видна всегда — даёт возможность просмотреть старые записи
- Инфинитный скролл не используется — только явная кнопка

## API

| Метод  | Endpoint                                                   | Описание                                |
| ------ | ---------------------------------------------------------- | --------------------------------------- |
| GET    | /api/time-entries?from=&to=&projectId=&tagId=&billable=&q= | Список записей с фильтрами              |
| PUT    | /api/time-entries/[id]                                     | Обновить запись                         |
| DELETE | /api/time-entries/[id]                                     | Удалить запись                          |
| POST   | /api/time-entries/[id]/continue                            | Создать копию записи как новую активную |

### Query Params (GET /api/time-entries)

```
?from=         — ISO date (умолчание: today - 7d)
?to=           — ISO date (умолчание: today)
?projectId=    — UUID, фильтр по проекту; значение 'none' = записи без проекта
?tagId=        — UUID, фильтр по тегу (есть хотя бы один тег с записи)
?billable=     — true | false
?q=            — текстовый поиск по description (substring, case-insensitive)
```

### Request Schema (PUT /api/time-entries/[id])

```typescript
{
  description?: string | null;
  projectId?: string | null;
  tagIds?: string[];
  billable?: boolean;
  durationMinutes?: number;  // для ручной коррекции (1..5999)
  startedAt?: string;        // ISO 8601 для полного ручного ввода
  stoppedAt?: string;        // ISO 8601 для полного ручного ввода
}
```

## Компоненты

```
components/entries/
  EntriesList.tsx           — контейнер, загружает и передаёт данные
  EntriesFilterBar.tsx      — панель фильтрации: search, project, tag, billable
  EntriesDayGroup.tsx       — группа по дате (заголовок + итог дня)
  EntriesProjectGroup.tsx   — группа по проекту внутри дня (заголовок + итог)
  EntryItem.tsx             — строка записи: display mode + edit mode
  EntryDurationInput.tsx    — inline input hh:mm
  EntryDeleteConfirm.tsx    — inline подтверждение удаления
```

## Store (Zustand)

```typescript
// lib/stores/entries-store.ts
interface EntriesStore {
  entries: TimeEntryWithRelations[];
  isLoading: boolean;
  fetchEntries: (from: Date, to: Date) => Promise<void>;
  updateEntry: (id: string, data: UpdateEntryInput) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  continueEntry: (id: string) => Promise<void>;
  addEntry: (entry: TimeEntryWithRelations) => void; // после старта таймера
  replaceActiveEntry: (entry: TimeEntryWithRelations | null) => void;
}
```
