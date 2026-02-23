"use client";

/**
 * Button — базовая кнопка дизайн-системы.
 * ЗАПРЕЩЕНО создавать <button> вне этого компонента (кроме OAuthButton).
 * Все интерактивные состояния: hover, focus-visible, disabled, active.
 */

import { Spinner } from "./Spinner";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-fg hover:bg-primary-hover focus-visible:ring-primary",
  secondary: "bg-surface-2 text-text-1 hover:bg-surface-3 focus-visible:ring-primary",
  danger: "bg-error text-primary-fg hover:opacity-90 focus-visible:ring-error",
  ghost: "text-text-2 hover:bg-surface-2 hover:text-text-1 focus-visible:ring-primary",
  outline: "border border-border text-text-1 hover:bg-surface-2 focus-visible:ring-primary",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-6 text-base gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center rounded-md font-medium",
        "transition-[color,background-color,border-color,opacity,box-shadow,transform] duration-150",
        "focus-visible:ring-2 focus-visible:outline-none",
        "active:scale-95",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
