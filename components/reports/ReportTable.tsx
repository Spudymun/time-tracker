"use client";

/**
 * ReportTable — универсальная таблица отчётов.
 * Рендерит строки проектов или тегов в зависимости от viewMode.
 * Footer: строка Total.
 * Колонка Earnings отображается только если totalEarnings != null.
 */

import type { ProjectReportItem, TagReportItem } from "@/lib/services/report-service";
import type { TimeEntryWithRelations } from "@/lib/db/time-entries-repository";
import { ReportProjectRow } from "./ReportProjectRow";
import { ReportTagRow } from "./ReportTagRow";
import { formatDuration } from "@/lib/utils/time-format";

type ViewMode = "projects" | "tags";

interface ReportTableProps {
  viewMode: ViewMode;
  byProject: ProjectReportItem[];
  byTag: TagReportItem[];
  entries: TimeEntryWithRelations[];
  totalSeconds: number;
  billableSeconds: number;
  totalEarnings: number | null;
}

export function ReportTable({
  viewMode,
  byProject,
  byTag,
  entries,
  totalSeconds,
  billableSeconds,
  totalEarnings,
}: ReportTableProps) {
  const showEarnings = totalEarnings !== null;

  // Пустые данные
  const isEmpty = viewMode === "projects" ? byProject.length === 0 : byTag.length === 0;

  if (isEmpty) {
    return (
      <div className="rounded-lg border border-border bg-surface py-12 text-center">
        <p className="text-text-3">No data for this period</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border bg-surface-2">
            <th className="py-3 pr-2 pl-4 text-left text-xs font-semibold tracking-wide text-text-3 uppercase">
              {viewMode === "projects" ? "Project" : "Tag"}
            </th>
            <th className="px-3 py-3 text-right text-xs font-semibold tracking-wide text-text-3 uppercase">
              Billable
            </th>
            <th className="px-3 py-3 text-right text-xs font-semibold tracking-wide text-text-3 uppercase">
              Total
            </th>
            <th
              className={
                "py-3 text-right text-xs font-semibold tracking-wide text-text-3 uppercase " +
                (showEarnings ? "px-3" : "pr-4 pl-3")
              }
            >
              %
            </th>
            {showEarnings && (
              <th className="py-3 pr-4 pl-3 text-right text-xs font-semibold tracking-wide text-text-3 uppercase">
                Earned
              </th>
            )}
          </tr>
        </thead>

        <tbody className="bg-bg">
          {viewMode === "projects"
            ? byProject.map((item) => (
                <ReportProjectRow
                  key={item.projectId ?? "__no_project__"}
                  item={item}
                  entries={entries}
                  showEarnings={showEarnings}
                />
              ))
            : byTag.map((item) => (
                <ReportTagRow key={item.tagId ?? "__no_tag__"} item={item} entries={entries} />
              ))}
        </tbody>

        {/* Footer — Total */}
        <tfoot>
          <tr className="border-t-2 border-border bg-surface-2">
            <td className="py-3 pr-2 pl-4 text-sm font-semibold text-text-1">Total</td>
            <td className="px-3 py-3 text-right text-sm font-medium text-text-2 tabular-nums">
              {formatDuration(billableSeconds)}
            </td>
            <td className="px-3 py-3 text-right text-sm font-semibold text-text-1 tabular-nums">
              {formatDuration(totalSeconds)}
            </td>
            <td
              className={
                "py-3 text-right text-sm text-text-2 tabular-nums " +
                (showEarnings ? "px-3" : "pr-4 pl-3")
              }
            >
              100%
            </td>
            {showEarnings && (
              <td className="py-3 pr-4 pl-3 text-right text-sm font-semibold text-success-fg tabular-nums">
                $
                {(totalEarnings ?? 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            )}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
