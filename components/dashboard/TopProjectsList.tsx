/**
 * TopProjectsList — упорядоченный список топ-5 проектов за выбранную неделю.
 *
 * Серверный компонент (данные приходят через props от DashboardWidget).
 * Показывает: цветной swatch + название + часы (+ заработок если есть ставка).
 * Mini progress bar — относительно #1 проекта.
 */

import type { DashboardTopProject } from "@/lib/services/report-service";
import { formatDurationShort } from "@/lib/utils/time-format";

interface TopProjectsListProps {
  topProjects: DashboardTopProject[];
}

export function TopProjectsList({ topProjects }: TopProjectsListProps) {
  if (topProjects.length === 0) return null;

  const maxSeconds = topProjects[0]?.totalSeconds ?? 0;
  const showEarnings = topProjects.some((p) => p.earnings !== null);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium tracking-wide text-text-3 uppercase">Top Projects</p>

      <ul className="flex flex-col gap-2.5">
        {topProjects.map((project, index) => {
          const progressPct = maxSeconds > 0 ? (project.totalSeconds / maxSeconds) * 100 : 0;
          const hours = formatDurationShort(project.totalSeconds);
          const projectColor = project.color ?? "#94a3b8";
          const projectName = project.projectName ?? "No project";

          return (
            <li key={project.projectId ?? `no-project-${index}`}>
              <div className="mb-1 flex items-center gap-2">
                {/* Color swatch */}
                <span
                  className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                  style={{ backgroundColor: projectColor }}
                />
                {/* Name */}
                <span className="flex-1 truncate text-sm text-text-1">{projectName}</span>
                {/* Hours */}
                <span className="text-sm font-medium text-text-1 tabular-nums">{hours}</span>
                {/* Earnings (optional) */}
                {showEarnings && (
                  <span className="w-16 text-right text-xs text-text-2 tabular-nums">
                    {project.earnings !== null
                      ? "$" +
                        project.earnings.toLocaleString("en-US", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })
                      : ""}
                  </span>
                )}
              </div>
              {/* Mini progress bar */}
              <div className="h-1 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="duration-slow h-full rounded-full transition-all"
                  style={{
                    width: `${progressPct}%`,
                    backgroundColor: projectColor,
                    opacity: 0.8,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
