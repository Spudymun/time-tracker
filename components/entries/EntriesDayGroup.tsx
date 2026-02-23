"use client";

/**
 * EntriesDayGroup — группа записей за один день.
 * Заголовок: "Today" / "Yesterday" / форматированная дата.
 * Итог дня: суммарное время всех завершённых записей.
 * Внутри — подгруппы по проекту (EntriesProjectGroup).
 */

import { formatDurationShort } from "@/lib/utils/time-format";
import { EntriesProjectGroup } from "./EntriesProjectGroup";
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

interface EntriesDayGroupProps {
  date: Date;
  projectGroups: ProjectGroup[];
  allProjects: ProjectOption[];
  allTags: TagOption[];
}

/**
 * Форматирует дату в человекочитаемый заголовок.
 * "Today" / "Yesterday" / "Mon, Jan 6"
 */
function formatDayLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === yesterday.getTime()) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function EntriesDayGroup({
  date,
  projectGroups,
  allProjects,
  allTags,
}: EntriesDayGroupProps) {
  const allEntries = projectGroups.flatMap((g) => g.entries);
  const totalSeconds = allEntries.reduce((sum, e) => sum + (e.durationSeconds ?? 0), 0);

  return (
    <section aria-label={`Entries for ${formatDayLabel(date)}`} className="mb-6">
      {/* Заголовок дня */}
      <div className="mb-2 flex items-center justify-between px-1 py-1">
        <h3 className="text-sm font-semibold text-text-1">{formatDayLabel(date)}</h3>
        <span className="text-sm font-medium text-text-2">{formatDurationShort(totalSeconds)}</span>
      </div>

      {/* Группы проектов */}
      {/* overflow-visible (default) позволяет абсолютным dropdown (ProjectSelect/TagSelect) */}
      {/* в режиме редактирования выходить за пределы карточки и не обрезаться */}
      <div className="rounded-xl border border-border">
        {projectGroups.map((group, idx) => (
          <div
            key={group.projectId ?? "__no_project__"}
            className={idx > 0 ? "border-t border-border" : ""}
          >
            <EntriesProjectGroup
              projectId={group.projectId}
              projectName={group.projectName}
              projectColor={group.projectColor}
              isArchived={group.isArchived}
              entries={group.entries}
              allProjects={allProjects}
              allTags={allTags}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
