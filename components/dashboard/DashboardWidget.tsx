"use client";

/**
 * DashboardWidget — главный контейнер дашборда.
 *
 * ПОЧЕМУ "use client":
 * - Навигация по неделям (useState)
 * - Fetch данных на клиенте с индикатором загрузки
 * - useRef для IntersectionObserver (DashboardCompact)
 *
 * Рендерит: WeeklyBarChart + WeeklySummary + WeeklyTargetBar + TopProjectsList
 * Compact mode (DashboardCompact) активируется через IntersectionObserver.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { WeeklyBarChart } from "./WeeklyBarChart";
import { WeeklySummary } from "./WeeklySummary";
import { WeeklyTargetBar } from "./WeeklyTargetBar";
import { TopProjectsList } from "./TopProjectsList";
import { DashboardCompact } from "./DashboardCompact";
import { Spinner } from "@/components/ui/Spinner";
import { startOfWeek, formatDate } from "@/lib/utils/date-utils";
import type { DashboardData } from "@/lib/services/report-service";
import { apiFetch } from "@/lib/utils/api-client";

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Возвращает ISO-строку (YYYY-MM-DD) понедельника + воскресенья для данной недели. */
function getWeekRange(weekOffset: number): {
  from: Date;
  to: Date;
  fromStr: string;
  toStr: string;
} {
  const now = new Date();
  const mon = startOfWeek(now);
  // Смещение на weekOffset недель
  mon.setDate(mon.getDate() + weekOffset * 7);
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  return { from: mon, to: sun, fromStr: formatDate(mon), toStr: formatDate(sun) };
}

/** Форматирует лейбл недели: "Week of Feb 16–22" */
function buildWeekLabel(from: Date, to: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const fromLabel = from.toLocaleDateString("en-US", opts);
  const toDay = to.getDate();
  return `Week of ${fromLabel}–${toDay}`;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function DashboardWidget() {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = текущая неделя
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const widgetRef = useRef<HTMLElement | null>(null);

  const { fromStr, toStr, from: weekFrom, to: weekTo } = getWeekRange(weekOffset);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/dashboard?from=${fromStr}&to=${toStr}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json: DashboardData = await res.json();
      setData(json);
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, [fromStr, toStr]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const weekLabel = buildWeekLabel(weekFrom, weekTo);
  const isCurrentWeek = weekOffset === 0;

  return (
    <>
      {/* Compact sticky bar (shown when widget scrolls out of view) */}
      {data && (
        <DashboardCompact
          totalSeconds={data.totalSeconds}
          weekLabel={weekLabel}
          widgetRef={widgetRef}
        />
      )}

      {/* Main widget */}
      <section
        ref={widgetRef}
        className="mb-6 rounded-lg border border-border bg-surface p-4"
        aria-label="Weekly Dashboard"
      >
        {/* Header row */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Prev week */}
            <button
              type="button"
              onClick={() => setWeekOffset((o) => o - 1)}
              className="duration-fast flex h-7 w-7 items-center justify-center rounded-md text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              aria-label="Previous week"
            >
              ‹
            </button>

            <span className="text-sm font-medium text-text-1">{weekLabel}</span>

            {/* Next week — disabled if current week */}
            <button
              type="button"
              onClick={() => setWeekOffset((o) => o + 1)}
              disabled={isCurrentWeek}
              className="duration-fast flex h-7 w-7 items-center justify-center rounded-md text-text-2 transition-colors hover:bg-surface-2 hover:text-text-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next week"
            >
              ›
            </button>
          </div>

          <Link
            href={`/reports?from=${fromStr}&to=${toStr}`}
            className="duration-fast rounded-sm text-xs text-primary transition-colors hover:text-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            View full report →
          </Link>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-3">
            <p className="text-sm text-error">{error}</p>
            <button
              type="button"
              onClick={() => void fetchData()}
              className="duration-fast rounded-sm text-xs text-primary transition-colors hover:text-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              Retry
            </button>
          </div>
        ) : data ? (
          <div>
            {/* Bar chart */}
            <WeeklyBarChart byDay={data.byDay} />

            {/* Empty state placeholder */}
            {data.totalSeconds === 0 && (
              <p className="mt-2 text-center text-xs text-text-3">
                No entries this week. Start tracking to see your stats.
              </p>
            )}

            {/* Summary row + target */}
            <div className="mt-3 flex flex-col gap-2">
              <WeeklySummary
                totalSeconds={data.totalSeconds}
                billableSeconds={data.billableSeconds}
                totalEarnings={data.totalEarnings}
              />
              <WeeklyTargetBar totalSeconds={data.totalSeconds} />
            </div>

            {/* Top projects */}
            {data.topProjects.length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <TopProjectsList topProjects={data.topProjects} />
              </div>
            )}
          </div>
        ) : null}
      </section>
    </>
  );
}
