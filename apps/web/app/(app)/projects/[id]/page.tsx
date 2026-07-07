import { notFound } from 'next/navigation';
import { assertProjectAccess, requireAuthContext } from '@/lib/auth-context';
import { getRepositories } from '@/lib/container';
import { getMembers, getProjectById, getProjectTickets } from '@/lib/data';
import { membersToMap, resolveAvatars } from '@/lib/view-models';
import { todayISO } from '@/lib/format';
import { ProjectView } from '@/components/project-view';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, workspaceId } = await requireAuthContext();

  try {
    await assertProjectAccess(id, workspaceId);
  } catch {
    notFound();
  }

  const [project, members, tickets] = await Promise.all([
    getProjectById(id),
    getMembers(workspaceId),
    getProjectTickets(id),
  ]);
  if (!project) notFound();

  const map = membersToMap(members);
  const me = map[userId] ?? { id: userId, initials: '?', color: '', name: 'You' };

  return (
    <ProjectView
      project={{ id: project.id, name: project.name, color: project.color }}
      projectAvatars={resolveAvatars(project.memberIds, map)}
      members={members.map((m) => map[m.id]!)}
      membersMap={map}
      initialTickets={tickets}
      today={todayISO()}
      currentUser={me}
    />
  );
}
