# Time Tracker — UI States

> Создан: 2026-02-23
> Статус: Ready
> Описывает: empty states, loading states, error states для всех фич

---

## Принцип

Каждый экран, список и модал должен корректно отображаться в трёх состояниях:

1. **Loading** — данные загружаются
2. **Empty** — данные загружены, но список пуст
3. **Error** — запрос завершился ошибкой

---

## Системные страницы Next.js

### `app/not-found.tsx`

Отображается при 404 (несуществующий маршрут).

```
Центрированный layout:
  [Иконка часов или 404]
  "Page not found"
  "The page you're looking for doesn't exist."
  [Кнопка "Go to Dashboard" → href="/"]
```

### `app/error.tsx`

Отображается при необработанной JS-ошибке в Server Component.

```
Центрированный layout:
  [Иконка ошибки]
  "Something went wrong"
  "An unexpected error occurred. Please try again."
  [Кнопка "Try again" → вызывает reset()]
  [Кнопка "Go to Dashboard" → href="/"]
```

Компонент ОБЯЗАН быть `"use client"` (требование Next.js для error boundaries).

### `app/global-error.tsx`

Обёртка для ошибок в root layout (включая layout.tsx).

```
Минимальный HTML: заголовок + кнопка "Reload"
```

---

## Loading States (Suspense / Skeleton)

### Глобальный `app/loading.tsx`

Показывается при загрузке root layout. Минимальный: полноэкранный `<Spinner size="lg" />` по центру.

### `app/(main)/loading.tsx`

Показывается при навигации на главную. Skeleton layout:

- Placeholder для DashboardWidget (высота ~280px, `animate-skeleton bg-surface-2 rounded-lg`)
- 3 placeholder-строки для EntriesList

### `app/projects/loading.tsx`

Skeleton: 4-5 строк проектов (цветная точка + текст-заглушка + progressbar-заглушка), `animate-skeleton`.

### `app/reports/loading.tsx`

Skeleton: selector периода + 5 строк таблицы, `animate-skeleton`.

### `app/(auth)/login/loading.tsx` и `register/loading.tsx`

Centered `<Spinner size="md" />`.

---

## Empty States

### EntriesList — нет записей за период

```
[Иконка Clock]
"No time entries yet"
"Start the timer or add an entry manually."
[Кнопка "Start timer" → фокус на поле TaskAutocomplete в TimerBar]
```

Если активны фильтры:

```
[Иконка поиска]
"No entries match your filters"
[Кнопка "Clear filters"]
```

### ProjectsList — нет проектов

```
[Иконка Folder]
"No projects yet"
"Create your first project to organize time entries."
[Кнопка "New project"]
```

### TagsList — нет тегов

```
[Иконка Tag]
"No tags yet"
"Create tags to categorize your time entries."
[Кнопка "New tag"]
```

### ReportTable — нет данных за период

```
[Иконка BarChart2]
"No data for this period"
"There are no completed time entries between {from} and {to}."
```

### DashboardWidget — нет записей за неделю

```
Внутри виджета (не заменяет весь виджет):
Bar chart показывает 7 пустых баров (высота 0)
Под чартом:
"No entries this week. Start tracking to see your stats."
TopProjectsList: скрыт / не отображается
WeeklySummary: "0h 0m total"
```

### TaskAutocomplete — нет совпадений при поиске

Dropdown не показывается. Пользователь продолжает вводить свободный текст.

---

## Error States

### Глобальная обработка 401 (истёкшая сессия)

Если любой `fetch()` в Zustand store возвращает `401`:

- Показать toast.error: `"Session expired. Please sign in again."`
- Сделать `window.location.href = '/login'` (не `router.push`, чтобы очистить state)

Реализуется через хелпер `lib/utils/api-client.ts`:

```typescript
async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options);
  if (res.status === 401) {
    // уведомить и редиректить
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  return res;
}
```

Все Zustand stores используют `apiFetch` вместо `fetch` напрямую.

### Ошибка загрузки в EntriesList

```
[Иконка AlertCircle]
"Failed to load entries"
[Кнопка "Retry"]
```

### Ошибка загрузки Dashboard

```
[Иконка AlertCircle]
"Failed to load dashboard data"
[Кнопка "Retry"]
```

### Ошибка загрузки Reports

```
[Иконка AlertCircle]
"Failed to load report"
[Кнопка "Try again"]
```

### Ошибка экспорта CSV

```
Toast: "Export failed. Please try again."
ExportButton возвращается в нормальное состояние
```

---

## Состояния кнопок и форм

| Состояние                          | Поведение                                                                        |
| ---------------------------------- | -------------------------------------------------------------------------------- |
| Form submitting                    | Кнопка Submit заменяет текст на `<Spinner size="sm" />`, disabled                |
| Form error (сервер)                | Toast с текстом ошибки, форма остаётся открытой                                  |
| Form error (валидация)             | Inline red text под полем, без toast                                             |
| Delete confirmation                | Inline inline "Are you sure? [Delete] [Cancel]" — без modal для простых удалений |
| Complex delete (с предупреждением) | Modal с деталями (пример: удаление проекта с записями)                           |

---

## Анимации и transitions

| Элемент                        | Transition                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| Dropdown открытие              | `transition-opacity duration-150`                                                          |
| EntryItem (удаление из списка) | `transition-all duration-200 opacity-0 scale-95`                                           |
| Toast появление                | slide-in снизу-справа                                                                      |
| Modal открытие                 | `transition-opacity duration-200` backdrop + `transition-transform duration-200 scale-100` |
| TimerDisplay тик               | Без анимации (просто счётчик)                                                              |
| DashboardCompact появление     | `transition-transform duration-300 translate-y-0`                                          |

---

## Aria / Accessibility

- Все иконки-кнопки (без текста): `aria-label="..."` обязателен
- Loading состояния: `aria-busy="true"` на контейнере
- Modal: `role="dialog"` + `aria-modal="true"` + `aria-labelledby` (title)
- Toast: `role="alert"` (для screen readers)
- Form fields: связаны с label через `htmlFor` / `id` или `aria-label`
- Delete confirm: `aria-describedby` ссылается на предупредительный текст
