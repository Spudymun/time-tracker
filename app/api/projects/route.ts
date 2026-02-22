import { auth } from "@/lib/auth";
import { projectsRepository } from "@/lib/db/projects-repository";
import { CreateProjectSchema } from "@/lib/validations/project-schema";
import { isPrismaErrorCode } from "@/lib/utils/prisma-errors";
import { z } from "zod";

const ArchivedFilterSchema = z.enum(["true", "false", "all"]).optional();

export async function GET(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const archivedParam = searchParams.get("archived") ?? undefined;
  const archivedResult = ArchivedFilterSchema.safeParse(archivedParam);
  if (!archivedResult.success) {
    return Response.json(
      { error: "Invalid archived filter. Use 'true', 'false', or 'all'" },
      { status: 400 }
    );
  }

  try {
    const projects = await projectsRepository.findAll(
      userId,
      archivedResult.data ? { archived: archivedResult.data } : undefined
    );
    return Response.json(projects);
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
  const result = CreateProjectSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const project = await projectsRepository.create(userId, result.data);
    return Response.json(project, { status: 201 });
  } catch (error) {
    if (isPrismaErrorCode(error, "P2002")) {
      return Response.json({ error: "Project name already exists" }, { status: 409 });
    }
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
