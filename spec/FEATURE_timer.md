# Feature: Active Timer

> Создан: 2026-02-22
> Статус: Ready
> Источник требований: AI Developer Test Task (обязательно) + inspired by Toggl

## Обзор

**Актор:** Пользователь приложения
**Цель:** Запустить отсчёт времени для текущей задачи; видеть активный таймер на всех страницах; остановить когда закончил
**MVP приоритет:** Must Have

## Пользовательские сценарии

### Happy Path — старт нового таймера

1. Пользователь открывает приложение
2. В хедере виден блок таймера с полем описания и кнопкой «Start»
3. Пользователь вводит описание (или оставляет пустым), выбирает проект, опционально теги и billable-флаг
4. Кликает «Start» (или нажимает Enter в поле описания)
5. Таймер запускается, кнопка меняется на «Stop», счётчик тикает (hh:mm:ss)
6. Навигируя по страницам, пользователь видит тикающий таймер в хедере

### Happy Path — остановка

1. Пользователь кликает «Stop»
2. Таймер останавливается, `stoppedAt` выставляется, `durationSeconds` вычисляется
3. Запись появляется в списке entries на главной странице
4. Хедер возвращается в idle-состояние (поля очищаются)

### Edge Case — параллельный старт

1. Пользователь уже имеет активную запись «Task A»
2. Начинает вводить новое описание в хедере и нажимает «Start»
3. «Task A» **автоматически останавливается** → создаётся новая запись «Task B»
4. Пользователь не видит ошибку; тихая автоостановка

### Edge Case — автодополнение

1. Пользователь начинает вводить описание в поле
2. Появляется dropdown с последними уникальными описаниями, соответствующими вводу
3. Пользователь выбирает из списка (стрелками или кликом) или продолжает вводить

## Бизнес-правила

- Одновременно максимум одна активная запись per user (по userId)
- При старте: если есть активная → сначала остановить её (setNull stoppedAt = now)
- `startedAt` = текущий UTC timestamp на сервере (не с клиента)
- Таймер тикает на клиенте через `setInterval(1000)` — только вычисление секунд; реальные данные из API
- Поле описания: trim, nullable — пустая строка хранится как `null`
- Автодополнение: последние 20 уникальных описаний из completed entries, совпадение без учёта регистра

## Edge Cases

- Пользователь нажимает «Start» без описания и проекта → валидно, создаётся запись с `description=null, projectId=null`
- Пользователь открывает два таба — таймер в обоих отображает актуальное состояние после rehydrate
- Сеть упала в момент старта → показать toast error, состояние кнопки вернуть
- Сеть упала в момент остановки → показать toast error, таймер продолжает тикать
- Таймер работает больше 24 часов: `TimerDisplay` отображает `25:23:45` (не переходит в дни); формат `hh:mm:ss` сохраняется
- `startedAt` передан клиентом в будущем: сервер игнорирует значение и заменяет текущим UTC `now()` (Zod: при валидации проверять `date <= now + 60s` иначе 400)
- Попытка добавить 11-й тег (tagIds > 10): TagSelect блокирует добавление новых опций и показывает tooltip «Maximum 10 tags»

## State Machine

```
idle → running → idle
         ↑
    (Continue с другой записи тоже переключает running → running через idle)
```

| Состояние | UI | Кнопка |
|-----------|----|----|
| idle | Поля пустые, счётчик 00:00:00 | «Start» (зелёная) |
| running | Поля с данными активной записи, тикающий счётчик | «Stop» (красная) |

## API

| Метод | Endpoint | Описание |
|-------|----------|---------|
| GET | /api/time-entries/active | Проверить есть ли активная запись (при загрузке приложения) |
| POST | /api/time-entries | Создать запись (startTimer): `{ description?, projectId?, tagIds?, billable?, startedAt? }` |
| POST | /api/time-entries/[id]/stop | Остановить таймер: `{}` → выставляет stoppedAt + durationSeconds |
| GET | /api/task-names | Получить список уникальных описаний для автодополнения: `?q=` |

### Request Schema (POST /api/time-entries)

```typescript
{
  description?: string | null;  // max 255, trim
  projectId?: string | null;    // UUID
  tagIds?: string[];            // UUID[], max 10
  billable?: boolean;           // default false
  startedAt?: string;           // ISO 8601, если не передан — now()
}
```

### Response Schema (TimeEntry)

```typescript
{
  id: string;
  description: string | null;
  project: { id: string; name: string; color: string } | null;
  tags: { id: string; name: string; color: string }[];
  billable: boolean;
  startedAt: string;  // ISO 8601
  stoppedAt: string | null;
  durationSeconds: number | null;
}
```

## Компоненты

```
components/timer/
  TimerBar.tsx          — хедер-компонент (layout), всегда виден
  TimerControls.tsx     — кнопка Start/Stop с состоянием
  TimerDisplay.tsx      — тикающий счётчик hh:mm:ss (Client, useEffect+setInterval)
  TaskAutocomplete.tsx  — поле ввода описания с dropdown
  ProjectSelect.tsx     — select проекта (переиспользуется в entries)
  TagSelect.tsx         — мульти-выбор тегов (chips)
  BillableToggle.tsx    — чекбокс/toggle billable
```

## Store (Zustand)

```typescript
// lib/stores/timer-store.ts
interface TimerStore {
  activeEntry: TimeEntryWithRelations | null;
  elapsedSeconds: number;  // вычисляется на клиенте
  isLoading: boolean;

  setActiveEntry: (entry: TimeEntryWithRelations | null) => void;
  startTimer: (data: StartTimerInput) => Promise<void>;
  stopTimer: () => Promise<void>;
  tick: () => void;  // вызывается из useEffect каждую секунду
}
```
