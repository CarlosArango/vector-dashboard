import type { Project } from '../entities/project';
import type { Ticket } from '../entities/ticket';
import type { TicketPriority } from '../enums/ticket-priority';
import type { TicketStatus } from '../enums/ticket-status';
import type { ProjectRepository } from '../repositories/project-repository';
import type { TicketRepository } from '../repositories/ticket-repository';
import { positionAtEnd } from '../services/ordering';
import { NotFoundError, ValidationError } from '../shared/errors';

export interface CreateTicketInput {
  projectId: string;
  title: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
}

export interface CreateTicketDeps {
  projects: ProjectRepository;
  tickets: TicketRepository;
}

function ticketCode(project: Project, count: number): string {
  return `${project.key}-${count + 1}`;
}

export async function createTicket(
  deps: CreateTicketDeps,
  input: CreateTicketInput,
): Promise<Ticket> {
  const project = await deps.projects.findById(input.projectId);
  if (!project) throw new NotFoundError('Project', input.projectId);

  const title = input.title.trim();
  if (!title) throw new ValidationError('Ticket title is required');

  const status: TicketStatus = input.status ?? 'backlog';
  const count = await deps.tickets.countByProject(project.id);
  const highest = await deps.tickets.highestPosition(project.id, status);

  return deps.tickets.create({
    projectId: project.id,
    code: ticketCode(project, count),
    title,
    description: input.description?.trim() ?? '',
    status,
    priority: input.priority ?? 'medium',
    assigneeId: input.assigneeId ?? null,
    dueDate: input.dueDate ?? null,
    position: positionAtEnd(highest),
  });
}
