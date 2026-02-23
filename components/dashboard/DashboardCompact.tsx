"use client";

/**
 * DashboardCompact — свёрнутый sticky-бар, видимый при скролле мимо DashboardWidget.
 *
 * ПОЧЕМУ "use client": управляем видимостью через IntersectionObserver.
 * Пропс widgetRef указывает на DashboardWidget — при выходе из вьюпорта
 * показываем compact-бар с кратким итогом недели.
 */

import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { formatDurationShort } from "@/lib/utils/time-format";

interface DashboardCompactProps {
  totalSeconds: number;
  weekLabel: string;
  widgetRef: RefObject<HTMLElement | null>;
}

export function DashboardCompact({ totalSeconds, weekLabel, widgetRef }: DashboardCompactProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = widgetRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          // Показываем compact только когда widget НЕ пересекает вьюпорт
          setVisible(!entry.isIntersecting);
        }
      },
      { threshold: 0, rootMargin: "-56px 0px 0px 0px" } // учитываем высоту хедера
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [widgetRef]);

  if (!visible) return null;

  return (
    <div className="animate-in fade-in slide-in-from-top-1 duration-normal sticky top-[57px] z-30 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-1.5 backdrop-blur-sm">
      <span className="text-xs text-text-2">{weekLabel}</span>
      <span className="text-sm font-semibold text-text-1 tabular-nums">
        {formatDurationShort(totalSeconds)}{" "}
        <span className="text-xs font-normal text-text-3">this week</span>
      </span>
    </div>
  );
}
