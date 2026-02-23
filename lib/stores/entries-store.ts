"use client";

import { create } from "zustand";
import type { TimeEntryWithRelations } from "@/lib/db/time-entries-repository";
import type { UpdateEntryInput } from "@/lib/validations/time-entry-schema";

interface EntriesState {
  entries: TimeEntryWithRelations[];
  isLoading: boolean;

  // Actions
  fetchEntries: (from: Date, to: Date) => Promise<void>;
  updateEntry: (id: string, data: UpdateEntryInput) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  continueEntry: (id: string) => Promise<void>;
  // Добавляет запись в начало списка — вызывается из timer-store после stopTimer
  addEntry: (entry: TimeEntryWithRelations) => void;
}

const initialState = {
  entries: [] as TimeEntryWithRelations[],
  isLoading: false,
};

export const useEntriesStore = create<EntriesState>((set, get) => ({
  ...initialState,

  // Загружает записи за указанный диапазон дат через GET /api/time-entries
  fetchEntries: async (from: Date, to: Date) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
      });
      const res = await fetch(`/api/time-entries?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch entries");
      const entries: TimeEntryWithRelations[] = await res.json();
      set({ entries, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  // Оптимистично обновляет запись, затем отправляет PUT /api/time-entries/:id.
  // При ошибке откатывает к предыдущему состоянию.
  updateEntry: async (id: string, data: UpdateEntryInput) => {
    const { entries } = get();
    const prevEntries = entries;

    // Оптимистичное обновление — частичный merge полей
    set({
      entries: entries.map((e) =>
        e.id === id
          ? {
              ...e,
              description: data.description !== undefined ? data.description : e.description,
              billable: data.billable !== undefined ? data.billable : e.billable,
            }
          : e
      ),
    });

    try {
      const res = await fetch(`/api/time-entries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to update entry");
      }
      const updated: TimeEntryWithRelations = await res.json();
      // Заменяем на полный объект с отношениями от сервера
      set({ entries: get().entries.map((e) => (e.id === id ? updated : e)) });
    } catch (err) {
      // Откат при ошибке
      set({ entries: prevEntries });
      throw err;
    }
  },

  // Оптимистично удаляет запись из списка, затем отправляет DELETE /api/time-entries/:id.
  // При ошибке откатывает к предыдущему состоянию.
  deleteEntry: async (id: string) => {
    const { entries } = get();
    const prevEntries = entries;

    // Оптимистичное удаление
    set({ entries: entries.filter((e) => e.id !== id) });

    try {
      const res = await fetch(`/api/time-entries/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to delete entry");
      }
    } catch (err) {
      // Откат при ошибке
      set({ entries: prevEntries });
      throw err;
    }
  },

  // Создаёт новую активную запись как копию существующей через POST /api/time-entries/:id/continue.
  // После создания обновляет timer-store через setActiveEntry.
  continueEntry: async (id: string) => {
    try {
      const res = await fetch(`/api/time-entries/${id}/continue`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Failed to continue entry");
      }
      const newEntry: TimeEntryWithRelations = await res.json();

      // Ленивый импорт — избегает circular dep проблем при инициализации модулей
      const { useTimerStore } = await import("@/lib/stores/timer-store");
      useTimerStore.getState().setActiveEntry(newEntry);
    } catch (err) {
      throw err;
    }
  },

  // Добавляет запись в начало списка.
  // Вызывается из timer-store после успешной остановки таймера.
  addEntry: (entry: TimeEntryWithRelations) => {
    set((state) => ({ entries: [entry, ...state.entries] }));
  },
}));

// Atomic selectors — предотвращают лишние ре-рендеры

export const useEntries = () => useEntriesStore((s) => s.entries);
export const useEntriesIsLoading = () => useEntriesStore((s) => s.isLoading);

// Возвращает только actions — они не меняются, не вызывают ре-рендер
export const useEntriesActions = () =>
  useEntriesStore((s) => ({
    fetchEntries: s.fetchEntries,
    updateEntry: s.updateEntry,
    deleteEntry: s.deleteEntry,
    continueEntry: s.continueEntry,
    addEntry: s.addEntry,
  }));
