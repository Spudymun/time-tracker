/**
 * ProjectEstimateBar — прогресс-бар бюджета времени проекта.
 * Скрыт если estimateProgress null.
 *
 * Цвета:
 *   0–0.79   → green
 *   0.80–0.99 → yellow
 *   ≥1.0     → red
 *
 * Лейбл: "Xh / Yh (ZZ%)"
 */

interface ProjectEstimateBarProps {
  estimateProgress: number | null;
  totalSeconds: number;
  estimatedHours: number;
}

export function ProjectEstimateBar({
  estimateProgress,
  totalSeconds,
  estimatedHours,
}: ProjectEstimateBarProps) {
  if (estimateProgress === null) return null;

  const pct = Math.min(estimateProgress, 1);
  const displayPct = Math.round(estimateProgress * 100);

  const loggedH = (totalSeconds / 3600).toFixed(1);
  const label = `${loggedH}h / ${estimatedHours}h (${displayPct}%)`;

  let barColor: string;
  let textColor: string;
  if (estimateProgress >= 1.0) {
    barColor = "bg-error";
    textColor = "text-error";
  } else if (estimateProgress >= 0.8) {
    barColor = "bg-warning";
    textColor = "text-warning";
  } else {
    barColor = "bg-success";
    textColor = "text-success";
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${barColor}`}
          style={{ width: `${pct * 100}%` }}
          role="progressbar"
          aria-valuenow={displayPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
      <span className={`text-xs ${textColor}`}>{label}</span>
    </div>
  );
}
