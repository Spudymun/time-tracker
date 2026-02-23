"use client";

/**
 * PeriodSelector — выбор периода для отчёта.
 * Пресеты: Today, This Week, This Month.
 * Custom: два поля даты (from, to). `to` не может быть раньше `from`.
 */

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils/date-utils";

type Preset = "today" | "week" | "month" | "custom";

interface PeriodSelectorProps {
  from: Date;
  to: Date;
  onChange: (period: { from: Date; to: Date }) => void;
}

function getPresetRange(preset: Exclude<Preset, "custom">): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (preset === "today") {
    return { from: today, to: today };
  }

  if (preset === "week") {
    const day = today.getDay(); // 0=Sun, 1=Mon
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { from: monday, to: sunday };
  }

  // month
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { from: firstDay, to: lastDay };
}

function detectPreset(from: Date, to: Date): Preset {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = formatDate(today);

  if (formatDate(from) === todayStr && formatDate(to) === todayStr) return "today";

  const weekRange = getPresetRange("week");
  if (
    formatDate(from) === formatDate(weekRange.from) &&
    formatDate(to) === formatDate(weekRange.to)
  )
    return "week";

  const monthRange = getPresetRange("month");
  if (
    formatDate(from) === formatDate(monthRange.from) &&
    formatDate(to) === formatDate(monthRange.to)
  )
    return "month";

  return "custom";
}

export function PeriodSelector({ from, to, onChange }: PeriodSelectorProps) {
  const activePreset = detectPreset(from, to);

  // Локальные строки для custom inputs
  const [customFrom, setCustomFrom] = useState<string>(formatDate(from));
  const [customTo, setCustomTo] = useState<string>(formatDate(to));

  function handlePreset(preset: Exclude<Preset, "custom">) {
    const range = getPresetRange(preset);
    setCustomFrom(formatDate(range.from));
    setCustomTo(formatDate(range.to));
    onChange(range);
  }

  function handleCustomFrom(value: string) {
    setCustomFrom(value);
    if (!value) return;
    const newFrom = new Date(value + "T00:00:00");
    if (isNaN(newFrom.getTime())) return;
    // to не может быть раньше from
    const currentTo = new Date(customTo + "T00:00:00");
    const newTo = !isNaN(currentTo.getTime()) && currentTo >= newFrom ? currentTo : newFrom;
    setCustomTo(formatDate(newTo));
    onChange({ from: newFrom, to: newTo });
  }

  function handleCustomTo(value: string) {
    setCustomTo(value);
    if (!value) return;
    const newTo = new Date(value + "T00:00:00");
    if (isNaN(newTo.getTime())) return;
    const currentFrom = new Date(customFrom + "T00:00:00");
    if (!isNaN(currentFrom.getTime()) && newTo >= currentFrom) {
      onChange({ from: currentFrom, to: newTo });
    }
  }

  const presets: { label: string; value: Exclude<Preset, "custom"> }[] = [
    { label: "Today", value: "today" },
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((p) => (
        <Button
          key={p.value}
          variant={activePreset === p.value ? "primary" : "secondary"}
          size="sm"
          onClick={() => handlePreset(p.value)}
        >
          {p.label}
        </Button>
      ))}

      <Button
        variant={activePreset === "custom" ? "primary" : "secondary"}
        size="sm"
        onClick={() => {
          // При переключении на custom — не меняем даты, просто показываем инпуты
          setCustomFrom(formatDate(from));
          setCustomTo(formatDate(to));
        }}
      >
        Custom
      </Button>

      {/* Custom date inputs — отображаются всегда в custom режиме */}
      {activePreset === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => handleCustomFrom(e.target.value)}
            className="h-8 rounded-md border border-border bg-surface px-2 text-sm text-text-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            aria-label="From date"
          />
          <span className="text-sm text-text-3">—</span>
          <input
            type="date"
            value={customTo}
            min={customFrom}
            onChange={(e) => handleCustomTo(e.target.value)}
            className="h-8 rounded-md border border-border bg-surface px-2 text-sm text-text-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            aria-label="To date"
          />
        </div>
      )}
    </div>
  );
}
