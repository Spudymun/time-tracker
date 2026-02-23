import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { projectsRepository } from "@/lib/db/projects-repository";
import { tagsRepository } from "@/lib/db/tags-repository";
import { EntriesList } from "@/components/entries/EntriesList";

/**
 * Главная страница приложения.
 * Server Component — загружает проекты и теги для фильтров и форм.
 * DashboardWidget будет добавлен в Промпте 9.
 */
export default async function MainPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [projects, tags] = await Promise.all([
    projectsRepository.findAll(userId, { archived: "all" }),
    tagsRepository.findAll(userId),
  ]);

  // Приводим к props-формату (только нужные поля)
  const projectOptions = projects.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    isArchived: p.isArchived,
  }));

  const tagOptions = tags.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* DashboardWidget будет добавлен в Промпте 9 */}

      <EntriesList projects={projectOptions} tags={tagOptions} />
    </div>
  );
}
