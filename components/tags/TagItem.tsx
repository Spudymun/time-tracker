"use client";

/**
 * TagItem — строка тега в двух режимах: display и edit.
 *
 * Display: [color dot] [name] [X записей] [Edit btn] [Delete btn с inline confirm]
 * Edit:    inline TagForm
 */

import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TagForm, type TagFormData } from "./TagForm";
import type { TagApiItem } from "./tag-types";

interface TagItemProps {
  tag: TagApiItem;
  onUpdate: (id: string, data: TagFormData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TagItem({ tag, onUpdate, onDelete }: TagItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async (data: TagFormData) => {
    setIsSaving(true);
    try {
      await onUpdate(tag.id, data);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(tag.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isEditing) {
    return (
      <TagForm
        initialData={{ name: tag.name, color: tag.color }}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
        isSaving={isSaving}
      />
    );
  }

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:bg-surface-2">
      {/* Color dot */}
      <div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />

      {/* Name */}
      <span className="min-w-0 flex-1 truncate font-medium text-text-1">{tag.name}</span>

      {/* Usage count */}
      <span className="shrink-0 text-sm text-text-3">
        {tag.usageCount} {tag.usageCount === 1 ? "entry" : "entries"}
      </span>

      {/* Delete confirm inline */}
      {showDeleteConfirm ? (
        <div className="flex shrink-0 items-center gap-1">
          {tag.usageCount > 0 && (
            <span className="mr-1 text-xs text-warning">
              Delete from {tag.usageCount} {tag.usageCount === 1 ? "entry" : "entries"}?
            </span>
          )}
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            loading={isDeleting}
            title="Confirm delete"
          >
            <Check size={13} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(false)}
            disabled={isDeleting}
            title="Cancel"
          >
            <X size={13} />
          </Button>
        </div>
      ) : (
        /* Action buttons — visible on hover */
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} title="Edit">
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete"
            className="text-error hover:text-error"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
