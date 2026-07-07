'use server';

import { revalidatePath } from 'next/cache';
import { addComment, type Comment } from '@vector/domain';
import { addCommentSchema } from '@vector/validation';
import { assertProjectAccess, requireAuthContext } from '@/lib/auth-context';
import { getRepositories } from '@/lib/container';
import type { ActionResult } from './projects';

export async function listCommentsAction(ticketId: string): Promise<Comment[]> {
  const { workspaceId } = await requireAuthContext();
  const repos = getRepositories();
  const ticket = await repos.tickets.findById(ticketId);
  if (!ticket) return [];
  await assertProjectAccess(ticket.projectId, workspaceId);
  return repos.comments.listByTicket(ticketId);
}

export async function addCommentAction(input: unknown): Promise<ActionResult<Comment>> {
  const { userId, workspaceId } = await requireAuthContext();
  const parsed = addCommentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  try {
    const repos = getRepositories();
    const ticket = await repos.tickets.findById(parsed.data.ticketId);
    if (!ticket) throw new Error('Ticket not found');
    await assertProjectAccess(ticket.projectId, workspaceId);

    const comment = await addComment(
      { comments: repos.comments, tickets: repos.tickets },
      { ticketId: parsed.data.ticketId, authorId: userId, body: parsed.data.body },
    );
    revalidatePath(`/projects/${ticket.projectId}`);
    return { ok: true, data: comment };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to add comment' };
  }
}
