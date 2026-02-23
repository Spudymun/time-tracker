"use client";

/**
 * EntryItem — строка одной временной записи.
 *
 * Display mode:
 *   [dot проекта] [описание] [chips тегов] [$ billable] [длительность] [Continue] [Edit] [Delete]
 *
 * Edit mode:
 *   Инлайн-форма: описание + ProjectSelect + TagSelect (multi) + BillableToggle + EntryDurationInput
 *
 * Активную запись (stoppedAt=null) редактировать через этот компонент нельзя.
 */

import { useState } from "react";
import { Play, Pencil, Trash2, Check, X } from "lucide-react";
import { TagChip } from "@/components/ui/TagChip";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EntryDurationInput } from "./EntryDurationInput";
import { EntryDeleteConfirm } from "./EntryDeleteConfirm";
import { ProjectSelect } from "@/components/timer/ProjectSelect";
import { TagSelect } from "@/components/timer/TagSelect";
import { BillableToggle } from "@/components/timer/BillableToggle";
import { formatDuration } from "@/lib/utils/time-format";
import { useEntriesActions } from "@/lib/stores/entries-store";
import { useToast } from "@/components/ui/Toast";
import type { TimeEntryWithRelations } from "@/lib/db/time-entries-repository";

const MAX_VISIBLE_TAGS = 3;

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

interface EntryItemProps {
  entry: TimeEntryWithRelations;
  projects: ProjectOption[];
  tags: TagOption[];
}

export function EntryItem({ entry, projects, tags }: EntryItemProps) {
  const [mode, setMode] = useState<"display" | "edit" | "delete">("display");
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Edit form state
  const [editDesc, setEditDesc] = useState(entry.description ?? "");
  const [editProjectId, setEditProjectId] = useState<string | null>(entry.projectId ?? null);
  const [editTagIds, setEditTagIds] = useState<string[]>(
    entry.timeEntryTags.map((et) => et.tag.id)
  );
  const [editBillable, setEditBillable] = useState(entry.billable);
  const [editDurationSeconds, setEditDurationSeconds] = useState<number>(
    entry.durationSeconds ?? 0
  );

  // Tags: collapse/expand
  const [tagsExpanded, setTagsExpanded] = useState(false);

  const { updateEntry, deleteEntry, continueEntry } = useEntriesActions();
  const { toast } = useToast();

  const isActive = entry.stoppedAt === null;
  const project = projects.find((p) => p.id === entry.projectId) ?? null;
  const entryTags = entry.timeEntryTags.map((et) => et.tag);

  // Инициализируем поля формы при открытии edit mode
  function openEdit() {
    if (isActive) return; // активную запись нельзя редактировать здесь
    setEditDesc(entry.description ?? "");
    setEditProjectId(entry.projectId ?? null);
    setEditTagIds(entry.timeEntryTags.map((et) => et.tag.id));
    setEditBillable(entry.billable);
    setEditDurationSeconds(entry.durationSeconds ?? 0);
    setMode("edit");
  }

  async function handleSave() {
    setIsActionLoading(true);
    try {
      const durationMinutes =
        editDurationSeconds > 0 ? Math.round(editDurationSeconds / 60) : undefined;
      await updateEntry(entry.id, {
        description: editDesc.trim() || null,
        projectId: editProjectId,
        tagIds: editTagIds,
        billable: editBillable,
        durationMinutes,
      });
      setMode("display");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update entry");
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleDelete() {
    setIsActionLoading(true);
    try {
      await deleteEntry(entry.id);
      // Запись исчезнет из списка оптимистично
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete entry");
      setMode("display");
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleContinue() {
    setIsActionLoading(true);
    try {
      await continueEntry(entry.id);
      toast.success("Timer continued");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to continue entry");
    } finally {
      setIsActionLoading(false);
    }
  }

  // ── DELETE MODE ───────────────────────────────────────────────────
  if (mode === "delete") {
    return (
      <div className="border-danger/30 flex items-center justify-between rounded-lg border bg-surface px-4 py-3">
        <EntryDeleteConfirm
          onConfirm={handleDelete}
          onCancel={() => setMode("display")}
          isLoading={isActionLoading}
        />
      </div>
    );
  }

  // ── EDIT MODE ────────────────────────────────────────────────────
  if (mode === "edit") {
    const editProject = projects.find((p) => p.id === editProjectId) ?? null;

    return (
      <div className="rounded-lg border border-primary/40 bg-surface px-4 py-3">
        <div className="flex flex-wrap items-start gap-2">
          {/* Описание */}
          <input
            type="text"
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            placeholder="What are you working on?"
            maxLength={255}
            className={[
              "min-w-[160px] flex-1 rounded-md border border-border bg-bg px-3 py-1.5 text-sm text-text-1",
              "transition-colors duration-150 placeholder:text-text-3",
              "focus:ring-2 focus:ring-primary focus:outline-none",
            ].join(" ")}
          />

          {/* ProjectSelect */}
          <div className="shrink-0">
            <ProjectSelect
              value={editProjectId}
              onChange={setEditProjectId}
              projects={projects.map((p) => ({
                id: p.id,
                name: p.isArchived ? `${p.name} (archived)` : p.name,
                color: p.isArchived ? "#A1A1AA" : p.color,
              }))}
            />
          </div>

          {/* TagSelect (multi) */}
          <div className="shrink-0">
            <TagSelect value={editTagIds} onChange={setEditTagIds} tags={tags} />
          </div>

          {/* BillableToggle */}
          <BillableToggle checked={editBillable} onChange={setEditBillable} />

          {/* Duration input */}
          {editDurationSeconds > 0 && (
            <EntryDurationInput
              durationSeconds={editDurationSeconds}
              onConfirm={(s) => setEditDurationSeconds(s)}
              onCancel={() => {}}
            />
          )}

          {/* Save / Cancel */}
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              loading={isActionLoading}
              disabled={isActionLoading}
            >
              <Check size={14} />
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMode("display")}
              disabled={isActionLoading}
            >
              <X size={14} />
              Cancel
            </Button>
          </div>
        </div>

        {/* Архивированный проект — предупреждение */}
        {editProject?.isArchived && (
          <p className="mt-1.5 text-xs text-text-3">
            Project is archived. You can still assign it but it won't appear in new timers.
          </p>
        )}
      </div>
    );
  }

  // ── DISPLAY MODE ─────────────────────────────────────────────────
  const visibleTags = tagsExpanded ? entryTags : entryTags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenCount = entryTags.length - MAX_VISIBLE_TAGS;

  return (
    <div
      className={[
        "group flex items-center gap-3 rounded-lg bg-surface px-4 py-3 transition-colors duration-150",
        "hover:bg-surface-2",
        isActive && "border border-primary/30",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Активный индикатор / цвет проекта */}
      {isActive ? (
        <span className="mt-0.5 h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-primary" />
      ) : (
        <span
          className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{
            backgroundColor: project?.isArchived ? "#A1A1AA" : (project?.color ?? "#A1A1AA"),
          }}
        />
      )}

      {/* Описание */}
      <span
        className={[
          "flex-1 truncate text-sm",
          entry.description ? "text-text-1" : "text-text-3 italic",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {entry.description || "(no description)"}
      </span>

      {/* Теги — свёрнутые chips */}
      {entryTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {visibleTags.map((tag) => (
            <TagChip key={tag.id} name={tag.name} color={tag.color} />
          ))}
          {!tagsExpanded && hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setTagsExpanded(true)}
              className="rounded-full bg-surface-2 px-1.5 py-0.5 text-xs text-text-2 hover:bg-surface-3 focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
            >
              +{hiddenCount} more
            </button>
          )}
          {tagsExpanded && hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setTagsExpanded(false)}
              className="rounded-full bg-surface-2 px-1.5 py-0.5 text-xs text-text-2 hover:bg-surface-3 focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
            >
              Show less
            </button>
          )}
        </div>
      )}

      {/* Billable иконка */}
      {entry.billable && (
        <span
          className="shrink-0 rounded border border-primary px-1 py-0.5 text-xs font-medium text-primary"
          title="Billable"
          aria-label="Billable"
        >
          $
        </span>
      )}

      {/* Длительность */}
      <span className="shrink-0 font-mono text-sm text-text-2 tabular-nums">
        {isActive
          ? null // Активная запись рендерится через AliveEntryDuration если нужно
          : formatDuration(entry.durationSeconds ?? 0)}
      </span>

      {/* Действия — видны при hover или focus */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100">
        {/* Continue */}
        {!isActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleContinue}
            disabled={isActionLoading}
            title="Continue this entry"
            aria-label="Continue entry"
          >
            {isActionLoading ? <Spinner size="sm" /> : <Play size={14} />}
          </Button>
        )}

        {/* Edit — недоступно для активной записи */}
        {!isActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={openEdit}
            disabled={isActionLoading}
            title="Edit entry"
            aria-label="Edit entry"
          >
            <Pencil size={14} />
          </Button>
        )}

        {/* Delete */}
        {!isActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode("delete")}
            disabled={isActionLoading}
            title="Delete entry"
            aria-label="Delete entry"
            className="hover:text-danger"
          >
            <Trash2 size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}
