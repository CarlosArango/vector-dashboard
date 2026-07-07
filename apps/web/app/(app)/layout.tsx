import { requireAuthContext } from '@/lib/auth-context';
import { getRepositories } from '@/lib/container';
import { getProjects } from '@/lib/data';
import { AppSidebar, type SidebarProject } from '@/components/sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId, email, workspaceId } = await requireAuthContext();
  const repos = getRepositories();

  const [workspace, profile, projects] = await Promise.all([
    repos.workspaces.findById(workspaceId),
    repos.members.findById(userId),
    getProjects(workspaceId),
  ]);

  const navProjects: SidebarProject[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    count: p.stats.total,
  }));

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-fg">
      <AppSidebar
        workspaceName={workspace?.name ?? 'Workspace'}
        workspacePlan={workspace ? `${workspace.plan} workspace` : ''}
        projects={navProjects}
        user={{
          name: profile?.name ?? 'You',
          email: email,
          initials: profile?.initials ?? '?',
          color: profile?.color ?? 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
        }}
      />
      <main className="flex min-w-0 flex-1 flex-col bg-bg">{children}</main>
    </div>
  );
}
