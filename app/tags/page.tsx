import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { tagsRepository } from "@/lib/db/tags-repository";
import { TagsList } from "@/components/tags/TagsList";
import type { TagApiItem } from "@/components/tags/tag-types";

/**
 * Страница управления тегами.
 * Server Component — загружает теги через репозиторий.
 */
export default async function TagsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const tags = await tagsRepository.findAll(userId);

  const initialTags: TagApiItem[] = tags.map(({ _count, ...tag }) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    createdAt: tag.createdAt.toISOString(),
    usageCount: _count.timeEntryTags,
  }));

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <TagsList initialTags={initialTags} />
    </main>
  );
}
