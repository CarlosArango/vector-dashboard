import type { Ticket } from '../entities/ticket';
import type { TicketStatus } from '../enums/ticket-status';
import type { TicketRepository } from '../repositories/ticket-repository';
import { positionAtEnd, positionBetween } from '../services/ordering';
import { NotFoundError } from '../shared/errors';

export interface MoveTicketInput {
  id: string;
  toStatus: TicketStatus;
  /** Position of the neighbor above the drop slot, if any. */
  beforePosition?: number | null;
  /** Position of the neighbor below the drop slot, if any. */
  afterPosition?: number | null;
}

export interface MoveTicketDeps {
  tickets: TicketRepository;
}

export async function moveTicket(deps: MoveTicketDeps, input: MoveTicketInput): Promise<Ticket> {
  const ticket = await deps.tickets.findById(input.id);
  if (!ticket) throw new NotFoundError('Ticket', input.id);

  let position: number;
  if (input.beforePosition === undefined && input.afterPosition === undefined) {
    // Dropped without neighbor context — append to the end of the target column.
    const highest = await deps.tickets.highestPosition(ticket.projectId, input.toStatus);
    position = positionAtEnd(highest);
  } else {
    position = positionBetween(input.beforePosition ?? null, input.afterPosition ?? null);
  }

  return deps.tickets.update(input.id, { status: input.toStatus, position });
}
