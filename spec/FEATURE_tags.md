# Feature: Tags Management

> Создан: 2026-02-22
> Статус: Ready
> Inspired by: Toggl (теги для классификации записей)

## Обзор

**Актор:** Пользователь
**Цель:** Создавать теги для классификации записей по типу работы (`meeting`, `dev`, `review` и т.д.), назначать их при создании/редактировании записей
**MVP приоритет:** Must Have

## Пользовательские сценарии

### Happy Path — управление тегами

1. Пользователь переходит на `/tags` (или раздел в Settings)
2. Видит список всех тегов: цветная метка, название, количество использований
3. Создаёт тег: название + цвет
4. Редактирует или удаляет существующий

### Happy Path — назначение тегов записи

1. В TimerBar: dropdown/popup мульти-выбора тегов (chips input)
2. В EntryItem edit mode: то же самое
3. Выбранные теги отображаются как цветные chips рядом с записью

## Бизнес-правила

- `name` уникально, 1–30 символов, trim, lowercase при сохранении
- `color` формат `#RRGGBB`, дефолт `#10b981`
- Максимум 10 тегов на одну запись
- При удалении тега — его связи с TimeEntry удаляются (Cascade), сами записи не затрагиваются
- Теги не обязательны: запись может не иметь тегов

## Edge Cases

- Попытка создать тег с существующим именем (case-insensitive) → 409
- Пустой список тегов → empty state
- В TagSelect: поиск по названию, создание нового тега прямо из dropdown («Create "new-tag"»)
- При удалении используемого тега → предупреждение «Used in X entries»

## API

| Метод  | Endpoint       | Описание                       |
| ------ | -------------- | ------------------------------ |
| GET    | /api/tags      | Список всех тегов + usageCount |
| POST   | /api/tags      | Создать тег                    |
| PUT    | /api/tags/[id] | Обновить тег                   |
| DELETE | /api/tags/[id] | Удалить тег                    |

### Request Schema (POST/PUT)

```typescript
{
  name: string; // 1..30, trim, lowercase
  color: string; // #RRGGBB
}
```

### Response Schema

```typescript
{
  id: string;
  name: string;
  color: string;
  createdAt: string;
  usageCount: number; // сколько TimeEntry используют этот тег
}
```

## Компоненты

```
components/tags/
  TagsList.tsx         — страница управления тегами
  TagItem.tsx          — строка тега (display + edit)
  TagForm.tsx          — форма создания
  TagSelect.tsx        — мульти-выбор с поиском (использ. в timer + entries)
  TagChip.tsx          — цветной chip для отображения тега (переиспользуемый UI)
```
