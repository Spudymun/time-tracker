/**
 * app/(main)/loading.tsx — скелетон для главной страницы.
 * Показывается при навигации на "/" пока грузятся Server Components.
 */
export default function MainLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pt-6">
      {/* DashboardWidget skeleton */}
      <div className="h-[280px] animate-pulse rounded-lg bg-surface-2" />

      {/* Entries skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex animate-pulse items-center gap-3 rounded-lg bg-surface p-4">
            <div className="h-3 w-3 rounded-full bg-surface-2" />
            <div className="h-4 flex-1 rounded bg-surface-2" />
            <div className="h-4 w-16 rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
