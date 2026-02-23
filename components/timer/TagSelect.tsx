"use client";

/**
 * TagSelect — мульти-выбор тегов с поиском.
 * Показывает выбранные теги как TagChip.
 * Блокирует добавление 11-го тега (максимум 10).
 *
 * Опция `allowCreate` добавляет строку «Create "name"» при отсутствии точного совпадения.
 * При создании вызывает `onTagCreated(newTag)` чтобы родитель мог обновить список.
 */

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { TagChip } from "@/components/ui/TagChip";
import { Spinner } from "@/components/ui/Spinner";

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
  /** Показывать строку «Create "name"» в dropdown */
  allowCreate?: boolean;
  /** Вызывается после успешного создания тега через API */
  onTagCreated?: (tag: TagOption) => void;
}

const MAX_TAGS = 10;
const DEFAULT_NEW_TAG_COLOR = "#10b981";

export function TagSelect({
  value,
  onChange,
  tags,
  disabled = false,
  allowCreate = false,
  onTagCreated,
}: TagSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
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

  // Показываем "Create" если allowCreate, есть поисковый текст, нет точного совпадения и не превышен лимит
  const trimmedSearch = search.trim().toLowerCase();
  const exactMatch = tags.some((t) => t.name === trimmedSearch);
  const showCreateOption = allowCreate && trimmedSearch.length > 0 && !exactMatch && !isMaxReached;

  function toggleTag(tagId: string) {
    if (value.includes(tagId)) {
      onChange(value.filter((id) => id !== tagId));
    } else {
      if (isMaxReached) return;
      onChange([...value, tagId]);
    }
  }

  async function handleCreate() {
    if (!trimmedSearch || isCreating) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedSearch, color: DEFAULT_NEW_TAG_COLOR }),
      });
      if (!res.ok) return;
      const newTag: TagOption & { usageCount?: number; createdAt?: string } = await res.json();
      const tagOption: TagOption = { id: newTag.id, name: newTag.name, color: newTag.color };
      onTagCreated?.(tagOption);
      onChange([...value, tagOption.id]);
      setSearch("");
    } finally {
      setIsCreating(false);
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
        <div className="absolute top-10 left-0 z-50 w-52 rounded-md border border-border bg-surface shadow-lg">
          <div className="border-b border-border p-2">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tags..."
              className="w-full rounded border border-border bg-bg px-2 py-1 text-xs text-text-1 placeholder:text-text-3 focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
          {isMaxReached && <p className="px-3 py-1.5 text-xs text-warning">Maximum 10 tags</p>}
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 && !showCreateOption ? (
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
            {/* Inline "Create new tag" option */}
            {showCreateOption && (
              <li>
                <button
                  type="button"
                  disabled={isCreating}
                  onClick={handleCreate}
                  className={[
                    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm",
                    "border-t border-border text-primary",
                    "hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none",
                    "disabled:pointer-events-none disabled:opacity-50",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {isCreating ? <Spinner size="sm" /> : <Plus size={13} className="shrink-0" />}
                  <span>Create &ldquo;{trimmedSearch}&rdquo;</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
