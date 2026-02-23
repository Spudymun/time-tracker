"use client";

/**
 * TimerBar — горизонтальная панель таймера в хедере layout.
 * Всегда видна. Инициализирует таймер при монтировании.
 * Загружает проекты и теги для select-компонентов.
 */

import { useCallback, useEffect, useState } from "react";
import { useTimerStore } from "@/lib/stores/timer-store";
import { useToast } from "@/components/ui/Toast";
import { TaskAutocomplete } from "./TaskAutocomplete";
import { ProjectSelect } from "./ProjectSelect";
import { TagSelect } from "./TagSelect";
import { BillableToggle } from "./BillableToggle";
import { TimerDisplay } from "./TimerDisplay";
import { TimerControls } from "./TimerControls";

interface ProjectOption {
  id: string;
  name: string;
  color: string;
}

interface TagOption {
  id: string;
  name: string;
  color: string;
}

interface TimerFormState {
  description: string;
  projectId: string | null;
  tagIds: string[];
  billable: boolean;
}

const DEFAULT_FORM: TimerFormState = {
  description: "",
  projectId: null,
  tagIds: [],
  billable: false,
};

export function TimerBar() {
  const [form, setForm] = useState<TimerFormState>(DEFAULT_FORM);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);

  const activeEntry = useTimerStore((s) => s.activeEntry);
  const initTimer = useTimerStore((s) => s.initTimer);
  const startTimer = useTimerStore((s) => s.startTimer);
  const { toast } = useToast();

  // Инициализируем таймер и подгружаем проекты + теги один раз
  useEffect(() => {
    initTimer();

    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/tags").then((r) => r.json()),
    ])
      .then(([projectsData, tagsData]: [ProjectOption[], TagOption[]]) => {
        setProjects(projectsData);
        setTags(tagsData);
      })
      .catch(() => {
        // Молча доступно — selects просто будут пустыми
      });
  }, [initTimer]);

  // Синхронизируем форму с активной записью (при загрузке / continueEntry)
  useEffect(() => {
    if (activeEntry) {
      setForm({
        description: activeEntry.description ?? "",
        projectId: activeEntry.project?.id ?? null,
        tagIds: activeEntry.timeEntryTags.map((t) => t.tag.id),
        billable: activeEntry.billable,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  }, [activeEntry]);

  const handleStart = useCallback(async () => {
    try {
      await startTimer({
        description: form.description.trim() || null,
        projectId: form.projectId,
        tagIds: form.tagIds,
        billable: form.billable,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start timer");
    }
  }, [form, startTimer, toast]);

  const isRunning = activeEntry !== null;

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <TaskAutocomplete
        value={form.description}
        onChange={(v) => setForm((f) => ({ ...f, description: v }))}
        onSubmit={isRunning ? undefined : handleStart}
        disabled={isRunning}
      />
      <ProjectSelect
        value={form.projectId}
        onChange={(v) => setForm((f) => ({ ...f, projectId: v }))}
        projects={projects}
        disabled={isRunning}
      />
      <TagSelect
        value={form.tagIds}
        onChange={(v) => setForm((f) => ({ ...f, tagIds: v }))}
        tags={tags}
        disabled={isRunning}
      />
      <BillableToggle
        checked={form.billable}
        onChange={(v) => setForm((f) => ({ ...f, billable: v }))}
        disabled={isRunning}
      />
      <TimerDisplay />
      <TimerControls onStart={handleStart} />
    </div>
  );
}
