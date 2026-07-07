import type { TicketPriority } from '../enums/ticket-priority';
import type { TicketStatus } from '../enums/ticket-status';

export interface Ticket {
  id: string;
  projectId: string;
  /** Human code, e.g. "ATL-12". */
  code: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: string | null;
  dueDate: string | null;
  /** Fractional index for ordering within a column. */
  position: number;
  createdAt: string;
  updatedAt: string;
}

/** True when the ticket is past due and not yet done. */
export function isOverdue(ticket: Pick<Ticket, 'dueDate' | 'status'>, today: string): boolean {
  return !!ticket.dueDate && ticket.dueDate < today && ticket.status !== 'done';
}
