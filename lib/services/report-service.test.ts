/**
 * @vitest-environment node
 *
 * Тесты для report-service.ts.
 * Все функции — чистые: никаких моков БД, только данные через параметры.
 */

import { describe, it, expect } from "vitest";
import type { TimeEntryWithRelations } from "@/lib/db/time-entries-repository";
import {
  buildReport,
  buildTagReport,
  buildDashboard,
  calcEarnings,
  entriesToCsv,
} from "./report-service";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BASE_DATE = new Date("2026-02-17T09:00:00.000Z"); // Monday
const STOP_DATE = new Date("2026-02-17T10:30:00.000Z"); // +1.5h = 5400s

function makeProject(
  id: string,
  name: string,
  opts: { hourlyRate?: number | null; color?: string; isArchived?: boolean } = {}
) {
  return {
    id,
    userId: "user-1",
    name,
    color: opts.color ?? "#6366f1",
    estimatedHours: null,
    hourlyRate: opts.hourlyRate ?? null,
    isArchived: opts.isArchived ?? false,
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
  };
}

function makeTag(id: string, name: string, color = "#10b981") {
  return { id, userId: "user-1", name, color, createdAt: BASE_DATE };
}

interface EntryOpts {
  id?: string;
  durationSeconds?: number | null;
  billable?: boolean;
  project?: ReturnType<typeof makeProject> | null;
  tags?: ReturnType<typeof makeTag>[];
  description?: string | null;
  startedAt?: Date;
  stoppedAt?: Date | null;
}

let _entrySeq = 1;

function makeEntry(opts: EntryOpts = {}): TimeEntryWithRelations {
  const id = opts.id ?? `entry-${_entrySeq++}`;
  const project = opts.project !== undefined ? opts.project : null;
  const tags = opts.tags ?? [];
  const startedAt = opts.startedAt ?? BASE_DATE;
  const stoppedAt = opts.stoppedAt !== undefined ? opts.stoppedAt : STOP_DATE; // completed by default

  return {
    id,
    userId: "user-1",
    description: opts.description ?? null,
    projectId: project?.id ?? null,
    billable: opts.billable ?? false,
    startedAt,
    stoppedAt,
    durationSeconds: opts.durationSeconds !== undefined ? opts.durationSeconds : 5400,
    createdAt: startedAt,
    updatedAt: startedAt,
    project,
    timeEntryTags: tags.map((tag) => ({
      timeEntryId: id,
      tagId: tag.id,
      tag,
    })),
  } as TimeEntryWithRelations;
}

const FROM = new Date("2026-02-17T00:00:00.000Z");
const TO = new Date("2026-02-23T23:59:59.000Z");

// ─── calcEarnings ─────────────────────────────────────────────────────────────

describe("calcEarnings", () => {
  it("null hourlyRate → возвращает null", () => {
    expect(calcEarnings(3600, null)).toBeNull();
  });

  it("нулевые секунды с ненулевой ставкой → 0", () => {
    expect(calcEarnings(0, 100)).toBe(0);
  });

  it("1 час @ $50 → 50", () => {
    expect(calcEarnings(3600, 50)).toBe(50);
  });

  it("округление до 2 знаков: 1.5ч @ $100 → 150", () => {
    expect(calcEarnings(5400, 100)).toBe(150);
  });

  it("округление дробных центов: 1ч @ $33.33 → 33.33", () => {
    // 3600 / 3600 * 33.33 = 33.33
    expect(calcEarnings(3600, 33.33)).toBe(33.33);
  });

  it("7200с @ $10.5 → 21", () => {
    expect(calcEarnings(7200, 10.5)).toBe(21);
  });

  it("нестандартные секунды: 1800с @ $60 → 30", () => {
    // 0.5ч * 60 = 30
    expect(calcEarnings(1800, 60)).toBe(30);
  });
});

// ─── buildReport ─────────────────────────────────────────────────────────────

describe("buildReport", () => {
  it("пустые entries → нули и пустые массивы", () => {
    const result = buildReport([], FROM, TO);
    expect(result.totalSeconds).toBe(0);
    expect(result.billableSeconds).toBe(0);
    expect(result.totalEarnings).toBeNull();
    expect(result.byProject).toEqual([]);
    expect(result.from).toBe("2026-02-17");
    expect(result.to).toBe("2026-02-23");
  });

  it("активная запись (stoppedAt=null) НЕ попадает в отчёт", () => {
    const active = makeEntry({ stoppedAt: null, durationSeconds: null });
    const result = buildReport([active], FROM, TO);
    expect(result.totalSeconds).toBe(0);
    expect(result.byProject).toHaveLength(0);
  });

  it("одна запись без проекта → группа projectId=null", () => {
    const entry = makeEntry({ durationSeconds: 3600, project: null });
    const result = buildReport([entry], FROM, TO);
    expect(result.totalSeconds).toBe(3600);
    expect(result.byProject).toHaveLength(1);
    expect(result.byProject[0]!.projectId).toBeNull();
    expect(result.byProject[0]!.totalSeconds).toBe(3600);
    expect(result.byProject[0]!.entryCount).toBe(1);
    expect(result.byProject[0]!.percentage).toBe(100);
    expect(result.byProject[0]!.earnings).toBeNull();
  });

  it("несколько проектов → корректная группировка и процент", () => {
    const projA = makeProject("proj-a", "Alpha");
    const projB = makeProject("proj-b", "Beta");
    const entries = [
      makeEntry({ project: projA, durationSeconds: 3600 }),
      makeEntry({ project: projA, durationSeconds: 3600 }),
      makeEntry({ project: projB, durationSeconds: 7200 }),
    ];
    const result = buildReport(entries, FROM, TO);
    expect(result.totalSeconds).toBe(14400);
    expect(result.byProject).toHaveLength(2);

    const alpha = result.byProject.find((p) => p.projectId === "proj-a")!;
    const beta = result.byProject.find((p) => p.projectId === "proj-b")!;

    expect(alpha.totalSeconds).toBe(7200);
    expect(alpha.entryCount).toBe(2);
    expect(alpha.percentage).toBe(50);

    expect(beta.totalSeconds).toBe(7200);
    expect(beta.entryCount).toBe(1);
    expect(beta.percentage).toBe(50);
  });

  it("byProject отсортированы по totalSeconds по убыванию", () => {
    const projA = makeProject("proj-a", "Alpha");
    const projB = makeProject("proj-b", "Beta");
    const entries = [
      makeEntry({ project: projA, durationSeconds: 100 }),
      makeEntry({ project: projB, durationSeconds: 999 }),
    ];
    const result = buildReport(entries, FROM, TO);
    expect(result.byProject[0]!.projectId).toBe("proj-b");
    expect(result.byProject[1]!.projectId).toBe("proj-a");
  });

  it("billable записи вычисляются отдельно", () => {
    const proj = makeProject("proj-a", "Alpha");
    const entries = [
      makeEntry({ project: proj, durationSeconds: 3600, billable: true }),
      makeEntry({ project: proj, durationSeconds: 1800, billable: false }),
    ];
    const result = buildReport(entries, FROM, TO);
    expect(result.billableSeconds).toBe(3600);
    expect(result.byProject[0]!.billableSeconds).toBe(3600);
  });

  it("totalEarnings: null если ни у одного проекта нет ставки", () => {
    const proj = makeProject("proj-a", "Alpha", { hourlyRate: null });
    const result = buildReport(
      [makeEntry({ project: proj, durationSeconds: 3600, billable: true })],
      FROM,
      TO
    );
    expect(result.totalEarnings).toBeNull();
    expect(result.byProject[0]!.earnings).toBeNull();
  });

  it("totalEarnings: сумма по проектам со ставкой", () => {
    const projA = makeProject("proj-a", "Alpha", { hourlyRate: 100 });
    const projB = makeProject("proj-b", "Beta", { hourlyRate: 50 });
    const entries = [
      makeEntry({ project: projA, durationSeconds: 3600, billable: true }), // 100
      makeEntry({ project: projB, durationSeconds: 7200, billable: true }), // 100
    ];
    const result = buildReport(entries, FROM, TO);
    expect(result.totalEarnings).toBe(200);
    expect(result.byProject.find((p) => p.projectId === "proj-a")!.earnings).toBe(100);
    expect(result.byProject.find((p) => p.projectId === "proj-b")!.earnings).toBe(100);
  });

  it("isArchived: флаг из проекта попадает в результат", () => {
    const proj = makeProject("proj-a", "Alpha", { isArchived: true });
    const result = buildReport([makeEntry({ project: proj, durationSeconds: 3600 })], FROM, TO);
    expect(result.byProject[0]!.isArchived).toBe(true);
  });

  it("from/to форматируются как YYYY-MM-DD", () => {
    const result = buildReport(
      [],
      new Date("2026-03-01T00:00:00.000Z"),
      new Date("2026-03-31T00:00:00.000Z")
    );
    expect(result.from).toBe("2026-03-01");
    expect(result.to).toBe("2026-03-31");
  });
});

// ─── buildTagReport ───────────────────────────────────────────────────────────

describe("buildTagReport", () => {
  it("пустые entries → пустой массив", () => {
    expect(buildTagReport([])).toEqual([]);
  });

  it("активная запись исключается", () => {
    const active = makeEntry({ stoppedAt: null, durationSeconds: null });
    expect(buildTagReport([active])).toHaveLength(0);
  });

  it("запись без тегов → группа tagId=null", () => {
    const entry = makeEntry({ tags: [], durationSeconds: 3600 });
    const result = buildTagReport([entry]);
    expect(result).toHaveLength(1);
    expect(result[0]!.tagId).toBeNull();
    expect(result[0]!.tagName).toBeNull();
    expect(result[0]!.totalSeconds).toBe(3600);
    expect(result[0]!.entryCount).toBe(1);
    expect(result[0]!.percentage).toBe(100);
  });

  it("запись с одним тегом → один элемент в массиве", () => {
    const tag = makeTag("tag-1", "Development", "#3b82f6");
    const entry = makeEntry({ tags: [tag], durationSeconds: 3600 });
    const result = buildTagReport([entry]);
    expect(result).toHaveLength(1);
    expect(result[0]!.tagId).toBe("tag-1");
    expect(result[0]!.tagName).toBe("Development");
    expect(result[0]!.color).toBe("#3b82f6");
  });

  it("запись с несколькими тегами → вносит вклад в КАЖДУЮ тег-группу", () => {
    const tagA = makeTag("tag-a", "Dev");
    const tagB = makeTag("tag-b", "Bug");
    const entry = makeEntry({ tags: [tagA, tagB], durationSeconds: 3600 });
    const result = buildTagReport([entry]);

    // Запись с 2 тегами → 2 группы, каждая получает её 3600с
    expect(result.filter((r) => r.tagId !== null)).toHaveLength(2);
    const devGroup = result.find((r) => r.tagId === "tag-a")!;
    const bugGroup = result.find((r) => r.tagId === "tag-b")!;
    expect(devGroup.totalSeconds).toBe(3600);
    expect(bugGroup.totalSeconds).toBe(3600);
    expect(devGroup.entryCount).toBe(1);
    expect(bugGroup.entryCount).toBe(1);
  });

  it("percentage рассчитан от totalSeconds всех completed записей", () => {
    const tagA = makeTag("tag-a", "Dev");
    const tagB = makeTag("tag-b", "Bug");
    const entries = [
      makeEntry({ tags: [tagA], durationSeconds: 3000 }),
      makeEntry({ tags: [tagB], durationSeconds: 1000 }),
    ];
    const result = buildTagReport(entries);
    const devGroup = result.find((r) => r.tagId === "tag-a")!;
    const bugGroup = result.find((r) => r.tagId === "tag-b")!;
    // totalSeconds = 4000: dev=75%, bug=25%
    expect(devGroup.percentage).toBe(75);
    expect(bugGroup.percentage).toBe(25);
  });

  it("группа без тега всегда идёт последней", () => {
    const tag = makeTag("tag-1", "Dev");
    const entries = [
      makeEntry({ tags: [], durationSeconds: 1000 }), // no-tag
      makeEntry({ tags: [tag], durationSeconds: 2000 }), // tag-1
    ];
    const result = buildTagReport(entries);
    expect(result[result.length - 1]!.tagId).toBeNull();
  });

  it("billableSeconds подсчитывается только для billable=true", () => {
    const tag = makeTag("tag-1", "Dev");
    const entries = [
      makeEntry({ tags: [tag], durationSeconds: 3600, billable: true }),
      makeEntry({ tags: [tag], durationSeconds: 1800, billable: false }),
    ];
    const result = buildTagReport(entries);
    expect(result[0]!.billableSeconds).toBe(3600);
    expect(result[0]!.totalSeconds).toBe(5400);
  });
});

// ─── entriesToCsv ─────────────────────────────────────────────────────────────

describe("entriesToCsv", () => {
  it("пустые entries → только заголовок", () => {
    const csv = entriesToCsv([]);
    expect(csv).toBe("Date,Start,Stop,Duration (h),Project,Description,Tags,Billable");
  });

  it("одна запись → заголовок + одна строка", () => {
    const proj = makeProject("proj-a", "Acme");
    const entry = makeEntry({
      project: proj,
      description: "Fix bug",
      durationSeconds: 5400,
      billable: true,
      startedAt: new Date("2026-02-17T09:00:00.000Z"),
      stoppedAt: new Date("2026-02-17T10:30:00.000Z"),
      tags: [],
    });
    const lines = entriesToCsv([entry]).split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("Date,Start,Stop,Duration (h),Project,Description,Tags,Billable");
    expect(lines[1]).toContain("2026-02-17");
    expect(lines[1]).toContain("09:00");
    expect(lines[1]).toContain("10:30");
    expect(lines[1]).toContain("1.5");
    expect(lines[1]).toContain("Acme");
    expect(lines[1]).toContain("Fix bug");
    expect(lines[1]).toContain("Yes");
  });

  it("Billable: No для non-billable записи", () => {
    const entry = makeEntry({ billable: false, tags: [] });
    const csv = entriesToCsv([entry]);
    expect(csv).toContain(",No");
  });

  it("теги: несколько через запятую в кавычках", () => {
    const tagA = makeTag("t-a", "dev");
    const tagB = makeTag("t-b", "bug");
    const entry = makeEntry({ tags: [tagA, tagB] });
    const csv = entriesToCsv([entry]);
    expect(csv).toContain('"dev,bug"');
  });

  it("один тег — кавычки только если содержит запятую", () => {
    const tag = makeTag("t-1", "meeting");
    const entry = makeEntry({ tags: [tag] });
    const csv = entriesToCsv([entry]);
    // "meeting" не содержит запятой → не оборачивается
    expect(csv).toContain(",meeting,");
  });

  it("запись без проекта → пустое поле проекта", () => {
    const entry = makeEntry({ project: null, tags: [] });
    const lines = entriesToCsv([entry]).split("\n");
    // Поле Project пустое: ...Duration,,Description,...
    expect(lines[1]).toMatch(/[\d.]+,,/);
  });

  it("duration round до 2 знаков: 3666с → 1.02ч", () => {
    const entry = makeEntry({ durationSeconds: 3666, tags: [] });
    const csv = entriesToCsv([entry]);
    expect(csv).toContain("1.02");
  });

  it("CSV экранирование: запятая в описании → оборачивается в кавычки", () => {
    const entry = makeEntry({ description: "Hello, world", tags: [] });
    const csv = entriesToCsv([entry]);
    expect(csv).toContain('"Hello, world"');
  });

  it("CSV экранирование: кавычка в описании → удваивается", () => {
    const entry = makeEntry({ description: 'Say "hi"', tags: [] });
    const csv = entriesToCsv([entry]);
    expect(csv).toContain('"Say ""hi"""');
  });

  it("CSV экранирование: name проекта с запятой", () => {
    const proj = makeProject("p-1", "Acme, Inc.");
    const entry = makeEntry({ project: proj, tags: [] });
    const csv = entriesToCsv([entry]);
    expect(csv).toContain('"Acme, Inc."');
  });

  it("stoppedAt=null → пустое поле Stop", () => {
    const entry = makeEntry({
      stoppedAt: null,
      durationSeconds: null,
      tags: [],
    });
    const lines = entriesToCsv([entry]).split("\n");
    // Stop и Duration оба пустые: ,...,09:00,,,...
    expect(lines[1]).toContain(",09:00,,");
  });
});

// ─── buildDashboard ───────────────────────────────────────────────────────────

describe("buildDashboard", () => {
  it("пустые entries → нулевые суммы, все дни пустые", () => {
    const result = buildDashboard([], FROM, TO);
    expect(result.totalSeconds).toBe(0);
    expect(result.billableSeconds).toBe(0);
    expect(result.totalEarnings).toBeNull();
    expect(result.topProjects).toHaveLength(0);
    // 7 дней (Пн 17 Feb – Вс 23 Feb)
    expect(result.byDay).toHaveLength(7);
    result.byDay.forEach((d) => {
      expect(d.totalSeconds).toBe(0);
      expect(d.byProject).toHaveLength(0);
    });
  });

  it("активная запись исключается", () => {
    const active = makeEntry({ stoppedAt: null, durationSeconds: null });
    const result = buildDashboard([active], FROM, TO);
    expect(result.totalSeconds).toBe(0);
  });

  it("dayLabel корректен: 2026-02-17 (Tuesday) → 'Tue'", () => {
    const result = buildDashboard([], FROM, TO);
    const tuesday = result.byDay.find((d) => d.date === "2026-02-17");
    expect(tuesday?.dayLabel).toBe("Tue");
  });

  it("запись распределяется в правильный день", () => {
    const proj = makeProject("proj-a", "Alpha");
    const tuesday = new Date("2026-02-18T10:00:00.000Z");
    const entry = makeEntry({
      project: proj,
      durationSeconds: 3600,
      startedAt: tuesday,
      stoppedAt: new Date("2026-02-18T11:00:00.000Z"),
    });
    const result = buildDashboard([entry], FROM, TO);
    const tuesdayDay = result.byDay.find((d) => d.date === "2026-02-18")!;
    expect(tuesdayDay.totalSeconds).toBe(3600);
    expect(tuesdayDay.byProject).toHaveLength(1);
    expect(tuesdayDay.byProject[0]!.projectId).toBe("proj-a");
  });

  it("topProjects: только Top 5 по totalSeconds", () => {
    const projects = Array.from({ length: 6 }, (_, i) =>
      makeProject(`proj-${i}`, `Proj${i}`, { hourlyRate: null })
    );
    const entries = projects.map((proj, i) =>
      makeEntry({ project: proj, durationSeconds: (i + 1) * 1000 })
    );
    const result = buildDashboard(entries, FROM, TO);
    expect(result.topProjects).toHaveLength(5);
    // Первый — с наибольшим временем (proj-5 = 6000с)
    expect(result.topProjects[0]!.projectId).toBe("proj-5");
  });

  it("более 7 проектов в день → остаток объединяется в 'Other'", () => {
    const projects = Array.from({ length: 8 }, (_, i) => makeProject(`proj-${i}`, `Proj${i}`));
    const entries = projects.map((proj) => makeEntry({ project: proj, durationSeconds: 100 }));
    const result = buildDashboard(entries, FROM, TO);
    const monday = result.byDay.find((d) => d.date === "2026-02-17")!;
    // max 7 + "Other"
    expect(monday.byProject.length).toBeLessThanOrEqual(8);
    const other = monday.byProject.find((p) => p.projectName === "Other");
    expect(other).toBeDefined();
  });

  it("totalEarnings null если нет проектов со ставкой", () => {
    const proj = makeProject("proj-a", "Alpha", { hourlyRate: null });
    const result = buildDashboard(
      [makeEntry({ project: proj, durationSeconds: 3600, billable: true })],
      FROM,
      TO
    );
    expect(result.totalEarnings).toBeNull();
  });

  it("totalEarnings суммирует только billable часы со ставкой", () => {
    const proj = makeProject("proj-a", "Alpha", { hourlyRate: 100 });
    const entries = [
      makeEntry({ project: proj, durationSeconds: 3600, billable: true }),
      makeEntry({ project: proj, durationSeconds: 3600, billable: false }),
    ];
    const result = buildDashboard(entries, FROM, TO);
    // Только 1 billable час @ $100 = $100
    expect(result.totalEarnings).toBe(100);
  });
});
