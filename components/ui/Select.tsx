"use client";

/**
 * Select — базовый select дизайн-системы.
 * ЗАПРЕЩЕНО создавать <select> вне этого компонента.
 * Поддерживает label, error, placeholder, forwardRef.
 */

import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder,
      label,
      error,
      className = "",
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId ?? generatedId;

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-text-2">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            {...props}
            className={[
              "w-full appearance-none rounded-md border px-3 py-2 pr-8 text-sm text-text-1",
              "bg-bg",
              "transition-[border-color,box-shadow] duration-150",
              "focus-visible:ring-2 focus-visible:outline-none",
              error
                ? "border-error focus-visible:ring-error"
                : "border-border focus-visible:ring-primary",
              "disabled:cursor-not-allowed disabled:opacity-50",
              // Показываем text-text-3 когда выбран placeholder (пустое значение)
              !value ? "text-text-3" : "text-text-1",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Иконка шеврона — pointer-events-none, не мешает клику */}
          <ChevronDown
            size={16}
            className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-text-3"
            aria-hidden="true"
          />
        </div>
        {error && <p className="mt-0.5 text-xs text-error">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
