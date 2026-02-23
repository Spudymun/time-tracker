"use client";

/**
 * ProjectItem — строка проекта в двух режимах: display и edit.
 *
 * Display:
 *   [color dot] [name] [Xh total] [billable Xh]
 *   [ProjectEstimateBar if estimate set]
 *   [earnings if hourlyRate set] [entry count]
 *   [Archive/Unarchive] [Edit] [Delete]
 *
 * Edit: inline ProjectForm
 *
 * Архивированные: (archived) label, приглушённый стиль, кнопка Unarchive.
 */

import { useState } from "react";
import { Archive, ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDurationShort } from "@/lib/utils/time-format";
import { ProjectForm, type ProjectFormData } from "./ProjectForm";
import { ProjectEstimateBar } from "./ProjectEstimateBar";
import { ProjectDeleteConfirm } from "./ProjectDeleteConfirm";
import type { ProjectApiItem } from "./project-types";

interface ProjectItemProps {
  project: ProjectApiItem;
  onUpdate: (id: string, data: ProjectFormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onUnarchive: (id: string) => Promise<void>;
}

export function ProjectItem({
  project,
  onUpdate,
  onDelete,
  onArchive,
  onUnarchive,
}: ProjectItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleSave = async (data: ProjectFormData) => {
    setIsSaving(true);
    try {
      await onUpdate(project.id, data);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(project.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleArchiveToggle = async () => {
    setIsArchiving(true);
    try {
      if (project.isArchived) {
        await onUnarchive(project.id);
      } else {
        await onArchive(project.id);
      }
    } finally {
      setIsArchiving(false);
    }
  };

  if (isEditing) {
    return (
      <div className={project.isArchived ? "opacity-60" : ""}>
        <ProjectForm
          initialData={{
            name: project.name,
            color: project.color,
            estimatedHours: project.estimatedHours,
            hourlyRate: project.hourlyRate,
          }}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          isSaving={isSaving}
        />
      </div>
    );
  }

  const totalFormatted = formatDurationShort(project.totalSeconds);
  const billableFormatted = formatDurationShort(project.billableSeconds);

  return (
    <>
      <div
        className={[
          "group flex flex-col gap-2 rounded-lg border border-border bg-surface p-4",
          "transition-colors hover:bg-surface-2",
          project.isArchived ? "opacity-70" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Main row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Color dot */}
          <div
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: project.color }}
          />

          {/* Name + archived badge */}
          <span className="min-w-0 flex-1 truncate font-medium text-text-1">{project.name}</span>
          {project.isArchived && <Badge variant="archived">archived</Badge>}

          {/* Stats */}
          <div className="flex shrink-0 items-center gap-4 text-sm text-text-2">
            <span title="Всего времени">{totalFormatted}</span>
            {project.billableSeconds > 0 && (
              <span title="Billable время" className="text-success">
                ${project.billableSeconds > 0 ? billableFormatted : "0m"} billable
              </span>
            )}
            {project.earnings != null && (
              <span title="Доход" className="font-medium text-text-1">
                $
                {project.earnings.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>
            )}
            <span title="Количество записей" className="text-text-3">
              {project.entryCount}{" "}
              {project.entryCount === 1 ? "запись" : project.entryCount < 5 ? "записи" : "записей"}
            </span>
          </div>

          {/* Actions — visible on hover or always on touch devices */}
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleArchiveToggle}
              loading={isArchiving}
              title={project.isArchived ? "Разархивировать" : "Архивировать"}
            >
              {project.isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              title="Редактировать"
            >
              <Pencil size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              title="Удалить"
              className="text-error hover:text-error"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        {/* Estimate progress bar */}
        {project.estimateProgress != null && project.estimatedHours != null && (
          <ProjectEstimateBar
            estimateProgress={project.estimateProgress}
            totalSeconds={project.totalSeconds}
            estimatedHours={project.estimatedHours}
          />
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <ProjectDeleteConfirm
          projectName={project.name}
          entryCount={project.entryCount}
          isDeleting={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}
