import { auth } from "@/lib/auth";
import { taskNamesRepository } from "@/lib/db/task-names-repository";

export async function GET(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;

  try {
    const taskNames = await taskNamesRepository.findRecent(userId, q);
    return Response.json(taskNames);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
