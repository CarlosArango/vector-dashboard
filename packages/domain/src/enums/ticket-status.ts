export const TICKET_STATUSES = ['backlog', 'todo', 'inprogress', 'done'] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export interface TicketStatusMeta {
  id: TicketStatus;
  label: string;
  /** Column dot / accent color, from the Vector design. */
  dot: string;
  /** Board column order. */
  order: number;
}

export const TICKET_STATUS_META: Record<TicketStatus, TicketStatusMeta> = {
  backlog: { id: 'backlog', label: 'Backlog', dot: '#71717a', order: 0 },
  todo: { id: 'todo', label: 'To Do', dot: '#3b82f6', order: 1 },
  inprogress: { id: 'inprogress', label: 'In Progress', dot: '#f59e0b', order: 2 },
  done: { id: 'done', label: 'Done', dot: '#10b981', order: 3 },
};

export const TICKET_STATUS_LIST: TicketStatusMeta[] = TICKET_STATUSES.map(
  (id) => TICKET_STATUS_META[id],
);

export function isTicketStatus(value: unknown): value is TicketStatus {
  return typeof value === 'string' && (TICKET_STATUSES as readonly string[]).includes(value);
}
