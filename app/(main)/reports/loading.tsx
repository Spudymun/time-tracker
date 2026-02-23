/**
 * app/reports/loading.tsx — скелетон для страницы отчётов.
 */
export default function ReportsLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pt-6">
      {/* Period selector placeholder */}
      <div className="flex animate-pulse gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-lg bg-surface-2" />
        ))}
        <div className="ml-auto h-9 w-32 rounded-lg bg-surface-2" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {/* Header */}
        <div className="flex animate-pulse gap-4 border-b border-border p-4">
          <div className="h-4 flex-1 rounded bg-surface-2" />
          <div className="h-4 w-20 rounded bg-surface-2" />
          <div className="h-4 w-20 rounded bg-surface-2" />
          <div className="h-4 w-16 rounded bg-surface-2" />
        </div>
        {/* Rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex animate-pulse items-center gap-4 border-b border-border-subtle p-4 last:border-0"
          >
            <div className="h-3 w-3 rounded-full bg-surface-2" />
            <div className="h-4 flex-1 rounded bg-surface-2" />
            <div className="h-4 w-20 rounded bg-surface-2" />
            <div className="h-4 w-20 rounded bg-surface-2" />
            <div className="h-4 w-12 rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
