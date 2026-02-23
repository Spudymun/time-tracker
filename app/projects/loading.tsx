/**
 * app/projects/loading.tsx — скелетон для страницы проектов.
 */
export default function ProjectsLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pt-6">
      {/* "New project" button placeholder */}
      <div className="flex justify-end">
        <div className="h-9 w-32 animate-pulse rounded-lg bg-surface-2" />
      </div>

      {/* Project item skeletons */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-3 rounded-lg border border-border bg-surface p-4"
        >
          {/* color dot */}
          <div className="h-4 w-4 rounded-full bg-surface-2" />
          {/* name */}
          <div className="h-4 flex-1 rounded bg-surface-2" />
          {/* stats */}
          <div className="h-4 w-12 rounded bg-surface-2" />
          {/* actions */}
          <div className="h-4 w-16 rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}
