"use client";

/**
 * ReportTagRow — expandable строка тега в таблице отчётов.
 *
 * Collapsed: цвет + название тега + billable ч + всего ч + %.
 * Expanded: список отдельных записей с данным тегом.
 * "No tag" группа показывается последней.
 */

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { TagReportItem } from "@/lib/services/report-service";
import type { TimeEntryWithRelations } from "@/lib/db/time-entries-repository";
import { formatDuration } from "@/lib/utils/time-format";
import { TagChip } from "@/components/ui/TagChip";

interface ReportTagRowProps {
  item: TagReportItem;
  entries: TimeEntryWithRelations[];
}

export function ReportTagRow({ item, entries }: ReportTagRowProps) {
  const [expanded, setExpanded] = useState(false);

  // Фильтруем записи этого тега
  const tagEntries =
    item.tagId === null
      ? // "No tag" — записи без тегов
        entries.filter((e) => e.timeEntryTags.length === 0)
      : // Записи, у которых есть данный тег
        entries.filter((e) => e.timeEntryTags.some((et) => et.tag.id === item.tagId));

  return (
    <>
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
            {item.tagId !== null && item.color ? (
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
            ) : (
              <span className="h-3 w-3 shrink-0 rounded-full bg-surface-3" />
            )}
            <span className="text-sm font-medium text-text-1">
              {item.tagName === null ? (
                <span className="text-text-3 italic">No tag</span>
              ) : item.color ? (
                <TagChip name={item.tagName} color={item.color} />
              ) : (
                item.tagName
              )}
            </span>
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
        <td className="py-3 pr-4 pl-3 text-right text-sm text-text-2 tabular-nums">
          {item.percentage.toFixed(1)}%
        </td>
      </tr>

      {/* Expanded detail rows */}
      {expanded && (
        <>
          {tagEntries.length === 0 ? (
            <tr className="border-b border-border bg-surface">
              <td colSpan={4} className="py-2 pl-12 text-sm text-text-3 italic">
                No entries
              </td>
            </tr>
          ) : (
            tagEntries.map((entry) => <TagEntryDetailRow key={entry.id} entry={entry} />)
          )}
        </>
      )}
    </>
  );
}

// ─── Detail row ───────────────────────────────────────────────────────────────

interface TagEntryDetailRowProps {
  entry: TimeEntryWithRelations;
}

function TagEntryDetailRow({ entry }: TagEntryDetailRowProps) {
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
      {/* Description + project + time */}
      <td className="py-2 pr-2 pl-12" colSpan={2}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-text-2">
            {entry.description ?? <span className="text-text-3 italic">(no description)</span>}
          </span>
          {entry.project && (
            <span className="inline-flex items-center gap-1 text-xs text-text-3">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.project.color }}
              />
              {entry.project.name}
            </span>
          )}
        </div>
        <div className="mt-0.5 text-xs text-text-3">
          {startTime} – {stopTime}
        </div>
      </td>

      {/* Duration */}
      <td className="px-3 py-2 text-right text-xs text-text-2 tabular-nums">
        {formatDuration(entry.durationSeconds ?? 0)}
      </td>

      {/* Percentage placeholder */}
      <td className="py-2 pr-4 pl-3" />
    </tr>
  );
}
