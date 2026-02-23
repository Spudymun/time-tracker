import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { projectsRepository } from "@/lib/db/projects-repository";
import { ProjectsList } from "@/components/projects/ProjectsList";
import type { ProjectApiItem } from "@/components/projects/project-types";

/**
 * Страница управления проектами.
 * Server Component — загружает активные проекты через репозиторий.
 * Архивные проекты загружаются клиентом при включении toggle.
 */
export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const projects = await projectsRepository.findAll(userId, { archived: "false" });

  // Преобразуем Date → string для передачи в Client Component
  const initialProjects: ProjectApiItem[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    isArchived: p.isArchived,
    estimatedHours: p.estimatedHours,
    hourlyRate: p.hourlyRate,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    totalSeconds: p.totalSeconds,
    billableSeconds: p.billableSeconds,
    earnings: p.earnings,
    estimateProgress: p.estimateProgress,
    entryCount: p.entryCount,
  }));

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <ProjectsList initialProjects={initialProjects} />
    </main>
  );
}
