import { auth } from "@/lib/auth";
import { tagsRepository } from "@/lib/db/tags-repository";
import { UpdateTagSchema } from "@/lib/validations/tag-schema";
import { isPrismaErrorCode } from "@/lib/utils/prisma-errors";

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
  const result = UpdateTagSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const tag = await tagsRepository.update(id, userId, result.data);
    if (!tag) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    return Response.json(tag);
  } catch (error) {
    if (isPrismaErrorCode(error, "P2002")) {
      return Response.json({ error: "Tag name already exists" }, { status: 409 });
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
    const existing = await tagsRepository.findById(id, userId);
    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    await tagsRepository.delete(id, userId);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
