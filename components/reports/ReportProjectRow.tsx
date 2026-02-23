"use client";

/**
 * ReportProjectRow — expandable строка проекта в таблице отчётов.
 *
 * Collapsed: цвет + название + billable ч + всего ч + % + заработок (если есть).
 * Expanded: список отдельных записей данного проекта.
 * Archived: Badge "archived".
 */

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ProjectReportItem } from "@/lib/services/report-service";
import type { TimeEntryWithRelations } from "@/lib/db/time-entries-repository";
import { Badge } from "@/components/ui/Badge";
import { formatDuration } from "@/lib/utils/time-format";
import { TagChip } from "@/components/ui/TagChip";

interface ReportProjectRowProps {
  item: ProjectReportItem;
  entries: TimeEntryWithRelations[];
  showEarnings: boolean;
}

export function ReportProjectRow({ item, entries, showEarnings }: ReportProjectRowProps) {
  const [expanded, setExpanded] = useState(false);

  // Фильтруем записи этого проекта
  const projectEntries = entries.filter((e) => (e.projectId ?? null) === (item.projectId ?? null));

  return (
    <>
      {/* Main row */}
      <tr
        className="cursor-pointer border-b border-border transition-colors hover:bg-surface-2"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {/* Expand icon + colour + name */}
        <td className="py-3 pr-2 pl-4">
          <div className="flex items-center gap-2">
            <span className="text-text-3">
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
            {item.color ? (
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
            ) : (
              <span className="h-3 w-3 shrink-0 rounded-full bg-surface-3" />
            )}
            <span className="text-sm font-medium text-text-1">
              {item.projectName ?? <span className="text-text-3 italic">No project</span>}
            </span>
            {item.isArchived && (
              <Badge variant="archived" className="ml-1">
                archived
              </Badge>
            )}
          </div>
        </td>

        {/* Billable */}
        <td className="px-3 py-3 text-right text-sm text-text-2 tabular-nums">
          {formatDuration(item.billableSeconds)}
        </td>

        {/* Total */}
        <td className="px-3 py-3 text-right text-sm font-medium text-text-1 tabular-nums">
          {formatDuration(item.totalSeconds)}
        </td>

        {/* Percentage */}
        <td className="px-3 py-3 text-right text-sm text-text-2 tabular-nums">
          {item.percentage.toFixed(1)}%
        </td>

        {/* Earnings (conditional) */}
        {showEarnings && (
          <td className="py-3 pr-4 pl-3 text-right text-sm text-text-2 tabular-nums">
            {item.earnings != null ? (
              <span className="font-medium text-success-fg">
                $
                {item.earnings.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            ) : (
              <span className="text-text-3">—</span>
            )}
          </td>
        )}
      </tr>

      {/* Expanded detail rows */}
      {expanded && (
        <>
          {projectEntries.length === 0 ? (
            <tr className="border-b border-border bg-surface">
              <td colSpan={showEarnings ? 5 : 4} className="py-2 pl-12 text-sm text-text-3 italic">
                No entries
              </td>
            </tr>
          ) : (
            projectEntries.map((entry) => (
              <EntryDetailRow key={entry.id} entry={entry} showEarnings={showEarnings} />
            ))
          )}
        </>
      )}
    </>
  );
}

// ─── Detail row ───────────────────────────────────────────────────────────────

interface EntryDetailRowProps {
  entry: TimeEntryWithRelations;
  showEarnings: boolean;
}

function EntryDetailRow({ entry, showEarnings }: EntryDetailRowProps) {
  const tags = entry.timeEntryTags.map((et) => et.tag);
  const startTime = entry.startedAt
    ? new Date(entry.startedAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "—";
  const stopTime = entry.stoppedAt
    ? new Date(entry.stoppedAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "—";

  return (
    <tr className="border-b border-border bg-surface transition-colors hover:bg-surface-2">
      {/* Description + tags + time */}
      <td className="py-2 pr-2 pl-12">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-text-2">
            {entry.description ?? <span className="text-text-3 italic">(no description)</span>}
          </span>
          {tags.map((tag) => (
            <TagChip key={tag.id} name={tag.name} color={tag.color} />
          ))}
        </div>
        <div className="mt-0.5 text-xs text-text-3">
          {startTime} – {stopTime}
        </div>
      </td>

      {/* Billable */}
      <td className="px-3 py-2 text-right text-xs text-text-3 tabular-nums">
        {entry.billable ? formatDuration(entry.durationSeconds ?? 0) : "—"}
      </td>

      {/* Duration */}
      <td className="px-3 py-2 text-right text-xs text-text-2 tabular-nums">
        {formatDuration(entry.durationSeconds ?? 0)}
      </td>

      {/* Percentage placeholder */}
      <td className="px-3 py-2" />

      {/* Earnings placeholder */}
      {showEarnings && <td className="py-2 pr-4 pl-3" />}
    </tr>
  );
}
