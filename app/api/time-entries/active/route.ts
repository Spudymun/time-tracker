import { auth } from "@/lib/auth";
import { timeEntriesRepository } from "@/lib/db/time-entries-repository";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const activeEntry = await timeEntriesRepository.findActive(userId);
    return Response.json(activeEntry);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
