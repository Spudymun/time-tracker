/**
 * WeeklySummary — блок с итогами за неделю.
 *
 * Показывает: Total: Xh Ym / Billable: Xh Ym
 * Если totalEarnings !== null — дополнительную строку "Earned: $X,XXX"
 */

import { formatDurationShort } from "@/lib/utils/time-format";

interface WeeklySummaryProps {
  totalSeconds: number;
  billableSeconds: number;
  totalEarnings: number | null;
}

export function WeeklySummary({
  totalSeconds,
  billableSeconds,
  totalEarnings,
}: WeeklySummaryProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="w-14 text-xs text-text-2">Total</span>
        <span className="text-sm font-semibold text-text-1 tabular-nums">
          {formatDurationShort(totalSeconds)}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-14 text-xs text-text-2">Billable</span>
        <span className="text-sm font-medium text-text-1 tabular-nums">
          {formatDurationShort(billableSeconds)}
        </span>
      </div>
      {totalEarnings !== null && (
        <div className="flex items-center gap-1.5">
          <span className="w-14 text-xs text-text-2">Earned</span>
          <span className="text-sm font-semibold text-success tabular-nums">
            $
            {totalEarnings.toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </span>
        </div>
      )}
    </div>
  );
}
