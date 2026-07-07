import { describe, expect, it } from 'vitest';
import { InMemoryTicketRepository } from '../testing/in-memory-repositories';
import { moveTicket } from './move-ticket';
import type { Ticket } from '../entities/ticket';

function ticket(overrides: Partial<Ticket>): Ticket {
  return {
    id: 't1',
    projectId: 'proj_1',
    code: 'ATL-1',
    title: 'T',
    description: '',
    status: 'todo',
    priority: 'medium',
    assigneeId: null,
    dueDate: null,
    position: 1024,
    createdAt: '2026-07-07T00:00:00.000Z',
    updatedAt: '2026-07-07T00:00:00.000Z',
    ...overrides,
  };
}

describe('moveTicket', () => {
  it('changes status and appends to the end of the target column', async () => {
    const tickets = new InMemoryTicketRepository([
      ticket({ id: 't1', status: 'todo', position: 1024 }),
      ticket({ id: 't2', status: 'done', position: 2048 }),
    ]);
    const moved = await moveTicket({ tickets }, { id: 't1', toStatus: 'done' });
    expect(moved.status).toBe('done');
    expect(moved.position).toBeGreaterThan(2048);
  });

  it('positions between two neighbors', async () => {
    const tickets = new InMemoryTicketRepository([ticket({ id: 't1' })]);
    const moved = await moveTicket(
      { tickets },
      { id: 't1', toStatus: 'inprogress', beforePosition: 1000, afterPosition: 2000 },
    );
    expect(moved.position).toBe(1500);
  });
});
