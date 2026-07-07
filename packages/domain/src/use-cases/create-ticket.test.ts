import { describe, expect, it } from 'vitest';
import {
  InMemoryProjectRepository,
  InMemoryTicketRepository,
} from '../testing/in-memory-repositories';
import { createTicket } from './create-ticket';
import type { Project } from '../entities/project';

function seedProject(): { projects: InMemoryProjectRepository; project: Project } {
  const project: Project = {
    id: 'proj_1',
    workspaceId: 'ws_1',
    name: 'Atlas',
    description: '',
    color: '#3b82f6',
    icon: 'ph-fill ph-browsers',
    key: 'ATL',
    dueDate: null,
    createdAt: '2026-07-07T00:00:00.000Z',
    memberIds: [],
  };
  return { projects: new InMemoryProjectRepository([project]), project };
}

describe('createTicket', () => {
  it('generates a sequential code and defaults status to backlog', async () => {
    const { projects } = seedProject();
    const tickets = new InMemoryTicketRepository();

    const first = await createTicket({ projects, tickets }, { projectId: 'proj_1', title: 'One' });
    const second = await createTicket({ projects, tickets }, { projectId: 'proj_1', title: 'Two' });

    expect(first.code).toBe('ATL-1');
    expect(second.code).toBe('ATL-2');
    expect(first.status).toBe('backlog');
    expect(second.position).toBeGreaterThan(first.position);
  });

  it('rejects empty titles', async () => {
    const { projects } = seedProject();
    const tickets = new InMemoryTicketRepository();
    await expect(
      createTicket({ projects, tickets }, { projectId: 'proj_1', title: '  ' }),
    ).rejects.toThrow(/title is required/i);
  });

  it('throws when the project does not exist', async () => {
    const projects = new InMemoryProjectRepository();
    const tickets = new InMemoryTicketRepository();
    await expect(
      createTicket({ projects, tickets }, { projectId: 'missing', title: 'X' }),
    ).rejects.toThrow(/not found/i);
  });
});
