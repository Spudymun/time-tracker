"use client";

/**
 * EntriesList — контейнер списка записей.
 *
 * - Загружает записи за последние 7 дней из entries-store
 * - Применяет клиентскую фильтрацию (q, projectId, tagId, billable) на загруженных данных
 * - Группирует по дате → проекту → отдаёт в EntriesDayGroup
 * - "Load more" расширяет период ещё на 7 дней
 * - Показывает EntriesFilterBar; при изменении фильтров — re-renders без лишних запросов
 */

import { useCallback, useEffect, useState } from "react";
import { EntriesFilterBar, type EntriesFilter, EMPTY_FILTER } from "./EntriesFilterBar";
import { EntriesDayGroup } from "./EntriesDayGroup";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { useEntries, useEntriesIsLoading, useEntriesActions } from "@/lib/stores/entries-store";
import type { TimeEntryWithRelations } from "@/lib/db/time-entries-repository";

interface ProjectOption {
  id: string;
  name: string;
  color: string;
  isArchived: boolean;
}

interface TagOption {
  id: string;
  name: string;
  color: string;
}

interface ProjectGroup {
  projectId: string | null;
  projectName: string;
  projectColor: string;
  isArchived: boolean;
  entries: TimeEntryWithRelations[];
}

interface DayGroup {
  date: Date;
  dateKey: string; // YYYY-MM-DD
  projectGroups: ProjectGroup[];
}

/** Форматирует Date в YYYY-MM-DD (локальный часовой пояс) */
function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Применяет фильтры к списку записей (клиентская сторона).
 * Все условия комбинируются как AND.
 */
function applyFilters(
  entries: TimeEntryWithRelations[],
  filter: EntriesFilter
): TimeEntryWithRelations[] {
  return entries.filter((entry) => {
    // Текстовый поиск по description (case-insensitive substring)
    if (filter.q && filter.q.length > 0) {
      const haystack = (entry.description ?? "").toLowerCase();
      if (!haystack.includes(filter.q.toLowerCase())) return false;
    }

    // Фильтр по проекту
    if (filter.projectId !== null) {
      if (entry.projectId !== filter.projectId) return false;
    }

    // Фильтр по тегу
    if (filter.tagId !== null) {
      const hasTag = entry.timeEntryTags.some((et) => et.tag.id === filter.tagId);
      if (!hasTag) return false;
    }

    // Billable toggle
    if (filter.billable !== null) {
      if (entry.billable !== filter.billable) return false;
    }

    return true;
  });
}

/**
 * Группирует массив записей по дате → проекту.
 * Записи уже должны быть отфильтрованы.
 */
function groupEntries(entries: TimeEntryWithRelations[], projects: ProjectOption[]): DayGroup[] {
  const dayMap = new Map<string, Map<string | null, TimeEntryWithRelations[]>>();

  // Сортируем от новых к старым
  const sorted = [...entries].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

  for (const entry of sorted) {
    const dateKey = toDateKey(new Date(entry.startedAt));
    if (!dayMap.has(dateKey)) dayMap.set(dateKey, new Map());
    const projectMap = dayMap.get(dateKey)!;
    const pid = entry.projectId ?? null;
    if (!projectMap.has(pid)) projectMap.set(pid, []);
    projectMap.get(pid)!.push(entry);
  }

  const result: DayGroup[] = [];
  for (const [dateKey, projectMap] of dayMap) {
    const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number];
    const date = new Date(y, m - 1, d);

    const projectGroups: ProjectGroup[] = [];
    for (const [pid, pgEntries] of projectMap) {
      const project = pid ? projects.find((p) => p.id === pid) : null;
      projectGroups.push({
        projectId: pid,
        projectName: project?.name ?? "No project",
        projectColor: project?.color ?? "#A1A1AA",
        isArchived: project?.isArchived ?? false,
        entries: pgEntries,
      });
    }

    result.push({ date, dateKey, projectGroups });
  }

  return result;
}

interface EntriesListProps {
  projects: ProjectOption[];
  tags: TagOption[];
}

export function EntriesList({ projects, tags }: EntriesListProps) {
  const entries = useEntries();
  const isLoading = useEntriesIsLoading();
  const { fetchEntries } = useEntriesActions();

  const [filter, setFilter] = useState<EntriesFilter>(EMPTY_FILTER);
  // Количество 7-дневных периодов (1 = последние 7 дней)
  const [periods, setPeriods] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const load = useCallback(
    (numPeriods: number) => {
      const to = new Date();
      const from = new Date(to.getTime() - numPeriods * 7 * 24 * 60 * 60 * 1000);
      return fetchEntries(from, to);
    },
    [fetchEntries]
  );

  // Первоначальная загрузка
  useEffect(() => {
    load(1);
  }, [load]);

  async function handleLoadMore() {
    setIsLoadingMore(true);
    const next = periods + 1;
    try {
      await load(next);
      setPeriods(next);
    } finally {
      setIsLoadingMore(false);
    }
  }

  const filtered = applyFilters(entries, filter);
  const dayGroups = groupEntries(filtered, projects);

  return (
    <div className="space-y-4">
      {/* Фильтр-бар */}
      <EntriesFilterBar projects={projects} tags={tags} onChange={setFilter} />

      {/* Список */}
      {isLoading && entries.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : dayGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border py-16 text-center">
          <p className="mb-1 text-base font-medium text-text-1">No entries found</p>
          <p className="text-sm text-text-3">
            {filter !== EMPTY_FILTER
              ? "Try clearing filters or adjusting your search."
              : "Start the timer to add your first time entry."}
          </p>
        </div>
      ) : (
        <>
          {dayGroups.map((dayGroup) => (
            <EntriesDayGroup
              key={dayGroup.dateKey}
              date={dayGroup.date}
              projectGroups={dayGroup.projectGroups}
              allProjects={projects}
              allTags={tags}
            />
          ))}

          {/* Load more */}
          <div className="flex justify-center py-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLoadMore}
              loading={isLoadingMore}
              disabled={isLoadingMore}
            >
              Load more ({periods * 7}+ days shown)
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
