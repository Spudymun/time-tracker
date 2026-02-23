"use client";

/**
 * ProjectsList — список проектов с управлением (создание, редактирование, архив, удаление).
 *
 * Логика данных:
 * - activeProjects: инициализируется из SSR (initialProjects)
 * - archivedProjects: подгружаются отдельно при включении toggle
 * - Мутации обновляют локальный state без полного рефетча
 */

import { useState } from "react";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/utils/api-client";
import { ProjectItem } from "./ProjectItem";
import { ProjectForm, type ProjectFormData } from "./ProjectForm";
import type { ProjectApiItem } from "./project-types";

interface ProjectsListProps {
  initialProjects: ProjectApiItem[];
}

export function ProjectsList({ initialProjects }: ProjectsListProps) {
  const [activeProjects, setActiveProjects] = useState<ProjectApiItem[]>(initialProjects);
  const [archivedProjects, setArchivedProjects] = useState<ProjectApiItem[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { toast } = useToast();

  // ── Toggle "Show archived" ────────────────────────────────────────────────

  const handleToggleArchived = async () => {
    if (!showArchived && archivedProjects.length === 0) {
      setIsLoadingArchived(true);
      try {
        const res = await apiFetch("/api/projects?archived=true");
        if (!res.ok) throw new Error("Failed to load archived projects");
        const data: ProjectApiItem[] = await res.json();
        setArchivedProjects(data);
      } catch {
        toast.error("Не удалось загрузить архивные проекты");
        return;
      } finally {
        setIsLoadingArchived(false);
      }
    }
    setShowArchived((prev) => !prev);
  };

  // ── Create ────────────────────────────────────────────────────────────────

  const handleCreate = async (data: ProjectFormData) => {
    setIsCreating(true);
    try {
      const res = await apiFetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.status === 409) {
        toast.error("Проект с таким названием уже существует");
        return;
      }
      if (!res.ok) throw new Error("Failed to create project");

      const created: ProjectApiItem = await res.json();
      setActiveProjects((prev) => [created, ...prev]);
      setShowNewForm(false);
      toast.success(`Проект «${created.name}» создан`);
    } catch {
      toast.error("Не удалось создать проект");
    } finally {
      setIsCreating(false);
    }
  };

  // ── Update ────────────────────────────────────────────────────────────────

  const handleUpdate = async (id: string, data: ProjectFormData) => {
    const res = await apiFetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.status === 409) {
      toast.error("Проект с таким названием уже существует");
      throw new Error("Conflict");
    }
    if (!res.ok) throw new Error("Failed to update project");

    const updated: ProjectApiItem = await res.json();

    const replace = (list: ProjectApiItem[]) => list.map((p) => (p.id === id ? updated : p));

    setActiveProjects(replace);
    setArchivedProjects(replace);
    toast.success("Проект обновлён");
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    const res = await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 404) throw new Error("Failed to delete project");

    setActiveProjects((prev) => prev.filter((p) => p.id !== id));
    setArchivedProjects((prev) => prev.filter((p) => p.id !== id));
    toast.success("Проект удалён");
  };

  // ── Archive ───────────────────────────────────────────────────────────────

  const handleArchive = async (id: string) => {
    const res = await apiFetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: true }),
    });
    if (!res.ok) throw new Error("Failed to archive project");

    const updated: ProjectApiItem = await res.json();

    setActiveProjects((prev) => prev.filter((p) => p.id !== id));
    if (showArchived) setArchivedProjects((prev) => [updated, ...prev]);

    toast.success(`«${updated.name}» архивирован`);
  };

  // ── Unarchive ─────────────────────────────────────────────────────────────

  const handleUnarchive = async (id: string) => {
    const res = await apiFetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: false }),
    });
    if (!res.ok) throw new Error("Failed to unarchive project");

    const updated: ProjectApiItem = await res.json();

    setArchivedProjects((prev) => prev.filter((p) => p.id !== id));
    setActiveProjects((prev) => [updated, ...prev]);

    toast.success(`«${updated.name}» разархивирован`);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-1">Проекты</h2>
        <Button variant="primary" size="sm" onClick={() => setShowNewForm((v) => !v)}>
          <Plus size={14} />
          Новый проект
        </Button>
      </div>

      {/* New project form */}
      {showNewForm && (
        <ProjectForm
          onSave={handleCreate}
          onCancel={() => setShowNewForm(false)}
          isSaving={isCreating}
        />
      )}

      {/* Active projects */}
      {activeProjects.length === 0 && !showNewForm ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface py-12 text-center">
          <p className="text-text-2">У вас пока нет активных проектов.</p>
          <Button variant="primary" size="sm" onClick={() => setShowNewForm(true)}>
            <Plus size={14} />
            Создать первый проект
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {activeProjects.map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onArchive={handleArchive}
              onUnarchive={handleUnarchive}
            />
          ))}
        </div>
      )}

      {/* Toggle "Show archived" */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleArchived}
          loading={isLoadingArchived}
          className="text-text-3"
        >
          {isLoadingArchived ? (
            <Spinner size="sm" />
          ) : showArchived ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
          {showArchived ? "Скрыть архивные" : "Показать архивные"}
        </Button>
      </div>

      {/* Archived projects */}
      {showArchived && (
        <div className="flex flex-col gap-2">
          {archivedProjects.length === 0 ? (
            <p className="py-4 text-center text-sm text-text-3">Нет архивных проектов</p>
          ) : (
            archivedProjects.map((project) => (
              <ProjectItem
                key={project.id}
                project={project}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
