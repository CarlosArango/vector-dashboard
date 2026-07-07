'use server';

import { revalidatePath } from 'next/cache';
import { createProject } from '@vector/domain';
import { createProjectSchema } from '@vector/validation';
import { requireAuthContext } from '@/lib/auth-context';
import { getRepositories } from '@/lib/container';

export interface ActionResult<T = void> {
  ok: boolean;
  error?: string;
  data?: T;
}

export async function createProjectAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const { workspaceId } = await requireAuthContext();
  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  try {
    const repos = getRepositories();
    const project = await createProject(
      { projects: repos.projects },
      { workspaceId, ...parsed.data },
    );
    revalidatePath('/projects');
    return { ok: true, data: { id: project.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create project' };
  }
}
