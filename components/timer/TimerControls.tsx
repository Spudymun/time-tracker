"use client";

/**
 * TimerControls — кнопка Start/Stop для таймера.
 * «Start» (зелёная) в idle-состоянии, «Stop» (красная) когда таймер активен.
 * Показывает Spinner во время загрузки.
 */

import { useTimerStore } from "@/lib/stores/timer-store";
import { Button } from "@/components/ui/Button";

interface TimerControlsProps {
  onStart: () => void; // делегируем в TimerBar — там собирается input
}

export function TimerControls({ onStart }: TimerControlsProps) {
  const activeEntry = useTimerStore((s) => s.activeEntry);
  const isLoading = useTimerStore((s) => s.isLoading);
  const stopTimer = useTimerStore((s) => s.stopTimer);

  const isRunning = activeEntry !== null;

  async function handleStop() {
    await stopTimer();
  }

  if (isRunning) {
    return (
      <Button
        variant="danger"
        size="md"
        loading={isLoading}
        onClick={handleStop}
        aria-label="Stop timer"
      >
        Stop
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      size="md"
      loading={isLoading}
      onClick={onStart}
      aria-label="Start timer"
      className="bg-success text-primary-fg hover:opacity-90 focus-visible:ring-success"
    >
      Start
    </Button>
  );
}
