import type { Ticket } from '../entities/ticket';
import { TICKET_STATUS_LIST } from '../enums/ticket-status';
import type { TicketStatus } from '../enums/ticket-status';
import type { TicketRepository } from '../repositories/ticket-repository';

export interface BoardColumn {
  status: TicketStatus;
  label: string;
  dot: string;
  tickets: Ticket[];
}

export interface GetBoardDeps {
  tickets: TicketRepository;
}

export async function getBoard(deps: GetBoardDeps, projectId: string): Promise<BoardColumn[]> {
  const tickets = await deps.tickets.listByProject(projectId);
  return TICKET_STATUS_LIST.map((meta) => ({
    status: meta.id,
    label: meta.label,
    dot: meta.dot,
    tickets: tickets
      .filter((t) => t.status === meta.id)
      .sort((a, b) => a.position - b.position),
  }));
}
