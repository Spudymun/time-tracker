"use client";

/**
 * TagsList — список тегов с управлением (создание, редактирование, удаление).
 *
 * Логика:
 * - initialTags: инициализируются из SSR
 * - Мутации обновляют локальный state оптимистично
 */

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/utils/api-client";
import { TagForm, type TagFormData } from "./TagForm";
import { TagItem } from "./TagItem";
import type { TagApiItem } from "./tag-types";

interface TagsListProps {
  initialTags: TagApiItem[];
}

export function TagsList({ initialTags }: TagsListProps) {
  const [tags, setTags] = useState<TagApiItem[]>(initialTags);
  const [showNewForm, setShowNewForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { toast } = useToast();

  // ── Create ────────────────────────────────────────────────────────────────

  const handleCreate = async (data: TagFormData) => {
    setIsCreating(true);
    try {
      const res = await apiFetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.status === 409) {
        toast.error("A tag with this name already exists");
        return;
      }
      if (!res.ok) throw new Error("Failed to create tag");

      const created: TagApiItem = await res.json();
      setTags((prev) => [created, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
      setShowNewForm(false);
      toast.success(`Tag "${created.name}" created`);
    } catch {
      toast.error("Failed to create tag");
    } finally {
      setIsCreating(false);
    }
  };

  // ── Update ────────────────────────────────────────────────────────────────

  const handleUpdate = async (id: string, data: TagFormData) => {
    const res = await apiFetch(`/api/tags/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.status === 409) {
      toast.error("A tag with this name already exists");
      throw new Error("Conflict");
    }
    if (!res.ok) throw new Error("Failed to update tag");

    const updated: TagApiItem & { _count?: unknown } = await res.json();

    // API PUT returns Tag without usageCount — keep the old one
    setTags((prev) =>
      prev
        .map((t) => (t.id === id ? { ...t, name: updated.name, color: updated.color } : t))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    toast.success("Tag updated");
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    const res = await apiFetch(`/api/tags/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 404) throw new Error("Failed to delete tag");

    setTags((prev) => prev.filter((t) => t.id !== id));
    toast.success("Tag deleted");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-1">Tags</h2>
        <Button variant="primary" size="sm" onClick={() => setShowNewForm((v) => !v)}>
          <Plus size={14} />
          New tag
        </Button>
      </div>

      {/* New tag form */}
      {showNewForm && (
        <TagForm
          onSave={handleCreate}
          onCancel={() => setShowNewForm(false)}
          isSaving={isCreating}
        />
      )}

      {/* Tags list */}
      {tags.length === 0 && !showNewForm ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface py-12 text-center">
          <p className="text-text-2">You don&apos;t have any tags yet.</p>
          <Button variant="primary" size="sm" onClick={() => setShowNewForm(true)}>
            <Plus size={14} />
            Create first tag
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tags.map((tag) => (
            <TagItem key={tag.id} tag={tag} onUpdate={handleUpdate} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
