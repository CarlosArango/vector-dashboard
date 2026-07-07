import type { Ticket } from '../entities/ticket';
import type { TicketRepository, UpdateTicketData } from '../repositories/ticket-repository';
import { NotFoundError, ValidationError } from '../shared/errors';

export interface UpdateTicketInput {
  id: string;
  patch: UpdateTicketData;
}

export interface UpdateTicketDeps {
  tickets: TicketRepository;
}

export async function updateTicket(
  deps: UpdateTicketDeps,
  input: UpdateTicketInput,
): Promise<Ticket> {
  const existing = await deps.tickets.findById(input.id);
  if (!existing) throw new NotFoundError('Ticket', input.id);

  if (input.patch.title !== undefined && !input.patch.title.trim()) {
    throw new ValidationError('Ticket title cannot be empty');
  }

  return deps.tickets.update(input.id, input.patch);
}
