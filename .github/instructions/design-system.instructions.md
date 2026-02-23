---
name: Design System Constraints
description: >
  Строгие правила использования дизайн-системы для AI-агентов.
  Обязательны при работе с components/**/*.tsx, app/**/*.tsx и любыми CSS-файлами.
applyTo: "**/*.tsx,**/*.ts,**/*.css"
---

# Design System — Правила для AI-агентов

> **Приоритет: МАКСИМАЛЬНЫЙ.** Эти правила имеют приоритет над личными предпочтениями агента.
> Единственный источник истины: `app/globals.css` + `spec/DESIGN_SYSTEM.md`.

---

## ❌ ЗАПРЕЩЕНО — немедленно отклонять

### Цвета — запрещённые паттерны

```tsx
// ❌ Tailwind palette-классы напрямую
className="bg-indigo-600"           // → bg-primary
className="text-slate-400"          // → text-text-3
className="border-gray-200"         // → border-border
className="bg-white"                // → bg-bg или bg-surface
className="bg-red-500"              // → bg-error
className="text-green-500"          // → text-success
className="bg-slate-100"            // → bg-surface-2

// ❌ Inline hex/rgb цвета (кроме динамического color проектов)
className="text-[#4f46e5]"          // запрещено
style={{ color: '#4f46e5' }}        // запрещено (для статических цветов)
style={{ backgroundColor: '#fff' }} // запрещено

// ✅ Единственное исключение для inline-стиля:
style={{ backgroundColor: project.color }}   // динамический цвет проекта
style={{ backgroundColor: tag.color }}       // динамический цвет тега
```

### Компоненты — запрещённые паттерны

```tsx
// ❌ Голые HTML элементы вне components/ui/
<button className="bg-indigo-600 text-white px-4 py-2 rounded">   // запрещено
<input className="border rounded px-3 py-2" />                     // запрещено
<dialog>...</dialog>                                               // запрещено

// ❌ Текст вместо Spinner
{isLoading && <span>Loading...</span>}   // запрещено
{isLoading && <p>Загрузка...</p>}        // запрещено

// ❌ Дублирующие компоненты вне ui/
// components/projects/DeleteButton.tsx  // запрещено — использовать Button из ui
// components/timer/StopButton.tsx       // запрещено — использовать Button из ui
```

### Типографика — запрещённые паттерны

```tsx
// ❌ Старые слейт-токены
className="text-slate-900"    // → text-text-1
className="text-slate-400"    // → text-text-3
className="text-slate-700"    // → text-text-2

// ❌ Таймер без timer-display класса
<span className="font-mono">01:23:45</span>           // неполно
<span className="font-mono tabular-nums">01:23:45</span>  // неполно

// ✅ Правильно для времени
<span className="timer-display text-4xl font-bold">01:23:45</span>
```

---

## ✅ ОБЯЗАТЕЛЬНО — правильные паттерны

### Цвета

```tsx
// Основной акцент
className = "bg-primary text-primary-fg hover:bg-primary-hover";

// Фоны
className = "bg-bg"; // страница
className = "bg-surface"; // карточки
className = "bg-surface-2"; // hover, вложенные блоки
className = "bg-primary-light"; // лёгкий indigo tint

// Текст
className = "text-text-1"; // основной
className = "text-text-2"; // вторичный
className = "text-text-3"; // muted, placeholder

// Borders
className = "border-border";
className = "border-border-subtle";

// Semantic
className = "text-success bg-success-bg";
className = "text-error bg-error-bg";
className = "text-warning bg-warning-bg";
className = "text-info bg-info-bg";

// Таймер
className = "text-timer-active"; // зелёная точка
className = "bg-timer-pulse animate-timer-pulse"; // pulse ring
```

### Компоненты

```tsx
// ✅ Всегда импортировать из @/components/ui/
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { TagChip } from "@/components/ui/tag-chip";
import { Select } from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";

// ✅ Использование кнопок
<Button variant="primary" size="md">Сохранить</Button>
<Button variant="danger" size="sm">Удалить</Button>
<Button variant="ghost" loading={isPending}>
  {isPending ? <Spinner size="sm" /> : "Отмена"}
</Button>

// ✅ Loading состояния
{isLoading ? <Spinner size="md" /> : <DataComponent />}
<Button loading={isSubmitting}>Сохранить</Button>
```

### Spacing (4px base grid)

```tsx
// ✅ Правильно — используй стандартные Tailwind spacing единицы
className = "p-4"; // 16px padding карточки
className = "p-6"; // 24px padding большой карточки
className = "gap-3"; // 12px gap в flexbox/grid
className = "space-y-6"; // 24px вертикальный ритм между секциями
className = "px-3 py-2"; // nav items, compact elements
className = "py-3 px-4"; // строки таблицы

// ❌ Запрещены произвольные значения без крайней необходимости
className = "p-[13px]"; // избегать
className = "gap-[7px]"; // избегать
```

### Border Radius

```tsx
// ✅ Правильно — по контексту
className = "rounded-sm"; // 4px — badges, tags
className = "rounded-md"; // 8px — inputs, кнопки
className = "rounded-lg"; // 12px — карточки, panels
className = "rounded-xl"; // 16px — модальные окна
className = "rounded-full"; // pill — badges статуса, кнопка таймера
```

### Shadows

```tsx
// ✅ Через токены
className = "shadow-sm"; // карточки по умолчанию
className = "shadow-md"; // hover, dropdowns
className = "shadow-lg"; // popovers
className = "shadow-modal"; // модальные окна

// ❌ Запрещено
className = "shadow-slate-200"; // кастомный shadow color
className = "shadow-[0_4px_8px_rgba(0,0,0,0.1)]"; // за пределами токенов
```

### Интерактивность (ОБЯЗАТЕЛЬНО для каждого интерактивного элемента)

```tsx
// ✅ Минимальный набор для интерактивного элемента
className={cn(
  "bg-surface-2 text-text-1",           // нормальное состояние
  "hover:bg-surface-3",                  // hover
  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none", // keyboard focus
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none", // disabled
  "transition-colors duration-[150ms]",  // плавность
)}
```

---

## Типографика — быстрая справка

| Контекст              | Обязательные классы                                 |
| --------------------- | --------------------------------------------------- |
| Заголовок страницы h1 | `text-2xl font-semibold text-text-1 tracking-tight` |
| Заголовок секции h2   | `text-lg font-medium text-text-1`                   |
| Метка поля            | `text-sm font-medium text-text-2`                   |
| Обычный текст         | `text-sm text-text-1`                               |
| Дополнительный текст  | `text-sm text-text-3`                               |
| **Дисплей таймера**   | `timer-display text-4xl font-bold text-text-1`      |
| Компактный таймер     | `timer-display text-xl font-semibold text-text-1`   |

> `timer-display` — обязательный класс для ЛЮБОГО отображения времени `HH:MM:SS`.

---

## Анимации — готовые классы

```tsx
// ✅ Использовать из globals.css
className = "animate-timer-pulse"; // пульс зелёной точки
className = "animate-entry-in"; // появление новой записи
className = "animate-modal-in"; // открытие модала
className = "animate-toast-in"; // появление toast
className = "animate-skeleton"; // skeleton placeholder

// ❌ Запрещено создавать кастомные keyframes в компонентах —
//   добавлять в globals.css если нужна новая анимация
```

---

## Чеклист перед отправкой кода

Перед тем как завершить реализацию, агент обязан проверить:

- [ ] Нет `bg-indigo-*`, `bg-slate-*`, `bg-gray-*`, `text-slate-*` — только `text-text-*`, `bg-surface`, `bg-primary` и т.д.
- [ ] Нет `style={{ color }}` или `style={{ backgroundColor }}` для статических цветов
- [ ] Все `<button>` — через `<Button>` из `components/ui/`
- [ ] Все `<input>` — через `<Input>` из `components/ui/`
- [ ] Все `<dialog>` / `<div role="dialog">` — через `<Modal>` из `components/ui/`
- [ ] Нет текста "Loading..." / "Загрузка..." — только `<Spinner />`
- [ ] Время `HH:MM:SS` — всегда через `className="timer-display ..."`
- [ ] Каждый интерактивный элемент — `hover:` + `focus-visible:` + `disabled:` состояния
- [ ] Empty states — по шаблону из `spec/DESIGN_SYSTEM.md`
- [ ] Skeleton loading — `animate-skeleton`, не `<Spinner size="lg" />`

---

## Как добавить новый цвет / токен

1. Добавить `--color-new-token: oklch(...)` в блок `@theme {}` в `app/globals.css`
2. Добавить тёмный вариант в `.dark {}` блок `app/globals.css`
3. Задокументировать в `spec/DESIGN_SYSTEM.md`
4. Только тогда использовать в компоненте

**Запрещено** добавлять цвет напрямую в компонент минуя `globals.css`.

---

## Примеры правильной реализации компонентов

### EntryItem

```tsx
<div className="flex items-center gap-3 border-b border-border-subtle px-4 py-3 transition-colors duration-[150ms] hover:bg-surface-2">
  <div
    className="h-2.5 w-2.5 shrink-0 rounded-full"
    style={{ backgroundColor: entry.project?.color ?? "var(--color-no-project)" }}
  />
  <span className="text-truncate flex-1 text-sm text-text-1">{entry.taskName}</span>
  <span className="timer-display shrink-0 text-sm font-medium text-text-2">
    {formatDuration(entry.durationSeconds)}
  </span>
</div>
```

### Timer dot (активный)

```tsx
<div className="relative flex items-center">
  <div className="animate-timer-pulse absolute h-3 w-3 rounded-full bg-timer-pulse" />
  <div className="relative h-3 w-3 rounded-full bg-timer-active" />
</div>
```

### Card container

```tsx
<div className="card p-6">   // card — utility класс из globals.css
  {/* или вручную: */}
  <div className="bg-surface border border-border rounded-lg shadow-sm p-6">
```
