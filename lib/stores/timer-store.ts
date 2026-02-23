"use client";

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { TimeEntryWithRelations } from "@/lib/db/time-entries-repository";
import type { CreateEntryInput } from "@/lib/validations/time-entry-schema";
import { apiFetch } from "@/lib/utils/api-client";

interface TimerState {
  activeEntry: TimeEntryWithRelations | null;
  elapsedSeconds: number;
  isLoading: boolean;

  // Actions
  initTimer: () => Promise<void>;
  startTimer: (data: CreateEntryInput) => Promise<void>;
  stopTimer: () => Promise<void>;
  tick: () => void;
  // Вызывается из entries-store после continueEntry
  setActiveEntry: (entry: TimeEntryWithRelations | null) => void;
}

const initialState = {
  activeEntry: null as TimeEntryWithRelations | null,
  elapsedSeconds: 0,
  isLoading: false,
};

export const useTimerStore = create<TimerState>((set, get) => ({
  ...initialState,

  // Загружает активную запись при монтировании приложения.
  // Вычисляет elapsedSeconds по разнице (now - startedAt).
  initTimer: async () => {
    set({ isLoading: true });
    try {
      const res = await apiFetch("/api/time-entries/active");
      if (!res.ok) throw new Error("Failed to fetch active entry");
      const activeEntry: TimeEntryWithRelations | null = await res.json();

      let elapsedSeconds = 0;
      if (activeEntry?.startedAt) {
        elapsedSeconds = Math.max(
          0,
          Math.floor((Date.now() - new Date(activeEntry.startedAt).getTime()) / 1000)
        );
      }

      set({ activeEntry, elapsedSeconds, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  // Запускает новый таймер через POST /api/time-entries.
  // Бросает ошибку чтобы UI мог показать toast.
  startTimer: async (data: CreateEntryInput) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to start timer");
      }
      const activeEntry: TimeEntryWithRelations = await res.json();
      set({ activeEntry, elapsedSeconds: 0, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  // Останавливает активный таймер через POST /api/time-entries/:id/stop.
  // После остановки добавляет запись в entries-store.
  // Бросает ошибку чтобы UI мог показать toast.
  stopTimer: async () => {
    const { activeEntry } = get();
    if (!activeEntry) return;

    set({ isLoading: true });
    try {
      const res = await apiFetch(`/api/time-entries/${activeEntry.id}/stop`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to stop timer");
      }
      const stoppedEntry: TimeEntryWithRelations = await res.json();

      set({ activeEntry: null, elapsedSeconds: 0, isLoading: false });

      // Добавляем в entries-store через getState() чтобы избежать re-render в store
      // Ленивый импорт внутри тела функции — не создаёт проблем с circular deps в runtime
      const { useEntriesStore } = await import("@/lib/stores/entries-store");
      useEntriesStore.getState().addEntry(stoppedEntry);
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  // Увеличивает счётчик на 1 секунду — вызывается из useEffect + setInterval
  tick: () => set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),

  // Устанавливает activeEntry снаружи (из entries-store после continueEntry)
  setActiveEntry: (entry: TimeEntryWithRelations | null) => {
    let elapsedSeconds = 0;
    if (entry?.startedAt) {
      elapsedSeconds = Math.max(
        0,
        Math.floor((Date.now() - new Date(entry.startedAt).getTime()) / 1000)
      );
    }
    set({ activeEntry: entry, elapsedSeconds });
  },
}));

// ─── Atomic selectors — предотвращают лишние ре-рендеры ───────────────────────

export const useActiveEntry = () => useTimerStore((s) => s.activeEntry);
export const useElapsedSeconds = () => useTimerStore((s) => s.elapsedSeconds);
export const useTimerIsLoading = () => useTimerStore((s) => s.isLoading);

// Возвращает только actions — они не меняются, не вызывают ре-рендер
export const useTimerActions = () =>
  useTimerStore(
    useShallow((s) => ({
      initTimer: s.initTimer,
      startTimer: s.startTimer,
      stopTimer: s.stopTimer,
      tick: s.tick,
      setActiveEntry: s.setActiveEntry,
    }))
  );
