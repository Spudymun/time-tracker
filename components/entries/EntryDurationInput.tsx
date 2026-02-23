"use client";

/**
 * EntryDurationInput — inline-инпут для ввода длительности в формате hh:mm.
 * Допустимый диапазон: 00:01 – 99:59.
 * При потере фокуса или нажатии Enter — вызывает onConfirm с durationSeconds.
 * При невалидном вводе — показывает inline-ошибку.
 */

import { useState, useRef, useEffect } from "react";
import { parseDurationInput } from "@/lib/utils/time-format";

interface EntryDurationInputProps {
  /** Текущая длительность в секундах */
  durationSeconds: number;
  onConfirm: (durationSeconds: number) => void;
  onCancel?: () => void;
  disabled?: boolean;
  /** Фокусировать инпут при монтировании. По умолчанию false — чтобы не перехватывать
   * фокус у других полей формы (например, поля описания в EntryItem). */
  autoFocus?: boolean;
}

/**
 * Форматирует секунды в строку "hh:mm" для отображения в инпуте.
 */
function formatForInput(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function EntryDurationInput({
  durationSeconds,
  onConfirm,
  onCancel,
  disabled = false,
  autoFocus = false,
}: EntryDurationInputProps) {
  const [value, setValue] = useState(() => formatForInput(durationSeconds));
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Обновляем value если проп изменился снаружи
  useEffect(() => {
    setValue(formatForInput(durationSeconds));
  }, [durationSeconds]);

  // Фокусируем только если явно запрошено — не перехватываем фокус у других полей формы
  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [autoFocus]);

  function tryConfirm() {
    if (value === formatForInput(durationSeconds)) {
      // Значение не изменилось — просто отменяем
      onCancel?.();
      return;
    }
    const parsed = parseDurationInput(value);
    if (parsed === null) {
      setError("Format: hh:mm, range 00:01–99:59");
      return;
    }
    if (parsed < 60) {
      setError("Minimum 1 minute");
      return;
    }
    setError(null);
    onConfirm(parsed);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      tryConfirm();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setError(null);
      setValue(formatForInput(durationSeconds));
      onCancel?.();
    }
  }

  return (
    <div className="flex flex-col gap-0.5">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        onBlur={tryConfirm}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="0:00"
        className={[
          "w-16 rounded border px-1.5 py-0.5 text-center text-sm font-medium tabular-nums",
          "bg-surface text-text-1 transition-colors duration-150",
          "focus:ring-2 focus:ring-primary focus:outline-none",
          "disabled:pointer-events-none disabled:opacity-50",
          error ? "border-danger text-danger" : "border-border",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={!!error}
        aria-describedby={error ? "duration-error" : undefined}
      />
      {error && (
        <p id="duration-error" className="text-danger text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
