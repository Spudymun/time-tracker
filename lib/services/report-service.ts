/**
 * Report Service — бизнес-логика агрегации данных для отчётов и дашборда.
 *
 * ПОЧЕМУ здесь: все вычисления — чистые функции без side-effects.
 * Не зависят от Prisma или HTTP-контекста — только типы из репозитория.
 */

import type { TimeEntryWithRelations } from "@/lib/db/time-entries-repository";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProjectReportItem {
  projectId: string | null;
  projectName: string | null;
  color: string | null;
  isArchived: boolean;
  totalSeconds: number;
  billableSeconds: number;
  entryCount: number;
  /** Процент от totalSeconds отчёта. 2 decimal places. */
  percentage: number;
  /** billableSeconds / 3600 * hourlyRate; null если нет ставки. */
  earnings: number | null;
}

export interface TagReportItem {
  tagId: string | null;
  tagName: string | null;
  color: string | null;
  totalSeconds: number;
  billableSeconds: number;
  entryCount: number;
  percentage: number;
}

export interface ReportData {
  from: string; // YYYY-MM-DD
  to: string;
  totalSeconds: number;
  billableSeconds: number;
  /** Сумма earnings по всем проектам; null если ни у одного нет hourlyRate. */
  totalEarnings: number | null;
  byProject: ProjectReportItem[];
}

export interface DashboardDayProject {
  projectId: string | null;
  projectName: string | null;
  color: string;
  seconds: number;
}

export interface DashboardDay {
  date: string; // YYYY-MM-DD
  dayLabel: string; // Mon, Tue, ...
  totalSeconds: number;
  byProject: DashboardDayProject[];
}

export interface DashboardTopProject {
  projectId: string | null;
  projectName: string | null;
  color: string;
  totalSeconds: number;
  billableSeconds: number;
  earnings: number | null;
}

export interface DashboardData {
  from: string;
  to: string;
  totalSeconds: number;
  billableSeconds: number;
  totalEarnings: number | null;
  byDay: DashboardDay[];
  topProjects: DashboardTopProject[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Возвращает только завершённые записи (stoppedAt != null). */
function getCompleted(entries: TimeEntryWithRelations[]): TimeEntryWithRelations[] {
  return entries.filter((e) => e.stoppedAt !== null && e.durationSeconds !== null);
}

/** Форматирует дату в YYYY-MM-DD по UTC. */
function fmtDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Вычисляет заработок по billable-ставке.
 * @returns null если hourlyRate === null, иначе округлённую до 2 знаков сумму.
 */
export function calcEarnings(billableSeconds: number, hourlyRate: number | null): number | null {
  if (hourlyRate === null || hourlyRate === undefined) return null;
  return Math.round((billableSeconds / 3600) * hourlyRate * 100) / 100;
}

/**
 * Агрегирует завершённые записи по проектам.
 * Используется в GET /api/reports.
 */
export function buildReport(entries: TimeEntryWithRelations[], from: Date, to: Date): ReportData {
  const completed = getCompleted(entries);

  const totalSeconds = completed.reduce((sum, e) => sum + (e.durationSeconds ?? 0), 0);
  const billableSeconds = completed
    .filter((e) => e.billable)
    .reduce((sum, e) => sum + (e.durationSeconds ?? 0), 0);

  // Группировка по projectId
  const projectMap = new Map<
    string | null,
    {
      projectId: string | null;
      projectName: string | null;
      color: string | null;
      isArchived: boolean;
      hourlyRate: number | null;
      totalSeconds: number;
      billableSeconds: number;
      entryCount: number;
    }
  >();

  for (const entry of completed) {
    const key = entry.projectId ?? null;
    if (!projectMap.has(key)) {
      projectMap.set(key, {
        projectId: key,
        projectName: entry.project?.name ?? null,
        color: entry.project?.color ?? null,
        isArchived: entry.project?.isArchived ?? false,
        hourlyRate: entry.project?.hourlyRate ?? null,
        totalSeconds: 0,
        billableSeconds: 0,
        entryCount: 0,
      });
    }
    const group = projectMap.get(key)!;
    group.totalSeconds += entry.durationSeconds ?? 0;
    if (entry.billable) group.billableSeconds += entry.durationSeconds ?? 0;
    group.entryCount++;
  }

  let totalEarnings: number | null = null;

  const byProject: ProjectReportItem[] = Array.from(projectMap.values())
    .sort((a, b) => b.totalSeconds - a.totalSeconds)
    .map((group) => {
      const earnings = calcEarnings(group.billableSeconds, group.hourlyRate);
      if (earnings !== null) {
        totalEarnings = (totalEarnings ?? 0) + earnings;
      }
      return {
        projectId: group.projectId,
        projectName: group.projectName,
        color: group.color,
        isArchived: group.isArchived,
        totalSeconds: group.totalSeconds,
        billableSeconds: group.billableSeconds,
        entryCount: group.entryCount,
        percentage:
          totalSeconds > 0 ? Math.round((group.totalSeconds / totalSeconds) * 10000) / 100 : 0,
        earnings,
      };
    });

  if (totalEarnings !== null) {
    totalEarnings = Math.round(totalEarnings * 100) / 100;
  }

  return {
    from: fmtDate(from),
    to: fmtDate(to),
    totalSeconds,
    billableSeconds,
    totalEarnings,
    byProject,
  };
}

/**
 * Агрегирует завершённые записи по тегам.
 * Одна запись вносит вклад во ВСЕ свои теги.
 * Записи без тегов → группа { tagId: null }.
 */
export function buildTagReport(entries: TimeEntryWithRelations[]): TagReportItem[] {
  const completed = getCompleted(entries);

  const totalSeconds = completed.reduce((sum, e) => sum + (e.durationSeconds ?? 0), 0);

  const tagMap = new Map<
    string | null,
    {
      tagId: string | null;
      tagName: string | null;
      color: string | null;
      totalSeconds: number;
      billableSeconds: number;
      entryCount: number;
    }
  >();

  const ensureTag = (id: string | null, name: string | null, color: string | null) => {
    if (!tagMap.has(id)) {
      tagMap.set(id, {
        tagId: id,
        tagName: name,
        color,
        totalSeconds: 0,
        billableSeconds: 0,
        entryCount: 0,
      });
    }
  };

  for (const entry of completed) {
    const tags = entry.timeEntryTags.map((tet) => tet.tag);

    if (tags.length === 0) {
      ensureTag(null, null, null);
      const group = tagMap.get(null)!;
      group.totalSeconds += entry.durationSeconds ?? 0;
      if (entry.billable) group.billableSeconds += entry.durationSeconds ?? 0;
      group.entryCount++;
    } else {
      for (const tag of tags) {
        ensureTag(tag.id, tag.name, tag.color);
        const group = tagMap.get(tag.id)!;
        group.totalSeconds += entry.durationSeconds ?? 0;
        if (entry.billable) group.billableSeconds += entry.durationSeconds ?? 0;
        group.entryCount++;
      }
    }
  }

  return Array.from(tagMap.values())
    .map((group) => ({
      tagId: group.tagId,
      tagName: group.tagName,
      color: group.color,
      totalSeconds: group.totalSeconds,
      billableSeconds: group.billableSeconds,
      entryCount: group.entryCount,
      percentage:
        totalSeconds > 0 ? Math.round((group.totalSeconds / totalSeconds) * 10000) / 100 : 0,
    }))
    .sort((a, b) => {
      // "No tag" group всегда в конце
      if (a.tagId === null) return 1;
      if (b.tagId === null) return -1;
      return b.totalSeconds - a.totalSeconds;
    });
}

/**
 * Экранирует значение для CSV (RFC 4180).
 * Если значение содержит запятую, кавычку или перенос — оборачивает в кавычки.
 */
function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Генерирует CSV строку из записей.
 * Одна строка = одна TimeEntry (детально, не агрегировано).
 * Возвращает только заголовок если entries пуст.
 */
export function entriesToCsv(entries: TimeEntryWithRelations[]): string {
  const header = "Date,Start,Stop,Duration (h),Project,Description,Tags,Billable";

  const rows = entries.map((entry) => {
    const date = entry.startedAt.toISOString().slice(0, 10);
    const start = entry.startedAt.toISOString().slice(11, 16);
    const stop = entry.stoppedAt ? entry.stoppedAt.toISOString().slice(11, 16) : "";
    const durationH =
      entry.durationSeconds !== null
        ? (Math.round((entry.durationSeconds / 3600) * 100) / 100).toString()
        : "";
    const project = csvEscape(entry.project?.name ?? "");
    const description = csvEscape(entry.description ?? "");
    const tags = csvEscape(entry.timeEntryTags.map((tet) => tet.tag.name).join(","));
    const billable = entry.billable ? "Yes" : "No";

    return `${date},${start},${stop},${durationH},${project},${description},${tags},${billable}`;
  });

  return [header, ...rows].join("\n");
}

/**
 * Строит данные для дашборда.
 * from–to должны охватывать неделю (Пн–Вс), но обрабатывают любой диапазон.
 */
export function buildDashboard(
  entries: TimeEntryWithRelations[],
  from: Date,
  to: Date
): DashboardData {
  const completed = getCompleted(entries);

  const totalSeconds = completed.reduce((sum, e) => sum + (e.durationSeconds ?? 0), 0);
  const billableSeconds = completed
    .filter((e) => e.billable)
    .reduce((sum, e) => sum + (e.durationSeconds ?? 0), 0);

  // Генерируем все дни от from до to
  const days: DashboardDay[] = [];
  const cursor = new Date(from);
  while (cursor <= to) {
    const dateStr = fmtDate(cursor);
    // getUTCDay(): 0=Sun,1=Mon..6=Sat → labelIndex: Mon=0,…,Sun=6
    const utcDay = cursor.getUTCDay();
    const labelIndex = utcDay === 0 ? 6 : utcDay - 1;
    days.push({
      date: dateStr,
      dayLabel: DAY_LABELS[labelIndex] ?? "Mon",
      totalSeconds: 0,
      byProject: [],
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  // Распределяем записи по дням
  for (const entry of completed) {
    const dateStr = fmtDate(entry.startedAt);
    const day = days.find((d) => d.date === dateStr);
    if (!day) continue;

    const projectId = entry.projectId ?? null;
    let proj = day.byProject.find((p) => p.projectId === projectId);
    if (!proj) {
      proj = {
        projectId,
        projectName: entry.project?.name ?? null,
        color: entry.project?.color ?? "#94a3b8",
        seconds: 0,
      };
      day.byProject.push(proj);
    }
    proj.seconds += entry.durationSeconds ?? 0;
    day.totalSeconds += entry.durationSeconds ?? 0;
  }

  // Ограничиваем до 7 проектов на день (остальные = "Other")
  for (const day of days) {
    day.byProject.sort((a, b) => b.seconds - a.seconds);
    if (day.byProject.length > 7) {
      const top7 = day.byProject.slice(0, 7);
      const otherSeconds = day.byProject.slice(7).reduce((sum, p) => sum + p.seconds, 0);
      if (otherSeconds > 0) {
        top7.push({
          projectId: null,
          projectName: "Other",
          color: "#94a3b8",
          seconds: otherSeconds,
        });
      }
      day.byProject = top7;
    }
  }

  // Top 5 проектов по totalSeconds (глобально за период)
  const projectTotals = new Map<
    string | null,
    {
      projectId: string | null;
      projectName: string | null;
      color: string;
      hourlyRate: number | null;
      totalSeconds: number;
      billableSeconds: number;
    }
  >();

  for (const entry of completed) {
    const key = entry.projectId ?? null;
    if (!projectTotals.has(key)) {
      projectTotals.set(key, {
        projectId: key,
        projectName: entry.project?.name ?? null,
        color: entry.project?.color ?? "#94a3b8",
        hourlyRate: entry.project?.hourlyRate ?? null,
        totalSeconds: 0,
        billableSeconds: 0,
      });
    }
    const proj = projectTotals.get(key)!;
    proj.totalSeconds += entry.durationSeconds ?? 0;
    if (entry.billable) proj.billableSeconds += entry.durationSeconds ?? 0;
  }

  let totalEarnings: number | null = null;

  const topProjects: DashboardTopProject[] = Array.from(projectTotals.values())
    .sort((a, b) => b.totalSeconds - a.totalSeconds)
    .slice(0, 5)
    .map((proj) => {
      const earnings = calcEarnings(proj.billableSeconds, proj.hourlyRate);
      if (earnings !== null) {
        totalEarnings = (totalEarnings ?? 0) + earnings;
      }
      return {
        projectId: proj.projectId,
        projectName: proj.projectName,
        color: proj.color,
        totalSeconds: proj.totalSeconds,
        billableSeconds: proj.billableSeconds,
        earnings,
      };
    });

  if (totalEarnings !== null) {
    totalEarnings = Math.round(totalEarnings * 100) / 100;
  }

  return {
    from: fmtDate(from),
    to: fmtDate(to),
    totalSeconds,
    billableSeconds,
    totalEarnings,
    byDay: days,
    topProjects,
  };
}
