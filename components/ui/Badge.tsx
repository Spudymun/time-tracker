"use client";

/**
 * Badge — статусный бейдж.
 * Shape: rounded-full px-2 py-0.5 text-xs font-medium (pill).
 */

type BadgeVariant = "default" | "archived" | "billable" | "success" | "warning" | "error" | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface-2 text-text-2",
  archived: "bg-surface-3 text-text-3",
  billable: "bg-success-bg text-success-fg",
  success: "bg-success-bg text-success-fg",
  warning: "bg-warning-bg text-warning-fg",
  error: "bg-error-bg text-error-fg",
  info: "bg-info-bg text-info-fg",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
