"use client";

/**
 * TimerDisplay — тикающий счётчик hh:mm:ss.
 * Читает elapsedSeconds из timer-store.
 * Вызывает tick() каждую секунду через setInterval.
 * Поддерживает > 24ч: показывает 25:23:45, не переходит в дни.
 */

import { useEffect } from "react";
import { useTimerStore } from "@/lib/stores/timer-store";
import { formatDuration } from "@/lib/utils/time-format";

export function TimerDisplay() {
  const elapsedSeconds = useTimerStore((s) => s.elapsedSeconds);
  const activeEntry = useTimerStore((s) => s.activeEntry);
  const tick = useTimerStore((s) => s.tick);

  useEffect(() => {
    if (!activeEntry) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeEntry, tick]);

  return (
    <span className="timer-display text-text-1 tabular-nums" aria-live="off">
      {formatDuration(elapsedSeconds)}
    </span>
  );
}
