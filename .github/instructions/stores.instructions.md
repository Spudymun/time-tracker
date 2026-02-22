---
name: Zustand Stores Standards
description: Structure and patterns for Zustand client state stores
applyTo: "lib/stores/**/*.ts"
---

# Zustand Stores Standards

## Когда создавать store

Store — только для **shared client state**, который нужен нескольким компонентам.

```
✅ Нужен store:     таймер (тикает в нескольких компонентах одновременно)
✅ Нужен store:     selected filter (используется в header и в списке)
❌ Не нужен store:  состояние одной формы (useState достаточно)
❌ Не нужен store:  серверные данные (используй SWR/fetch напрямую)
```

## Структура файла

```ts
"use client"; // Store используется только на клиенте

import { create } from "zustand";

// 1. Интерфейс состояния
interface TimerState {
  // Данные
  elapsedSeconds: number;
  isRunning: boolean;
  taskName: string;

  // Actions — всегда в том же интерфейсе
  start: (taskName: string) => void;
  stop: () => void;
  tick: () => void;
  reset: () => void;
}

// 2. Начальное состояние — отдельная константа (для reset)
const initialState = {
  elapsedSeconds: 0,
  isRunning: false,
  taskName: "",
};

// 3. Создание store — именованный экспорт
export const useTimerStore = create<TimerState>((set) => ({
  // Начальное состояние
  ...initialState,

  // Actions — изменяют только необходимые поля
  start: (taskName) => set({ isRunning: true, taskName, elapsedSeconds: 0 }),
  stop: () => set({ isRunning: false }),
  tick: () => set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),
  reset: () => set(initialState),
}));
```

## Selectors — предотвращение лишних ре-рендеров

```ts
// ❌ Плохо: подписка на весь store — ре-рендер при любом изменении
const store = useTimerStore();

// ✅ Хорошо: атомарные селекторы — экспортировать как отдельные хуки
const useTimerIsRunning = () => useTimerStore((s) => s.isRunning);
const useTimerElapsed = () => useTimerStore((s) => s.elapsedSeconds);
// Потребители: const isRunning = useTimerIsRunning();

// ✅ Actions в один хук — они не меняются, не вызывают ре-рендер
const useTimerActions = () => useTimerStore((s) => s.actions);

// ✅ Несколько полей за раз — useShallow вместо нового объекта
import { useShallow } from "zustand/react/shallow";
const { isRunning, elapsedSeconds } = useTimerStore(
  useShallow((s) => ({ isRunning: s.isRunning, elapsedSeconds: s.elapsedSeconds }))
);
// Без useShallow — новый объект при каждом рендере → компонент всегда перерисовывается
```

## Actions как события, не сеттеры

```ts
// ❌ Setter-мышление — мелкие обновления разбросаны по компоненту
set({ isLoading: true });
set({ data: result });
set({ isLoading: false });

// ✅ Event-мышление — логика инкапсулирована в store
actions: {
  fetchCompleted: (data: TimeEntry[]) => set({ data, status: "success", isLoading: false }),
  fetchFailed: (error: Error) => set({ error, status: "error", isLoading: false }),
}
```

## Async actions

```ts
// Async actions — в store, не в компоненте
interface EntriesState {
  entries: TimeEntry[];
  isLoading: boolean;
  error: string | null;
  fetchEntries: () => Promise<void>;
}

export const useEntriesStore = create<EntriesState>((set) => ({
  entries: [],
  isLoading: false,
  error: null,

  fetchEntries: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/time-entries");
      if (!res.ok) throw new Error("Failed to fetch entries");
      const data = await res.json();
      set({ entries: data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Unknown error", isLoading: false });
    }
  },
}));
```

## Правила

- `"use client"` — в первой строке каждого store файла
- Никогда не импортировать Prisma в store — только `fetch` к API routes
- Actions — глаголы: `start`, `stop`, `add`, `remove`, `update`, `fetch`
- State поля — существительные: `entries`, `isLoading`, `error`, `selectedId`
- Один store — одна доменная область (timer-store, entries-store — не один общий)
