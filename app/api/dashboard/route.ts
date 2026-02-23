import { auth } from "@/lib/auth";
import { timeEntriesRepository } from "@/lib/db/time-entries-repository";
import { buildDashboard } from "@/lib/services/report-service";
import { startOfWeek } from "@/lib/utils/date-utils";

function parseDateOnly(param: string, endOfDay = false): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(param)) return null;
  const iso = endOfDay ? `${param}T23:59:59.999Z` : `${param}T00:00:00.000Z`;
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

  // По умолчанию — текущая неделя (Пн–Вс)
  let from: Date;
  let to: Date;

  if (fromParam && toParam) {
    const parsedFrom = parseDateOnly(fromParam, false);
    const parsedTo = parseDateOnly(toParam, true);

    if (!parsedFrom) {
      return Response.json(
        { error: "Invalid 'from' date. Expected format: YYYY-MM-DD" },
        { status: 400 }
      );
    }
    if (!parsedTo) {
      return Response.json(
        { error: "Invalid 'to' date. Expected format: YYYY-MM-DD" },
        { status: 400 }
      );
    }
    if (parsedFrom > parsedTo) {
      return Response.json({ error: "'from' date must not be after 'to' date" }, { status: 400 });
    }

    from = parsedFrom;
    to = parsedTo;
  } else {
    // Текущая неделя
    const now = new Date();
    from = startOfWeek(now);
    from.setUTCHours(0, 0, 0, 0);
    // to = from + 6 days (воскресенье)
    to = new Date(from);
    to.setUTCDate(to.getUTCDate() + 6);
    to.setUTCHours(23, 59, 59, 999);
  }

  try {
    const entries = await timeEntriesRepository.findMany(userId, { from, to });
    const dashboard = buildDashboard(entries, from, to);

    return Response.json(dashboard);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
