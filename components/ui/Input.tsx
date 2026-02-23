"use client";

/**
 * Input — базовый text input дизайн-системы.
 * Поддерживает label, error, hint через forward ref.
 * ЗАПРЕЩЕНО создавать <input> вне этого компонента.
 */

import { forwardRef, useId } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id: providedId, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId ?? generatedId;

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-text-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          {...props}
          className={[
            "w-full rounded-md border px-3 py-2 text-sm text-text-1",
            "bg-bg placeholder:text-text-3",
            "transition-[border-color,box-shadow] duration-150",
            "focus-visible:ring-2 focus-visible:outline-none",
            error
              ? "border-error focus-visible:ring-error"
              : "border-border focus-visible:ring-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        />
        {error && <p className="mt-0.5 text-xs text-error">{error}</p>}
        {hint && !error && <p className="mt-0.5 text-xs text-text-3">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
