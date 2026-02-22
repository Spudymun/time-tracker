import { auth } from "@/lib/auth";
import { tagsRepository } from "@/lib/db/tags-repository";
import { CreateTagSchema } from "@/lib/validations/tag-schema";
import { isPrismaErrorCode } from "@/lib/utils/prisma-errors";

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const tags = await tagsRepository.findAll(userId);
    // Map _count.timeEntryTags → usageCount for API response
    const mapped = tags.map(({ _count, ...tag }) => ({
      ...tag,
      usageCount: _count.timeEntryTags,
    }));
    return Response.json(mapped);
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
  const result = CreateTagSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const tag = await tagsRepository.create(userId, result.data);
    const { _count, ...tagData } = tag;
    return Response.json({ ...tagData, usageCount: _count.timeEntryTags }, { status: 201 });
  } catch (error) {
    if (isPrismaErrorCode(error, "P2002")) {
      return Response.json({ error: "Tag name already exists" }, { status: 409 });
    }
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
