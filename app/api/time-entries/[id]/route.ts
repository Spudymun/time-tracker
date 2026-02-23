import { auth } from "@/lib/auth";
import { timeEntriesRepository } from "@/lib/db/time-entries-repository";
import { UpdateEntrySchema } from "@/lib/validations/time-entry-schema";
import { isPrismaNotFound } from "@/lib/utils/prisma-errors";

export async function GET(
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
    const entry = await timeEntriesRepository.findById(id, userId);
    if (!entry) {
      return Response.json({ error: "Time entry not found" }, { status: 404 });
    }
    return Response.json(entry);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

  const body: unknown = await request.json();
  const result = UpdateEntrySchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    // Загружаем текущую запись, чтобы вычислить stoppedAt если нужно
    const existing = await timeEntriesRepository.findById(id, userId);
    if (!existing) {
      return Response.json({ error: "Time entry not found" }, { status: 404 });
    }

    const { durationMinutes, ...rest } = result.data;

    // Если передан durationMinutes — вычисляем stoppedAt и durationSeconds
    let stoppedAt: Date | undefined;
    let durationSeconds: number | undefined;

    if (durationMinutes !== undefined) {
      const durationSecs = Math.round(durationMinutes * 60);
      stoppedAt = new Date(existing.startedAt.getTime() + durationSecs * 1000);
      durationSeconds = durationSecs;
    }

    const updated = await timeEntriesRepository.update(id, userId, {
      ...rest,
      ...(stoppedAt !== undefined && { stoppedAt }),
      ...(durationSeconds !== undefined && { durationSeconds }),
    });

    if (!updated) {
      return Response.json({ error: "Time entry not found" }, { status: 404 });
    }

    return Response.json(updated);
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return Response.json({ error: "Time entry not found" }, { status: 404 });
    }
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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
    const entry = await timeEntriesRepository.findById(id, userId);
    if (!entry) {
      return Response.json({ error: "Time entry not found" }, { status: 404 });
    }

    // Нельзя удалять активную запись через entries list
    if (entry.stoppedAt === null) {
      return Response.json(
        { error: "Cannot delete an active time entry. Stop the timer first." },
        { status: 400 }
      );
    }

    await timeEntriesRepository.delete(id, userId);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (isPrismaNotFound(error)) {
      return Response.json({ error: "Time entry not found" }, { status: 404 });
    }
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
