import type { Ticket } from '../entities/ticket';
import type { TicketPriority } from '../enums/ticket-priority';
import type { TicketStatus } from '../enums/ticket-status';

export interface CreateTicketData {
  projectId: string;
  code: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: string | null;
  dueDate: string | null;
  position: number;
}

export type UpdateTicketData = Partial<
  Pick<
    Ticket,
    'title' | 'description' | 'status' | 'priority' | 'assigneeId' | 'dueDate' | 'position'
  >
>;

export interface TicketRepository {
  listByProject(projectId: string): Promise<Ticket[]>;
  findById(id: string): Promise<Ticket | null>;
  countByProject(projectId: string): Promise<number>;
  /** Highest position within a project+status column, or null if empty. */
  highestPosition(projectId: string, status: TicketStatus): Promise<number | null>;
  create(data: CreateTicketData): Promise<Ticket>;
  update(id: string, patch: UpdateTicketData): Promise<Ticket>;
  delete(id: string): Promise<void>;
}
