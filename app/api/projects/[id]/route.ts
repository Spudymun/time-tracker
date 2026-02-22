import { auth } from "@/lib/auth";
import { projectsRepository } from "@/lib/db/projects-repository";
import { UpdateProjectSchema } from "@/lib/validations/project-schema";
import { isPrismaErrorCode } from "@/lib/utils/prisma-errors";

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
    const project = await projectsRepository.findById(id, userId);
    if (!project) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json(project);
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
  const result = UpdateProjectSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const project = await projectsRepository.update(id, userId, result.data);
    if (!project) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json(project);
  } catch (error) {
    if (isPrismaErrorCode(error, "P2002")) {
      return Response.json({ error: "Project name already exists" }, { status: 409 });
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
    const existing = await projectsRepository.findById(id, userId);
    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    await projectsRepository.delete(id, userId);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
