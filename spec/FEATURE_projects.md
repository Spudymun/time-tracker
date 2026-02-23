# Feature: Projects Management

> Создан: 2026-02-22
> Статус: Ready
> Источник требований: AI Developer Test Task (обязательно)

## Обзор

**Актор:** Пользователь
**Цель:** Создавать и управлять проектами/клиентами с цветовой маркировкой
**MVP приоритет:** Must Have

## Пользовательские сценарии

### Happy Path — просмотр проектов

1. Пользователь переходит на `/projects`
2. Видит список всех проектов с: цветной точкой, названием, суммарным временем за всё время, количеством записей
3. Проекты отсортированы по `createdAt DESC` (новые сверху)

### Happy Path — создание проекта

1. Кликает «New project»
2. Появляется inline-форма или компактный modal (решается при реализации)
3. Вводит название, выбирает цвет через ColorPicker
4. Кликает «Create» → проект появляется в списке
5. Если название занято → 409, показать error

### Happy Path — редактирование

1. Кликает иконку edit на проекте
2. Поля становятся редактируемыми инлайн
3. Меняет название/цвет, нажимает «Save»

### Happy Path — удаление

1. Кликает иконку delete
2. Подтверждение с предупреждением: «X time entries will become unassigned»
3. Подтверждает → проект удалён, записи получают `projectId = null`

### Happy Path — архивация

1. Пользователь кликает «Архивировать» на проекте (контекстное меню или кнопка)
2. `isArchived = true` юнит проект в список «Архивные»
3. Архивированный проект исчезает из выпадающего списка проектов в TimerBar и EntriesList
4. Фильтр «Показать архивные» на странице проектов показывает архивированные; разархивировать можно всегда

### Happy Path — бюджет времени (Estimates)

1. При создании или редактировании проекта пользователь вводит плановое количество часов (например: 40)
2. В списке проектов появляется прогресс-бар: «23h / 40h (57%)»
3. При достижении 80% бюджета » прогресс-бар становится жёлтым, при 100% — красным
4. Без есႂмейта прогресс-бар не отображается

### Happy Path — почасовая ставка (Hourly Rate)

1. При редактировании проекта пользователь вводит ставку (80 = $80/ч)
2. В списке проектов добавляется колонка «Доход»: billable часы × ставка
3. В сводном отчёте Reports появляется колонка «Арнировано» по проектам со ставкой

## Бизнес-правила

- `name` уникально, 1–50 символов, trim
- `color` формат `#RRGGBB`, дефолт `#6366f1`
- Нельзя создать проект с пустым именем
- При удалении проекта — TimeEntry.projectId → null (не удалять записи!)
- Статистика (totalSeconds) вычисляется из completed entries (stoppedAt != null)
- `estimatedHours` независимо от billable: отслеживает общее время (totalSeconds), не только billable
- `hourlyRate` используется только с billable-записями: `earnings = billableSeconds / 3600 * hourlyRate`
- Архивированные проекты не появляются в TimerBar и полях выбора проекта в EntryItem
- Архивированные проекты участвуют в отчётах (их записи по-прежнему видны)
- Название архивированного проекта остаётся уникальным в системе —— нельзя создать новый с таким же именем

## Edge Cases

- Попытка создать проект с уже существующим именем → 409, toast «Project name already exists»
- Пустой список проектов → empty state с призывом создать первый
- ColorPicker: если пользователь вводит HEX вручную — валидировать формат
- Удаление проекта у которого много записей → показать количество before delete
- `estimatedHours` = 0 → 400 (должно быть > 0 или null)
- `hourlyRate` < 0 → 400
- Архивирование проекта с активным таймером → таймер продолжает работать, но проект помечен архивным
- Список проектов по умолчанию не показывает архивные (toggle "Показать архивные")

## API

| Метод  | Endpoint           | Описание                            |
| ------ | ------------------ | ----------------------------------- |
| GET    | /api/projects      | Список всех проектов + totalSeconds |
| POST   | /api/projects      | Создать проект                      |
| PUT    | /api/projects/[id] | Обновить проект                     |
| DELETE | /api/projects/[id] | Удалить проект                      |

### Request Schema (POST/PUT)

```typescript
{
  name: string;              // 1..50, trim
  color: string;             // #RRGGBB
  estimatedHours?: number | null;  // > 0 если задано
  hourlyRate?: number | null;      // >= 0 если задано
  isArchived?: boolean;      // только в PUT; default false
}
```

### Response Schema

```typescript
{
  id: string;
  name: string;
  color: string;
  isArchived: boolean;
  estimatedHours: number | null;
  hourlyRate: number | null;
  createdAt: string;
  totalSeconds: number; // сумма durationSeconds завершённых записей
  billableSeconds: number; // только billable=true
  earnings: number | null; // billableSeconds / 3600 * hourlyRate, null если нет ставки
  estimateProgress: number | null; // totalSeconds / estimatedHours / 3600 (0..n), null если нет естимейта
  entryCount: number;
}
```

### Query Params (GET /api/projects)

```
?archived=false   — по умолчанию только активные
?archived=true    — только архивные
?archived=all     — все
```

## Компоненты

```
components/projects/
  ProjectsList.tsx         — список проектов + toggle "Показать архивные"
  ProjectItem.tsx          — строка проекта (display + edit mode) + кнопка Archive
  ProjectForm.tsx          — форма создания/редактирования (инлайн) + поля estimate + rate
  ColorPicker.tsx          — выбор цвета: preset swatches + HEX input
  ProjectEstimateBar.tsx   — прогресс-бар бюджета (зелёный/жёлтый/красный)
  ProjectDeleteConfirm.tsx — подтверждение удаления с предупреждением
```
