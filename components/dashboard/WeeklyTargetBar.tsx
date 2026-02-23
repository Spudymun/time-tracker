"use client";

/**
 * WeeklyTargetBar — полоса прогресса к недельной цели.
 *
 * ПОЧЕМУ "use client": использует localStorage и useEffect (hydration safety).
 * Цель хранится в localStorage по ключу 'weeklyTargetHours'.
 * Компонент скрыт если цель не задана.
 *
 * Цвета прогресса:
 *   0–79%    → зелёный (success)
 *   80–99%   → жёлто-оранжевый (warning)
 *   ≥100%    → синий (info) — переработка
 */

import { useState, useEffect, useRef } from "react";
import { formatDurationShort } from "@/lib/utils/time-format";

const STORAGE_KEY = "weeklyTargetHours";

interface WeeklyTargetBarProps {
  totalSeconds: number;
}

export function WeeklyTargetBar({ totalSeconds }: WeeklyTargetBarProps) {
  const [targetHours, setTargetHours] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Читаем из localStorage только после монтирования (избегаем hydration mismatch)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed) && parsed > 0) {
        setTargetHours(parsed);
        setInputValue(String(parsed));
      }
    }
  }, []);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  if (targetHours === null && !editing) {
    // Показываем кнопку "Set weekly goal" вместо прогресс-бара
    return (
      <button
        type="button"
        className="duration-fast rounded-sm px-1 text-xs text-text-3 transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        onClick={() => setEditing(true)}
      >
        {"+ Set weekly goal"}
      </button>
    );
  }

  if (editing) {
    return (
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const parsed = parseFloat(inputValue);
          if (!isNaN(parsed) && parsed > 0) {
            setTargetHours(parsed);
            localStorage.setItem(STORAGE_KEY, String(parsed));
          }
          setEditing(false);
        }}
      >
        <span className="text-xs text-text-2">Weekly goal:</span>
        <input
          ref={inputRef}
          type="number"
          min="1"
          max="168"
          step="0.5"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={() => {
            const parsed = parseFloat(inputValue);
            if (!isNaN(parsed) && parsed > 0) {
              setTargetHours(parsed);
              localStorage.setItem(STORAGE_KEY, String(parsed));
            }
            setEditing(false);
          }}
          className="w-16 rounded-sm border border-border bg-surface px-1.5 py-0.5 text-xs text-text-1 tabular-nums focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        />
        <span className="text-xs text-text-2">h</span>
      </form>
    );
  }

  // targetHours гарантированно не null здесь — ранние возвраты покрывают null-случай
  const resolvedTargetHours = targetHours ?? 0;
  const targetSeconds = resolvedTargetHours * 3600;
  const pct = targetSeconds > 0 ? Math.min((totalSeconds / targetSeconds) * 100, 100) : 0;
  const overTarget = totalSeconds >= targetSeconds;

  let barColorClass = "bg-success";
  if (overTarget) {
    barColorClass = "bg-info";
  } else if (pct >= 80) {
    barColorClass = "bg-warning";
  }

  const label = `${formatDurationShort(totalSeconds)} / ${resolvedTargetHours}h (${Math.round((totalSeconds / targetSeconds) * 100)}%)`;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span
          className="duration-fast cursor-pointer text-xs text-text-2 transition-colors hover:text-primary"
          onClick={() => setEditing(true)}
          title="Click to edit weekly goal"
        >
          {label}
        </span>
        <button
          type="button"
          className="duration-fast rounded-sm text-xs text-text-3 transition-colors hover:text-error focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          onClick={() => {
            setTargetHours(null);
            setInputValue("");
            localStorage.removeItem(STORAGE_KEY);
          }}
          title="Remove weekly goal"
        >
          ✕
        </button>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={`duration-slow h-full rounded-full transition-all ${barColorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
