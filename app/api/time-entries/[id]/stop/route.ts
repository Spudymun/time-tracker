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
    const stoppedAt = new Date();
    const stopped = await timeEntriesRepository.stopActive(id, userId, stoppedAt);

    if (!stopped) {
      return Response.json({ error: "Time entry not found" }, { status: 404 });
    }

    return Response.json(stopped);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
