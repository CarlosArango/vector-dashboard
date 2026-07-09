import { notFound } from 'next/navigation';
import { requireAuthContext } from '@/lib/auth-context';
import { getMembers, getProjectById } from '@/lib/data';
import { membersToMap, resolveAvatars } from '@/lib/view-models';
import { todayISO } from '@/lib/format';
import { ProjectView } from '@/components/project-view';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId, workspaceId } = await requireAuthContext();

  // Only the lightweight project + members are fetched server-side; the ticket
  // list is loaded client-side via React Query (warmed by hover prefetch). This
  // keeps the HTML small and lets a warm cache render the board instantly.
  const [project, members] = await Promise.all([getProjectById(id), getMembers(workspaceId)]);
  if (!project || project.workspaceId !== workspaceId) notFound();

  const map = membersToMap(members);
  const me = map[userId] ?? { id: userId, initials: '?', color: '', name: 'You' };

  return (
    <ProjectView
      project={{ id: project.id, name: project.name, color: project.color }}
      projectAvatars={resolveAvatars(project.memberIds, map)}
      members={members.map((m) => map[m.id]!)}
      membersMap={map}
      today={todayISO()}
      currentUser={me}
    />
  );
}
