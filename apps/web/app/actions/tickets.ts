'use server';

import { revalidatePath } from 'next/cache';
import { createTicket, moveTicket, updateTicket, type Ticket } from '@vector/domain';
import { createTicketSchema, moveTicketSchema, updateTicketSchema } from '@vector/validation';
import { assertProjectAccess, requireAuthContext } from '@/lib/auth-context';
import { getRepositories } from '@/lib/container';
import type { ActionResult } from './projects';

export async function listTicketsAction(projectId: string): Promise<Ticket[]> {
  const { workspaceId } = await requireAuthContext();
  await assertProjectAccess(projectId, workspaceId);
  return getRepositories().tickets.listByProject(projectId);
}

export async function createTicketAction(input: unknown): Promise<ActionResult<Ticket>> {
  const { workspaceId } = await requireAuthContext();
  const parsed = createTicketSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  try {
    await assertProjectAccess(parsed.data.projectId, workspaceId);
    const repos = getRepositories();
    const ticket = await createTicket(
      { projects: repos.projects, tickets: repos.tickets },
      parsed.data,
    );
    revalidatePath(`/projects/${parsed.data.projectId}`);
    return { ok: true, data: ticket };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to create ticket' };
  }
}

async function ensureTicketAccess(ticketId: string, workspaceId: string) {
  const repos = getRepositories();
  const ticket = await repos.tickets.findById(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  await assertProjectAccess(ticket.projectId, workspaceId);
  return ticket;
}

export async function updateTicketAction(input: unknown): Promise<ActionResult<Ticket>> {
  const { workspaceId } = await requireAuthContext();
  const parsed = updateTicketSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  try {
    const existing = await ensureTicketAccess(parsed.data.id, workspaceId);
    const { id, ...patch } = parsed.data;
    const ticket = await updateTicket({ tickets: getRepositories().tickets }, { id, patch });
    revalidatePath(`/projects/${existing.projectId}`);
    return { ok: true, data: ticket };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update ticket' };
  }
}

export async function moveTicketAction(input: unknown): Promise<ActionResult<Ticket>> {
  const { workspaceId } = await requireAuthContext();
  const parsed = moveTicketSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  try {
    const existing = await ensureTicketAccess(parsed.data.id, workspaceId);
    const ticket = await moveTicket({ tickets: getRepositories().tickets }, parsed.data);
    revalidatePath(`/projects/${existing.projectId}`);
    return { ok: true, data: ticket };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to move ticket' };
  }
}
