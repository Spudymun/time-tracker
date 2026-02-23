"use client";

/**
 * ProjectSelect — dropdown для выбора проекта.
 * Показывает цветной кружок + название проекта.
 * Первый вариант — «No project» (value=null).
 */

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

interface ProjectOption {
  id: string;
  name: string;
  color: string;
}

interface ProjectSelectProps {
  value: string | null;
  onChange: (projectId: string | null) => void;
  projects: ProjectOption[];
  disabled?: boolean;
}

export function ProjectSelect({ value, onChange, projects, disabled = false }: ProjectSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = projects.find((p) => p.id === value) ?? null;

  // Закрываем по клику вне
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(projectId: string | null) {
    onChange(projectId);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex h-8 items-center gap-2 rounded-md border px-2.5 text-sm",
          "border-border bg-surface text-text-1 transition-colors duration-150",
          "hover:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
          "disabled:pointer-events-none disabled:opacity-50",
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
          <span className="text-text-3">No project</span>
        )}
        <ChevronDown size={12} className="ml-0.5 shrink-0 text-text-3" />
      </button>

      {open && (
        <ul className="absolute top-9 left-0 z-50 max-h-56 min-w-[160px] overflow-y-auto rounded-md border border-border bg-surface shadow-lg">
          <li>
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={[
                "w-full px-3 py-2 text-left text-sm",
                "hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none",
                value === null ? "font-medium text-text-1" : "text-text-3",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              No project
            </button>
          </li>
          {projects.map((project) => (
            <li key={project.id}>
              <button
                type="button"
                onClick={() => handleSelect(project.id)}
                className={[
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                  "hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none",
                  value === project.id ? "font-medium text-text-1" : "text-text-2",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span className="max-w-[140px] truncate">{project.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
