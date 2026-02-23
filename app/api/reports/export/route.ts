import { auth } from "@/lib/auth";
import { timeEntriesRepository } from "@/lib/db/time-entries-repository";
import { entriesToCsv } from "@/lib/services/report-service";

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

  if (!fromParam || !toParam) {
    return Response.json(
      { error: "Query params 'from' and 'to' are required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const from = parseDateOnly(fromParam, false);
  const to = parseDateOnly(toParam, true);

  if (!from) {
    return Response.json(
      { error: "Invalid 'from' date. Expected format: YYYY-MM-DD" },
      { status: 400 }
    );
  }
  if (!to) {
    return Response.json(
      { error: "Invalid 'to' date. Expected format: YYYY-MM-DD" },
      { status: 400 }
    );
  }

  if (from > to) {
    return Response.json({ error: "'from' date must not be after 'to' date" }, { status: 400 });
  }

  try {
    // Лимит снят — получаем все записи за период для CSV
    const entries = await timeEntriesRepository.findMany(userId, { from, to });

    const csv = entriesToCsv(entries);
    const filename = `time-report-${fromParam}_${toParam}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=${filename}`,
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
