"use client";

/**
 * TagSelect — мульти-выбор тегов с поиском.
 * Показывает выбранные теги как TagChip.
 * Блокирует добавление 11-го тега (максимум 10).
 */

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { TagChip } from "@/components/ui/TagChip";

interface TagOption {
  id: string;
  name: string;
  color: string;
}

interface TagSelectProps {
  value: string[];
  onChange: (tagIds: string[]) => void;
  tags: TagOption[];
  disabled?: boolean;
}

const MAX_TAGS = 10;

export function TagSelect({ value, onChange, tags, disabled = false }: TagSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Закрываем по клику вне
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Фокусируем поиск при открытии
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const filtered = tags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
  const selectedTags = tags.filter((t) => value.includes(t.id));
  const isMaxReached = value.length >= MAX_TAGS;

  function toggleTag(tagId: string) {
    if (value.includes(tagId)) {
      onChange(value.filter((id) => id !== tagId));
    } else {
      if (isMaxReached) return;
      onChange([...value, tagId]);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={[
          "flex min-h-8 min-w-[100px] flex-wrap items-center gap-1 rounded-md border px-2 py-1 text-sm",
          "border-border bg-surface transition-colors duration-150",
          "hover:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
          "disabled:pointer-events-none disabled:opacity-50",
          open && "border-primary",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {selectedTags.length > 0 ? (
          selectedTags.map((tag) => (
            <span key={tag.id} onClick={(e) => e.stopPropagation()}>
              <TagChip
                name={tag.name}
                color={tag.color}
                onRemove={() => onChange(value.filter((id) => id !== tag.id))}
              />
            </span>
          ))
        ) : (
          <span className="text-text-3">No tags</span>
        )}
        <ChevronDown size={12} className="ml-auto shrink-0 text-text-3" />
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-50 w-52 rounded-md border border-border bg-surface shadow-lg">
          <div className="border-b border-border p-2">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tags..."
              className="w-full rounded border border-border bg-bg px-2 py-1 text-xs text-text-1 placeholder:text-text-3 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {isMaxReached && (
            <p className="px-3 py-1.5 text-xs text-warning">Maximum 10 tags</p>
          )}
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-text-3">No tags found</li>
            ) : (
              filtered.map((tag) => {
                const selected = value.includes(tag.id);
                const blocked = !selected && isMaxReached;
                return (
                  <li key={tag.id}>
                    <button
                      type="button"
                      disabled={blocked}
                      onClick={() => toggleTag(tag.id)}
                      title={blocked ? "Maximum 10 tags" : undefined}
                      className={[
                        "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm",
                        "hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none",
                        "disabled:pointer-events-none disabled:opacity-40",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <input
                        type="checkbox"
                        readOnly
                        checked={selected}
                        className="accent-primary"
                      />
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="truncate text-text-1">{tag.name}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
