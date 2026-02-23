# Feature: Reports & CSV Export

> Создан: 2026-02-22
> Статус: Ready
> Источник требований: AI Developer Test Task (обязательно)

## Обзор

**Актор:** Пользователь
**Цель:** Просматривать сводные отчёты по времени за выбранный период и экспортировать их в CSV
**MVP приоритет:** Must Have

## Пользовательские сценарии

### Happy Path — просмотр отчёта

1. Пользователь переходит на `/reports`
2. Видит selector периода: «Today», «This week», «This month», «Custom range»
3. Выбирает «This week» → таблица обновляется
4. Таблица показывает строки по проектам:
   - Проект (название + цвет)
   - Billable часы / Not-billable часы
   - Всего (hh:mm:ss)
   - % от общего времени
5. Внизу: строка «Total» с суммой
6. По клику на проект — раскрывается детальный список записей

### Happy Path — Custom Range

1. Пользователь выбирает «Custom range»
2. Появляется date range picker: from + to (calendar)
3. Выбирает диапазон → отчёт обновляется

### Happy Path — разбивка по тегам

1. Пользователь переключает вкладку «By Tags» (рядом с «By Projects»)
2. Таблица показывает строки по тегам:
   - Тег (цвет + название)
   - Billable часы / Not-billable часы
   - Всего (hh:mm:ss)
   - % от общего времени
3. Записи без тегов попадают в группу «No tag»

### Happy Path — заработок по проектам

1. Если у проекта есть `hourlyRate`, в таблице появляется дополнительный столбец «Заработано»
2. В строке проекта: `billableSeconds / 3600 * hourlyRate`
3. В строке «Total»: сумма по всем проектам со ставкой

### Happy Path — CSV Export

1. Кликает «Export CSV»
2. Браузер скачивает файл `time-report-YYYY-MM-DD_YYYY-MM-DD.csv`
3. Файл содержит детальные строки (не агрегацию)

### CSV формат

```csv
Date,Start,Stop,Duration (h),Project,Description,Tags,Billable
2026-02-20,09:00,10:30,1.5,Acme Corp,Fix login bug,"dev,bug",Yes
2026-02-20,11:00,12:00,1.0,,Team meeting,"meeting",No
```

## Бизнес-правила

- Отчёт включает только completed entries (stoppedAt != null)
- «Today» = текущий UTC-день; «This week» = Пн–Вс текущей недели
- Агрегация по `projectId`: null проекты группируются как «No project»
- `billableSeconds` отдельно от `totalSeconds`
- CSV export GET `/api/reports/export?from=&to=` → Content-Disposition: attachment; filename=...
- CSV строки: одна строка = одна TimeEntry (детально, не агрегировано)

## Edge Cases

- Пустой период (нет записей) → пустая таблица с «No data for this period»
- Очень большой период (много записей) → CSV может быть большим, но это нормально (200 limit снят для export)
- Активная запись не включается в отчёт (only completed)
- Tags в CSV: через запятую в кавычках
- `from > to` → API возвращает `400` (см. `BUSINESS_RULES.md`)
- CSV с 0 записями: возвращается только заголовок `Date,Start,Stop,Duration (h),Project,Description,Tags,Billable` без строк данных
- `to` в будущем: API возвращает данные до текущего момента (completed записи не могут быть в будущем)
- Custom date picker: `to` не может быть раньше `from` — клиент запрещает выбор даты (`to` = мин. `from`)

## API

| Метод | Endpoint                      | Описание             |
| ----- | ----------------------------- | -------------------- |
| GET   | /api/reports?from=&to=        | Агрегированный отчёт |
| GET   | /api/reports/export?from=&to= | CSV файл             |

### Response Schema (GET /api/reports)

```typescript
{
  from: string; // ISO date
  to: string;
  totalSeconds: number;
  billableSeconds: number;
  totalEarnings: number | null; // сумма по всем проектам со ставкой
  byProject: Array<{
    projectId: string | null;
    projectName: string | null;
    color: string | null;
    isArchived: boolean;
    totalSeconds: number;
    billableSeconds: number;
    entryCount: number;
    percentage: number; // от общего totalSeconds
    earnings: number | null; // billableSeconds / 3600 * hourlyRate
  }>;
  byTag: Array<{
    tagId: string | null;
    tagName: string | null;
    color: string | null;
    totalSeconds: number;
    billableSeconds: number;
    entryCount: number;
    percentage: number;
  }>;
}
```

## Компоненты

```
components/reports/
  ReportsPage.tsx           — страница
  PeriodSelector.tsx        — Today/Week/Month/Custom кнопки + DateRangePicker
  ReportViewToggle.tsx      — переключение By Projects | By Tags
  ReportTable.tsx           — универсальная таблица (projects или tags)
  ReportProjectRow.tsx      — строка проекта (expandable) + earnings
  ReportTagRow.tsx          — строка тега (expandable)
  ReportEntriesDetail.tsx   — детальные записи при раскрытии
  ExportButton.tsx          — кнопка с loading state
```

## Service

```typescript
// lib/services/report-service.ts
export function buildReportFromEntries(entries: TimeEntry[]): ReportData;
export function buildTagReportFromEntries(entries: TimeEntryWithRelations[]): TagReportData;
export function entriesToCsv(entries: TimeEntryWithRelations[]): string;
export function calcEarnings(billableSeconds: number, hourlyRate: number | null): number | null;
```
