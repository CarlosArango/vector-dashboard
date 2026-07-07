import 'server-only';
import { redirect } from 'next/navigation';
import { getCurrentUser } from './supabase/server';
import { getRepositories } from './container';

export interface AuthContext {
  userId: string;
  email: string;
  workspaceId: string;
}

/**
 * Resolves the authenticated user and their active workspace. Redirects to
 * /login when unauthenticated. All data access is scoped to workspaceId.
 */
export async function requireAuthContext(): Promise<AuthContext> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const repos = getRepositories();
  const workspaces = await repos.workspaces.listForUser(user.id);
  if (workspaces.length === 0) {
    // New users are added to the demo workspace by a DB trigger; if that ever
    // fails there is nothing to show.
    redirect('/login?error=no-workspace');
  }

  return { userId: user.id, email: user.email ?? '', workspaceId: workspaces[0]!.id };
}

/** Throws unless the given project belongs to the user's workspace. */
export async function assertProjectAccess(projectId: string, workspaceId: string): Promise<void> {
  const project = await getRepositories().projects.findById(projectId);
  if (!project || project.workspaceId !== workspaceId) {
    throw new Error('Project not found or access denied');
  }
}
