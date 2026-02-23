"use client";

/**
 * TaskAutocomplete — поле ввода описания задачи с dropdown-подсказками.
 * Дебаунс 300ms на запрос /api/task-names?q=
 * Клавиатурная навигация: стрелки вверх/вниз + Enter.
 * Очищается при остановке таймера (controlled через value/onChange).
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface TaskAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TaskAutocomplete({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "What are you working on?",
}: TaskAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Закрываем по клику вне
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    try {
      const res = await fetch(`/api/task-names?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data: string[] = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
      setActiveIndex(-1);
    } catch {
      // Молча игнорируем ошибки автодополнения
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    onChange(newValue);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(newValue), 300);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter") onSubmit?.();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) {
        const chosen = suggestions[activeIndex];
        if (chosen !== undefined) {
          onChange(chosen);
          setOpen(false);
          setActiveIndex(-1);
        }
      } else {
        onSubmit?.();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  function selectSuggestion(text: string) {
    onChange(text);
    setOpen(false);
    setActiveIndex(-1);
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        className={[
          "h-8 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-1",
          "transition-colors duration-150 placeholder:text-text-3",
          "focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
        ].join(" ")}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute top-9 left-0 z-50 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-surface shadow-lg">
          {suggestions.map((suggestion, index) => (
            <li key={suggestion}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()} // предотвращаем blur инпута
                onClick={() => selectSuggestion(suggestion)}
                className={[
                  "w-full truncate px-3 py-2 text-left text-sm",
                  "focus-visible:bg-surface-2 focus-visible:outline-none",
                  index === activeIndex
                    ? "bg-surface-2 text-text-1"
                    : "text-text-2 hover:bg-surface-2",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
