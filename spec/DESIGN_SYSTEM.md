# Time Tracker — Design System

> Создан: 2026-02-23 | Обновлён: 2026-02-23
> Статус: **Ready — Modern OKLCH + Tailwind v4 CSS-first**
> Применяется: ко всем компонентам без исключения

---

## Принцип и мотивация

Дизайн-система — единственный источник правды для UI. Это гарантирует:
- **Визуальную согласованность** без ручного согласования цветов
- **Предсказуемость для AI-агентов** — один способ сделать правило, не два
- **Maintainability** — изменение одного токена меняет всё приложение

**Стек 2025:**
- TailwindCSS v4 (CSS-first, `@theme {}`) — utility классы из CSS-переменных
- OKLCH цветовое пространство — перцептивно равномерное, P3 gamut  
- Geist шрифт (Vercel, open-source) — современный геометрический SaaS шрифт

**Единственная система стилизации — TailwindCSS v4. ЗАПРЕЩЕНО:**
- `style={{}}` inline-стили (кроме динамических цветов проектов: `style={{ backgroundColor: project.color }}`)
- CSS-модули (`.module.css`)
- styled-components / emotion / любой CSS-in-JS
- **Raw hex/rgb цвета в `className`** (только токены из `app/globals.css`)
- Tailwind дефолтные palette-классы: `slate-500`, `gray-300`, `indigo-600` и т.д. — ТОЛЬКО семантические токены
- Создание `<button>`, `<input>`, `<dialog>` вне `components/ui/`

**Агент ОБЯЗАН** использовать компоненты из `components/ui/` — не создавать дублирующие примитивы в фиче-компонентах.

---

## Источник истины для CSS-токенов

Все токены определены в **`app/globals.css`** в блоке `@theme {}`.
Tailwind v4 автоматически создаёт utility классы из `--color-*`, `--radius-*`, `--shadow-*`.

```
app/globals.css → @theme { --color-primary: oklch(...) }
                         ↓ автоматически
                  bg-primary | text-primary | border-primary
```

---

## Цветовые токены

Все токены определены в `app/globals.css`. Tailwind v4 создаёт utility-классы автоматически.

### Primary (Indigo — акцент 2025)

| CSS-переменная | Tailwind класс | Описание |
|---------------|----------------|----------|
| `--color-primary` | `bg-primary` / `text-primary` | CTA-кнопки, links, активные элементы |
| `--color-primary-hover` | `bg-primary-hover` | Hover на primary |
| `--color-primary-light` | `bg-primary-light` | Background tint, активный nav item |
| `--color-primary-fg` | `text-primary-fg` | Текст НА primary-кнопке |

### Timer (зелёный — активное состояние)

| CSS-переменная | Tailwind класс | Описание |
|---------------|----------------|----------|
| `--color-timer-active` | `text-timer-active` / `bg-timer-active` | Зелёная точка, border активного таймера |
| `--color-timer-pulse` | `bg-timer-pulse` | Pulse ring анимация |

### Surface / Background

| CSS-переменная | Tailwind класс | Описание |
|---------------|----------------|----------|
| `--color-bg` | `bg-bg` | Фон страницы |
| `--color-surface` | `bg-surface` | Карточки, panels, sidebar |
| `--color-surface-2` | `bg-surface-2` | Вложенные блоки, hover |
| `--color-surface-3` | `bg-surface-3` | Активные nav items |

### Border

| CSS-переменная | Tailwind класс | Описание |
|---------------|----------------|----------|
| `--color-border` | `border-border` | Основная граница |
| `--color-border-subtle` | `border-border-subtle` | Лёгкие разделители |
| `--color-border-strong` | `border-border-strong` | Акцентированные границы |

### Text

| CSS-переменная | Tailwind класс | Описание |
|---------------|----------------|----------|
| `--color-text-1` | `text-text-1` | Основной текст |
| `--color-text-2` | `text-text-2` | Вторичный, labels |
| `--color-text-3` | `text-text-3` | Muted, placeholder |
| `--color-text-disabled` | `text-text-disabled` | Отключённые элементы |

### Semantic

| Токен группа | BG-класс | Text-класс | Использование |
|-------------|----------|------------|---------------|
| success | `bg-success-bg` | `text-success` | Старт, сохранение, тост |
| warning | `bg-warning-bg` | `text-warning` | 80-100% бюджета |
| error | `bg-error-bg` | `text-error` | Ошибки, destructive |
| info | `bg-info-bg` | `text-info` | Информационный тост |

### Цвета проектов (8 токенов для ColorPicker)

```
--color-project-indigo  --color-project-blue    --color-project-teal
--color-project-green   --color-project-orange  --color-project-red
--color-project-pink    --color-project-amber
```

Нет проекта: `--color-no-project` → `bg-no-project`

> ⚠️ **Запрещено** прямо писать `bg-indigo-600`, `text-slate-400`, `border-gray-200` —
> только через `--color-*` токены из `globals.css`.

---

## Типографика

**Шрифт:** [Geist](https://vercel.com/font) от Vercel — подключается через `next/font/google` в `app/layout.tsx`.  
**`font-mono`** — обязателен для `TimerDisplay`.  
**Специальный класс `timer-display`** из `globals.css`: `font-mono + tabular-nums` — цифры не скачут.

| Семантика | Tailwind классы |
|-----------|----------------|
| Page title (h1) | `text-2xl font-semibold text-text-1 tracking-tight` |
| Section title (h2) | `text-lg font-medium text-text-1` |
| Card label | `text-sm font-medium text-text-2` |
| Body text | `text-sm text-text-1` |
| Muted text | `text-sm text-text-3` |
| Tiny / meta | `text-xs text-text-3` |
| **Timer display (большой)** | `timer-display text-4xl font-bold text-text-1` |
| Timer compact | `timer-display text-xl font-semibold text-text-1` |

> ⚠️ `timer-display` — НЕ Tailwind класс, а utility из `globals.css`.
> Применяется ко ВСЕМ элементам, отображающим время `HH:MM:SS`.

---

## Компоненты `components/ui/` — Контракт API

> 🔒 Создание `<button>`, `<input>`, `<dialog>` ВНЕ `components/ui/` ЗАПРЕЩЕНО.

### Button

```tsx
<Button
  variant="primary" | "secondary" | "danger" | "ghost" | "outline"
  size="sm" | "md" | "lg"
  loading={boolean}
  disabled={boolean}
>
```

| Variant | Классы (normal) | Hover |
|---------|----------------|-------|
| primary | `bg-primary text-primary-fg` | `hover:bg-primary-hover` |
| secondary | `bg-surface-2 text-text-1` | `hover:bg-surface-3` |
| danger | `bg-error text-primary-fg` | `hover:opacity-90` |
| ghost | `text-text-2` | `hover:bg-surface-2 hover:text-text-1` |
| outline | `border border-border text-text-1` | `hover:bg-surface-2` |

- `loading=true` → `<Spinner size="sm" />` внутри + `disabled`
- `disabled=true` → `opacity-50 cursor-not-allowed pointer-events-none`
- Активный press: `active:scale-95 transition-transform duration-[var(--duration-fast)]`
- Никогда не создавать `<button>` вне `Button.tsx` (кроме `OAuthButton`)

### Input

```tsx
<Input
  label={string}
  error={string | undefined}
  hint={string | undefined}
  placeholder={string}
  // + все HTML input props
/>
```

- Базовые: `bg-bg border-border rounded-md px-3 py-2 text-sm text-text-1`
- Placeholder: `placeholder:text-text-3`
- Focus: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`
- Error state: `border-error focus-visible:ring-error`
- Ошибка под полем: `text-error text-xs mt-1`

### Modal / Dialog

```tsx
<Modal
  open={boolean}
  onClose={() => void}
  title={string}
  description?: string
>
  {children}
</Modal>
```

- Backdrop: `bg-black/50 backdrop-blur-sm`
- Панель: `bg-surface rounded-xl shadow-modal animate-modal-in`
- Закрывается по Escape и клику на backdrop
- Блокирует scroll (`overflow-hidden` на `body`)
- Рендер через `createPortal` в `document.body`

### Toast

```tsx
const { toast } = useToast();
toast.success("Проект создан");
toast.error("Ошибка сохранения");
toast.info("Таймер остановлен");
toast.warning("Превышен бюджет");
```

- Auto-dismiss: 3 секунды
- Позиция: `fixed bottom-4 right-4 z-50`
- Максимум 3 одновременных
- `animate-toast-in` при появлении

| Тип | Когда использовать |
|-----|--------------------|
| SUCCESS | Создание/удаление/обновление ресурсов |
| ERROR | Сетевые ошибки, 400/409/500 ответы |
| INFO | Нейтральные события (автостоп) |
| WARNING | Превышение бюджета, приближение к лимиту |
| ❌ НЕ показывать | 404 (тихая), 401 (редирект /login) |

### Spinner

```tsx
<Spinner size="sm" | "md" | "lg" />
```

- `sm` (size-4) — внутри кнопок
- `md` (size-6) — inline загрузка блоков
- `lg` (size-8) — полностраничный загрузчик
- **ЗАПРЕЩЕНО** заменять текстом "Loading..." / "Загрузка..."

### Badge

```tsx
<Badge variant="default" | "success" | "warning" | "error" | "info">
  text
</Badge>
```

- Форма: `rounded-full px-2 py-0.5 text-xs font-medium`
- _Всегда_ `rounded-full` (pill shape)

### TagChip

```tsx
<TagChip
  name={string}
  color={string}  // hex #RRGGBB
  onRemove?: () => void
/>
```

- Цвет: `style={{ backgroundColor: color }}` — единственное исключение из запрета inline-стилей
- Shape: `rounded-full px-2 py-0.5 text-xs`

### Select

```tsx
<Select
  options={Array<{ value: string; label: string }>}
  value={string}
  onChange={(value: string) => void}
  placeholder={string}
  label?: string
  error?: string
/>
```

### ColorPicker

```tsx
<ColorPicker
  value={string}   // текущий hex
  onChange={(hex: string) => void}
/>
```

Показывает 8 цветов из `--color-project-*` палитры.

---

## Spacing и Layout

Базовый unit: **4px** (`--spacing: 0.25rem` — Tailwind v4 default).

| Контекст | Классы |
|----------|--------|
| Padding карточки | `p-4` (16px) или `p-6` (24px) |
| Отступ между секциями | `space-y-6` |
| Gap в flex/grid рядах | `gap-3` (12px) |
| Padding строки таблицы | `py-3 px-4` |
| Padding nav item | `px-3 py-2` |
| Скругление карточек | `rounded-lg` |
| Скругление кнопок | `rounded-md` |
| Скругление chips/badges | `rounded-full` |
| Тень карточки | `shadow-sm` |
| Border карточки | `border border-border` |

### Shadows (через токены)

| Токен | Tailwind класс | Применение |
|-------|----------------|-----------|
| `--shadow-sm` | `shadow-sm` | Карточки по умолчанию |
| `--shadow-md` | `shadow-md` | Hover, dropdown |
| `--shadow-lg` | `shadow-lg` | Popover, floating панели |
| `--shadow-modal` | `shadow-modal` | Модальные окна |

> ⚠️ Запрещено использовать `shadow-slate-*` или кастомные `shadow-[...]` без добавления токена в `globals.css`.

---

## Интерактивные состояния (ОБЯЗАТЕЛЬНЫ для всех элементов)

| Состояние | Классы |
|-----------|--------|
| Hover | `hover:bg-surface-2` (фоновые), `hover:text-text-1` (текстовые) |
| Focus keyboard | `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none` |
| Disabled | `disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none` |
| Loading | `disabled` + `<Spinner size="sm" />` внутри кнопки |
| Active press | `active:scale-95 transition-transform` |

> Transition по умолчанию для всех интерактивных элементов:
> `transition-[color,background-color,border-color,opacity,box-shadow] duration-[150ms] ease-[var(--ease-default)]`

---

## Анимации (готовые классы из globals.css)

| Класс | Применение |
|-------|-----------|
| `animate-timer-pulse` | Зелёная точка активного таймера (пульсирует) |
| `animate-entry-in` | Появление новой записи после остановки |
| `animate-modal-in` | Открытие модального окна |
| `animate-toast-in` | Появление toast уведомления |
| `animate-skeleton` | Skeleton loading placeholder |

---

## Responsive

Приложение ориентировано на desktop. Брейкпоинты: `sm:640px`, `md:768px`, `lg:1024px`.

| Элемент | Mobile (< 640px) |
|---------|-----------------|
| TimerBar | Скрыть ProjectSelect и TagSelect; показывать TaskInput + TimerDisplay + Start/Stop |
| Навигация | Bottom navigation или hamburger |
| EntriesList | Компактный вид, убрать второстепенные колонки |
| Chart | `ResponsiveContainer` Recharts, 200px / 300px desktop |
| Modal | `w-full rounded-t-xl` (bottom sheet) |

---

## Dark Mode

**MVP: не реализовывать активный переключатель.**  
Токены `.dark {}` определены в `globals.css` и готовы к подключению.  
Переключение: `darkMode: 'class'` уже поддержан — добавить класс `dark` на `<html>`.

---

## Иконки

Использовать **`lucide-react`** — согласован с shadcn/ui.

```tsx
import { Play, Square, Edit2, Trash2, Archive, ChevronDown, Clock, Tag, FolderOpen } from 'lucide-react';
```

| Размер | Prop | Контекст |
|--------|------|---------|
| sm | `size={16}` | Внутри кнопок, inline |
| md | `size={20}` | Стандарт для большинства |
| lg | `size={24}` | Page-level, пустые состояния |

---

## Empty States

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <IconName size={40} className="text-text-3 mb-4" />
  <h3 className="text-base font-medium text-text-1 mb-1">Нет записей</h3>
  <p className="text-sm text-text-3 mb-6">Запустите таймер чтобы начать отслеживать время</p>
  <Button variant="primary">Начать</Button>
</div>
```

---

## Skeleton Loading

```tsx
// Правильно — skeleton placeholder
<div className="animate-skeleton rounded-md h-4 w-3/4" />
<div className="animate-skeleton rounded-md h-4 w-1/2 mt-2" />

// ЗАПРЕЩЕНО: текст "Загрузка..." или "Loading..."
// ЗАПРЕЩЕНО: голый <Spinner /> для skeleton-заглушек больших блоков
```
