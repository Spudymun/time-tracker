"use client";

/**
 * BillableToggle — чекбокс с иконкой "$" для пометки billable-записей.
 * Используется в TimerBar и EntryItem (edit mode).
 */

import { DollarSign } from "lucide-react";

interface BillableToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function BillableToggle({ checked, onChange, disabled = false }: BillableToggleProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label="Billable"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      title={checked ? "Billable" : "Not billable"}
      className={[
        "flex h-8 w-8 items-center justify-center rounded-md border transition-colors duration-150",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        checked
          ? "border-primary bg-primary text-primary-fg"
          : "border-border bg-surface text-text-3 hover:border-primary hover:text-primary",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <DollarSign size={14} aria-hidden="true" />
    </button>
  );
}
