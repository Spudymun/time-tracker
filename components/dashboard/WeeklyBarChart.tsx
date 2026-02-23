"use client";

/**
 * WeeklyBarChart — Recharts stacked BarChart для дашборда.
 *
 * ПОЧЕМУ "use client": Recharts требует браузерного DOM и ResizeObserver
 * для ResponsiveContainer. Данные передаются через props от DashboardWidget.
 */

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  type TooltipProps,
} from "recharts";
import type { DashboardDay } from "@/lib/services/report-service";

interface WeeklyBarChartProps {
  byDay: DashboardDay[];
}

interface ChartRow {
  day: string;
  date: string;
  total: number;
  projects: Array<{ key: string; name: string; color: string; hours: number }>;
  [key: string]: unknown;
}

const NO_PROJECT_COLOR = "#94a3b8";

/**
 * Подготавливает данные из DashboardDay[] в формат для Recharts stacked bar.
 * Каждый проект становится отдельным ключом в объекте строки.
 */
function buildChartData(byDay: DashboardDay[]) {
  // Собираем все уникальные projectKey-и через все дни
  const projectSet = new Map<string, { name: string; color: string }>();

  for (const day of byDay) {
    for (const p of day.byProject) {
      const key = p.projectId ?? "__no_project__";
      if (!projectSet.has(key)) {
        projectSet.set(key, {
          name: p.projectName ?? "No project",
          color: p.color ?? NO_PROJECT_COLOR,
        });
      }
    }
  }

  const projectKeys = Array.from(projectSet.keys());

  const rows: ChartRow[] = byDay.map((day) => {
    const row: ChartRow = {
      day: day.dayLabel,
      date: day.date,
      total: day.totalSeconds / 3600,
      projects: [],
    };

    // Инициализируем нули для каждого проекта
    for (const key of projectKeys) {
      row[key] = 0;
    }

    // Заполняем реальными значениями
    for (const p of day.byProject) {
      const key = p.projectId ?? "__no_project__";
      row[key] = (row[key] as number) + p.seconds / 3600;
    }

    return row;
  });

  return { rows, projectKeys, projectSet };
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const filtered = payload.filter((p) => (p.value as number) > 0);
  if (!filtered.length) return null;

  return (
    <div className="min-w-[140px] rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium text-text-2">{label}</p>
      {filtered.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-text-1">
          <span
            className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="flex-1">{entry.name}</span>
          <span className="font-medium">{((entry.value as number) ?? 0).toFixed(1)}h</span>
        </div>
      ))}
    </div>
  );
}

export function WeeklyBarChart({ byDay }: WeeklyBarChartProps) {
  const { rows, projectKeys, projectSet } = buildChartData(byDay);

  const hasData = rows.some((r) => r.total > 0);

  return (
    <div className="h-[160px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "var(--color-text-2)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--color-text-3)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => (v === 0 ? "" : `${v}h`)}
            width={30}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "var(--color-surface-2)", radius: 4 }}
          />
          {hasData &&
            projectKeys.map((key) => {
              const meta = projectSet.get(key);
              if (!meta) return null;
              return (
                <Bar
                  key={key}
                  dataKey={key}
                  name={meta.name}
                  stackId="stack"
                  fill={meta.color}
                  radius={key === projectKeys[projectKeys.length - 1] ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  maxBarSize={40}
                >
                  {rows.map((row) => (
                    <Cell key={row.date} fill={meta.color} />
                  ))}
                </Bar>
              );
            })}
          {!hasData &&
            rows.map((row) => (
              <Bar
                key={row.date}
                dataKey="total"
                stackId="stack"
                fill="var(--color-surface-3)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
