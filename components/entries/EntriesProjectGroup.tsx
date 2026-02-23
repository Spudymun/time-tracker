"use client";

/**
 * EntriesProjectGroup — группа записей по проекту внутри одного дня.
 * Показывает заголовок проекта и суммарное время записей группы.
 */

import { formatDurationShort } from "@/lib/utils/time-format";
import { EntryItem } from "./EntryItem";
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

interface EntriesProjectGroupProps {
  projectId: string | null;
  projectName: string;
  projectColor: string;
  isArchived: boolean;
  entries: TimeEntryWithRelations[];
  allProjects: ProjectOption[];
  allTags: TagOption[];
}

export function EntriesProjectGroup({
  projectId,
  projectName,
  projectColor,
  isArchived,
  entries,
  allProjects,
  allTags,
}: EntriesProjectGroupProps) {
  // Только завершённые записи суммируются в durationSeconds
  const totalSeconds = entries.reduce((sum, e) => sum + (e.durationSeconds ?? 0), 0);

  return (
    <div className="mb-1">
      {/* Заголовок группы проекта */}
      <div className="mb-1 flex items-center gap-2 px-4 py-1">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          aria-hidden="true"
          style={{ backgroundColor: projectId ? projectColor : "#A1A1AA" }}
        />
        <span className="text-xs font-medium text-text-2">
          {projectName}
          {isArchived && <span className="ml-1 text-text-3">(archived)</span>}
        </span>
        <span className="ml-auto text-xs text-text-3">{formatDurationShort(totalSeconds)}</span>
      </div>

      {/* Записи проекта */}
      <div className="flex flex-col gap-0.5">
        {entries.map((entry) => (
          <EntryItem key={entry.id} entry={entry} projects={allProjects} tags={allTags} />
        ))}
      </div>
    </div>
  );
}
