"use client";

/**
 * ColorPicker — выбор цвета через preset-свотчи + custom HEX input.
 * Валидирует HEX на blur: /^#[0-9A-Fa-f]{6}$/
 */

import { useState } from "react";

const PRESET_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#64748b", // slate
  "#1f2937", // dark
] as const;

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const isPreset = PRESET_COLORS.includes(value as (typeof PRESET_COLORS)[number]);
  const [customInput, setCustomInput] = useState(isPreset ? "" : value);
  const [hexError, setHexError] = useState<string | null>(null);

  const handlePresetClick = (color: string) => {
    setCustomInput("");
    setHexError(null);
    onChange(color);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setCustomInput(raw);
    setHexError(null);

    // Добавляем # если пользователь не ввёл
    const normalized = raw.startsWith("#") ? raw : `#${raw}`;
    if (HEX_REGEX.test(normalized)) {
      onChange(normalized.toUpperCase());
    }
  };

  const handleCustomBlur = () => {
    if (!customInput) return;
    const normalized = customInput.startsWith("#") ? customInput : `#${customInput}`;
    if (!HEX_REGEX.test(normalized)) {
      setHexError("Invalid HEX format (#RRGGBB)");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Preset grid */}
      <div className="grid grid-cols-6 gap-1.5">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            title={color}
            onClick={() => handlePresetClick(color)}
            className={[
              "h-6 w-6 rounded-full transition-[transform,box-shadow] duration-150",
              "hover:scale-110 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
              "active:scale-95",
              value === color ? "ring-2 ring-primary ring-offset-2 ring-offset-surface" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ backgroundColor: color }}
            aria-label={color}
            aria-pressed={value === color}
          />
        ))}
      </div>

      {/* Custom HEX input */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div
            className="h-6 w-6 shrink-0 rounded-full border border-border"
            style={{ backgroundColor: value }}
          />
          <input
            type="text"
            value={customInput}
            onChange={handleCustomChange}
            onBlur={handleCustomBlur}
            placeholder="#RRGGBB"
            maxLength={7}
            className={[
              "w-full rounded-md border px-2 py-1 font-mono text-xs text-text-1",
              "bg-bg placeholder:text-text-3",
              "transition-[border-color,box-shadow] duration-150",
              "focus-visible:ring-2 focus-visible:outline-none",
              hexError
                ? "border-error focus-visible:ring-error"
                : "border-border focus-visible:ring-primary",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label="Custom HEX color"
          />
        </div>
        {hexError && <p className="text-xs text-error">{hexError}</p>}
      </div>
    </div>
  );
}
