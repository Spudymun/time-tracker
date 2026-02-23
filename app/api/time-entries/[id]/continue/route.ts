import { auth } from "@/lib/auth";
import { timeEntriesRepository } from "@/lib/db/time-entries-repository";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  try {
    // Найти исходную запись
    const source = await timeEntriesRepository.findById(id, userId);
    if (!source) {
      return Response.json({ error: "Time entry not found" }, { status: 404 });
    }

    // Остановить текущую активную запись если есть
    const activeEntry = await timeEntriesRepository.findActive(userId);
    if (activeEntry) {
      await timeEntriesRepository.stopActive(activeEntry.id, userId, new Date());
    }

    // Создать новую запись копируя параметры исходной
    const tagIds = source.timeEntryTags.map((tet) => tet.tagId);
    const newEntry = await timeEntriesRepository.create(userId, {
      description: source.description,
      projectId: source.projectId,
      tagIds,
      billable: source.billable,
      startedAt: new Date(),
    });

    return Response.json(newEntry, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
