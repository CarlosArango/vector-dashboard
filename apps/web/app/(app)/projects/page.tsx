import { requireAuthContext } from '@/lib/auth-context';
import { getMembers, getProjects } from '@/lib/data';
import { membersToMap, resolveAvatars } from '@/lib/view-models';
import { todayISO } from '@/lib/format';
import { ProjectsView, type ProjectCardVM } from '@/components/projects-view';

export default async function ProjectsPage() {
  const { workspaceId } = await requireAuthContext();
  const [projects, members] = await Promise.all([
    getProjects(workspaceId),
    getMembers(workspaceId),
  ]);
  const map = membersToMap(members);
  const today = todayISO();

  const cards: ProjectCardVM[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    color: p.color,
    icon: p.icon,
    dueDate: p.dueDate,
    overdue: !!p.dueDate && p.dueDate < today && p.stats.done < p.stats.total,
    done: p.stats.done,
    total: p.stats.total,
    percent: p.stats.percent,
    avatars: resolveAvatars(p.memberIds, map),
  }));

  return <ProjectsView cards={cards} />;
}
