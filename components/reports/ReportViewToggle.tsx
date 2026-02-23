"use client";

/**
 * ReportViewToggle — переключатель вида отчёта: By Projects | By Tags.
 */

type ViewMode = "projects" | "tags";

interface ReportViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ReportViewToggle({ value, onChange }: ReportViewToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Report view"
      className="inline-flex rounded-lg border border-border bg-surface p-0.5"
    >
      {(["projects", "tags"] as ViewMode[]).map((mode) => (
        <button
          key={mode}
          role="tab"
          aria-selected={value === mode}
          onClick={() => onChange(mode)}
          className={[
            "rounded-md px-4 py-1.5 text-sm font-medium transition-colors duration-150",
            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
            value === mode
              ? "bg-primary text-primary-fg shadow-sm"
              : "text-text-2 hover:bg-surface-2 hover:text-text-1",
          ].join(" ")}
        >
          {mode === "projects" ? "By Projects" : "By Tags"}
        </button>
      ))}
    </div>
  );
}
