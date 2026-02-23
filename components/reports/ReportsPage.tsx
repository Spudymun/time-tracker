"use client";

/**
 * ReportsPage — клиентский компонент страницы отчётов.
 *
 * State:
 *   - period (from/to): начинается с "This Week"
 *   - reportData: ответ GET /api/reports
 *   - entries: сырые записи для expandable detail rows
 *   - viewMode: 'projects' | 'tags'
 *   - isLoading / error
 */

import { useState, useEffect, useCallback } from "react";
import type { ProjectReportItem, TagReportItem } from "@/lib/services/report-service";
import type { TimeEntryWithRelations } from "@/lib/db/time-entries-repository";
import { formatDate } from "@/lib/utils/date-utils";
import { apiFetch } from "@/lib/utils/api-client";
import { Spinner } from "@/components/ui/Spinner";
import { PeriodSelector } from "./PeriodSelector";
import { ReportViewToggle } from "./ReportViewToggle";
import { ReportTable } from "./ReportTable";
import { ExportButton } from "./ExportButton";

type ViewMode = "projects" | "tags";

interface ReportResponse {
  from: string;
  to: string;
  totalSeconds: number;
  billableSeconds: number;
  totalEarnings: number | null;
  byProject: ProjectReportItem[];
  byTag: TagReportItem[];
}

/** Возвращает даты начала и конца текущей недели (пн–вс). */
function getDefaultPeriod(): { from: Date; to: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: monday, to: sunday };
}

export function ReportsPage() {
  const defaultPeriod = getDefaultPeriod();

  const [from, setFrom] = useState<Date>(defaultPeriod.from);
  const [to, setTo] = useState<Date>(defaultPeriod.to);
  const [viewMode, setViewMode] = useState<ViewMode>("projects");
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [entries, setEntries] = useState<TimeEntryWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async (fromDate: Date, toDate: Date) => {
    setIsLoading(true);
    setError(null);
    try {
      const fromStr = formatDate(fromDate);
      const toStr = formatDate(toDate);

      // Параллельно загружаем агрегированный отчёт и сырые записи
      const [reportRes, entriesRes] = await Promise.all([
        apiFetch(`/api/reports?from=${fromStr}&to=${toStr}`),
        apiFetch(`/api/time-entries?from=${fromStr}&to=${toStr}`),
      ]);

      if (!reportRes.ok) {
        const body = await reportRes.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Report error: ${reportRes.status}`);
      }

      const report = (await reportRes.json()) as ReportResponse;
      setReportData(report);

      if (entriesRes.ok) {
        const rawEntries = (await entriesRes.json()) as TimeEntryWithRelations[];
        // Показываем только завершённые записи в деталях
        setEntries(rawEntries.filter((e) => e.stoppedAt !== null));
      }
    } catch (err) {
      if (err instanceof Error && err.message !== "Unauthorized") {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Начальная загрузка
  useEffect(() => {
    fetchReport(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePeriodChange(period: { from: Date; to: Date }) {
    setFrom(period.from);
    setTo(period.to);
    fetchReport(period.from, period.to);
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-text-1">Reports</h1>
        <ExportButton from={from} to={to} />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PeriodSelector from={from} to={to} onChange={handlePeriodChange} />
        <ReportViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-error bg-error-bg px-4 py-6 text-center">
          <p className="text-sm text-error">{error}</p>
          <button
            onClick={() => fetchReport(from, to)}
            className="mt-3 text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            Try again
          </button>
        </div>
      ) : reportData ? (
        <ReportTable
          viewMode={viewMode}
          byProject={reportData.byProject}
          byTag={reportData.byTag}
          entries={entries}
          totalSeconds={reportData.totalSeconds}
          billableSeconds={reportData.billableSeconds}
          totalEarnings={reportData.totalEarnings}
        />
      ) : null}
    </div>
  );
}
