"use client";

/**
 * Toast — глобальная система уведомлений.
 * Используй useToast() hook для показа тостов.
 * Auto-dismiss: 3с (success/info/warning), 5с (error).
 * Макс. 3 одновременных; позиция: правый нижний угол.
 *
 * Добавить ToastProvider в app/layout.tsx.
 */

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
  };
}

// ── Context ────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ── Hook ───────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return ctx;
}

// ── Toast item styles ──────────────────────────────────────────────────────

const toastConfig: Record<ToastType, { icon: React.ReactNode; base: string }> = {
  success: {
    icon: <CheckCircle2 size={18} className="shrink-0 text-success" />,
    base: "bg-surface border-success/30",
  },
  error: {
    icon: <XCircle size={18} className="shrink-0 text-error" />,
    base: "bg-surface border-error/30",
  },
  info: {
    icon: <Info size={18} className="shrink-0 text-info" />,
    base: "bg-surface border-info/30",
  },
  warning: {
    icon: <AlertTriangle size={18} className="shrink-0 text-warning" />,
    base: "bg-surface border-warning/30",
  },
};

// ── ToastProvider ──────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string) => {
      const id = crypto.randomUUID();
      const duration = type === "error" ? 5000 : 3000;

      setToasts((prev) => {
        // Макс. 3 одновременных — убираем самый старый если нужно
        const next = prev.length >= 3 ? prev.slice(1) : prev;
        return [...next, { id, type, message }];
      });

      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const toast: ToastContextValue["toast"] = {
    success: (msg) => addToast("success", msg),
    error: (msg) => addToast("error", msg),
    info: (msg) => addToast("info", msg),
    warning: (msg) => addToast("warning", msg),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed right-4 bottom-4 z-[100] flex w-80 flex-col gap-2"
      >
        {toasts.map((t) => {
          const { icon, base } = toastConfig[t.type];
          return (
            <div
              key={t.id}
              role="alert"
              className={`animate-toast-in flex items-start gap-3 rounded-lg border px-4 py-3 text-sm text-text-1 shadow-md ${base}`}
            >
              {icon}
              <span className="flex-1 leading-5">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded p-0.5 text-text-3 transition-colors hover:text-text-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                aria-label="Закрыть уведомление"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
