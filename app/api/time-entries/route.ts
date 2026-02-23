import { auth } from "@/lib/auth";
import { timeEntriesRepository, type FindManyFilters } from "@/lib/db/time-entries-repository";
import { CreateEntrySchema } from "@/lib/validations/time-entry-schema";

/**
 * Парсит строку даты (YYYY-MM-DD или ISO 8601) в Date (UTC).
 * Для date-only строк: `endOfDay=true` → 23:59:59.999Z.
 */
function parseDateParam(param: string, endOfDay = false): Date | null {
  // date-only: YYYY-MM-DD
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(param);
  const iso = isDateOnly ? (endOfDay ? `${param}T23:59:59.999Z` : `${param}T00:00:00.000Z`) : param;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const projectIdParam = searchParams.get("projectId");
  const billableParam = searchParams.get("billable");
  const tagId = searchParams.get("tagId") ?? undefined;
  const q = searchParams.get("q") ?? undefined;

  const filters: FindManyFilters = {};

  if (fromParam) {
    const from = parseDateParam(fromParam, false);
    if (!from) {
      return Response.json({ error: "Invalid 'from' date" }, { status: 400 });
    }
    filters.from = from;
  }

  if (toParam) {
    const to = parseDateParam(toParam, true);
    if (!to) {
      return Response.json({ error: "Invalid 'to' date" }, { status: 400 });
    }
    filters.to = to;
  }

  if (projectIdParam !== null) {
    filters.projectId = projectIdParam === "none" ? null : projectIdParam;
  }

  if (billableParam !== null) {
    filters.billable = billableParam === "true";
  }

  if (tagId) filters.tagId = tagId;
  if (q) filters.q = q;

  try {
    const entries = await timeEntriesRepository.findMany(userId, filters);
    return Response.json(entries);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body: unknown = await request.json();
  const result = CreateEntrySchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    // Если есть активная запись — остановить её сначала
    const activeEntry = await timeEntriesRepository.findActive(userId);
    if (activeEntry) {
      await timeEntriesRepository.stopActive(activeEntry.id, userId, new Date());
    }

    // startedAt всегда устанавливается сервером (UTC now)
    // Клиентское значение игнорируется для обеспечения целостности данных
    const entry = await timeEntriesRepository.create(userId, {
      description: result.data.description ?? null,
      projectId: result.data.projectId ?? null,
      tagIds: result.data.tagIds ?? [],
      billable: result.data.billable ?? false,
      startedAt: new Date(),
    });

    return Response.json(entry, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
