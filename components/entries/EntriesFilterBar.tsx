"use client";

/**
 * EntriesFilterBar — панель фильтрации над списком записей.
 * Фильтры: текстовый поиск, проект, тег, billable-тоггл.
 * Все фильтры комбинируются как AND.
 * Кнопка «Clear» видна только когда хотя бы один фильтр активен.
 */

import { useEffect, useRef, useState } from "react";
import { Search, X, ChevronDown, DollarSign } from "lucide-react";
import { TagChip } from "@/components/ui/TagChip";

export interface EntriesFilter {
  q: string;
  projectId: string | null;
  tagId: string | null;
  billable: boolean | null;
}

export const EMPTY_FILTER: EntriesFilter = {
  q: "",
  projectId: null,
  tagId: null,
  billable: null,
};

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

interface EntriesFilterBarProps {
  projects: ProjectOption[];
  tags: TagOption[];
  onChange: (filters: EntriesFilter) => void;
}

/** Простой single-select для тегов в фильтр-баре. */
function TagFilterSelect({
  value,
  onChange,
  tags,
}: {
  value: string | null;
  onChange: (tagId: string | null) => void;
  tags: TagOption[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = tags.find((t) => t.id === value) ?? null;

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex h-8 items-center gap-2 rounded-md border px-2.5 text-sm",
          "border-border bg-surface text-text-1 transition-colors duration-150",
          "hover:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
          open && "border-primary",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {selected ? (
          <TagChip name={selected.name} color={selected.color} />
        ) : (
          <span className="text-text-3">All tags</span>
        )}
        <ChevronDown size={12} className="shrink-0 text-text-3" />
      </button>

      {open && (
        <ul className="absolute top-9 left-0 z-50 max-h-56 min-w-[160px] overflow-y-auto rounded-md border border-border bg-surface shadow-lg">
          <li>
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="flex w-full items-center px-3 py-2 text-sm text-text-3 hover:bg-surface-2"
            >
              All tags
            </button>
          </li>
          {tags.map((tag) => (
            <li key={tag.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(tag.id);
                  setOpen(false);
                }}
                className={[
                  "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-surface-2",
                  value === tag.id ? "bg-surface-2 font-medium text-text-1" : "text-text-1",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Простой single-select для проектов в фильтр-баре. */
function ProjectFilterSelect({
  value,
  onChange,
  projects,
}: {
  value: string | null;
  onChange: (projectId: string | null) => void;
  projects: ProjectOption[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = projects.find((p) => p.id === value) ?? null;

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex h-8 items-center gap-2 rounded-md border px-2.5 text-sm",
          "border-border bg-surface text-text-1 transition-colors duration-150",
          "hover:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
          open && "border-primary",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {selected ? (
          <>
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: selected.color }}
            />
            <span className="max-w-[120px] truncate">{selected.name}</span>
          </>
        ) : (
          <span className="text-text-3">All projects</span>
        )}
        <ChevronDown size={12} className="shrink-0 text-text-3" />
      </button>

      {open && (
        <ul className="absolute top-9 left-0 z-50 max-h-56 min-w-[180px] overflow-y-auto rounded-md border border-border bg-surface shadow-lg">
          <li>
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="flex w-full items-center px-3 py-2 text-sm text-text-3 hover:bg-surface-2"
            >
              All projects
            </button>
          </li>
          {projects.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(p.id);
                  setOpen(false);
                }}
                className={[
                  "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-surface-2",
                  value === p.id ? "bg-surface-2 font-medium text-text-1" : "text-text-1",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span className="max-w-[140px] truncate">
                  {p.name}
                  {p.isArchived && <span className="ml-1 text-xs text-text-3">(archived)</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function isFilterActive(filter: EntriesFilter): boolean {
  return (
    filter.q !== "" ||
    filter.projectId !== null ||
    filter.tagId !== null ||
    filter.billable !== null
  );
}

export function EntriesFilterBar({ projects, tags, onChange }: EntriesFilterBarProps) {
  const [filter, setFilter] = useState<EntriesFilter>(EMPTY_FILTER);

  function update<K extends keyof EntriesFilter>(key: K, value: EntriesFilter[K]) {
    const next = { ...filter, [key]: value };
    setFilter(next);
    onChange(next);
  }

  function clearAll() {
    setFilter(EMPTY_FILTER);
    onChange(EMPTY_FILTER);
  }

  const active = isFilterActive(filter);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-2">
      {/* Текстовый поиск */}
      <div className="relative flex items-center">
        <Search size={14} className="absolute left-2.5 text-text-3" aria-hidden="true" />
        <input
          type="search"
          value={filter.q}
          onChange={(e) => update("q", e.target.value)}
          placeholder="Search entries..."
          className={[
            "h-8 rounded-md border border-border bg-bg pr-3 pl-8 text-sm text-text-1",
            "transition-colors duration-150 placeholder:text-text-3",
            "focus:ring-2 focus:ring-primary focus:outline-none",
          ].join(" ")}
        />
        {filter.q && (
          <button
            type="button"
            onClick={() => update("q", "")}
            className="absolute right-2 text-text-3 hover:text-text-1 focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none"
            aria-label="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Фильтр по проекту */}
      <ProjectFilterSelect
        value={filter.projectId}
        onChange={(v) => update("projectId", v)}
        projects={projects}
      />

      {/* Фильтр по тегу (single) */}
      <TagFilterSelect value={filter.tagId} onChange={(v) => update("tagId", v)} tags={tags} />

      {/* Billable toggle */}
      <button
        type="button"
        role="checkbox"
        aria-checked={filter.billable === true}
        onClick={() => update("billable", filter.billable === true ? null : true)}
        title={filter.billable === true ? "Showing billable only" : "Show billable only"}
        className={[
          "flex h-8 w-8 items-center justify-center rounded-md border transition-colors duration-150",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
          filter.billable === true
            ? "border-primary bg-primary text-primary-fg"
            : "border-border bg-surface text-text-3 hover:border-primary hover:text-primary",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <DollarSign size={14} aria-hidden="true" />
      </button>

      {/* Сброс фильтров — виден только если хотя бы один фильтр активен */}
      {active && (
        <button
          type="button"
          onClick={clearAll}
          className={[
            "flex h-8 items-center gap-1 rounded-md border border-border bg-surface px-2.5 text-sm text-text-2",
            "hover:border-danger hover:text-danger transition-colors duration-150",
            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
          ].join(" ")}
        >
          <X size={12} aria-hidden="true" />
          Clear
        </button>
      )}
    </div>
  );
}
