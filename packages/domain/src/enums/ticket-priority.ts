export const TICKET_PRIORITIES = ['urgent', 'high', 'medium', 'low'] as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export interface TicketPriorityMeta {
  id: TicketPriority;
  label: string;
  color: string;
  /** Sort rank — lower is more urgent. From the Vector design. */
  rank: number;
}

export const TICKET_PRIORITY_META: Record<TicketPriority, TicketPriorityMeta> = {
  urgent: { id: 'urgent', label: 'Urgent', color: '#ef4444', rank: 0 },
  high: { id: 'high', label: 'High', color: '#f59e0b', rank: 1 },
  medium: { id: 'medium', label: 'Medium', color: '#8b5cf6', rank: 2 },
  low: { id: 'low', label: 'Low', color: '#71717a', rank: 3 },
};

export const TICKET_PRIORITY_LIST: TicketPriorityMeta[] = TICKET_PRIORITIES.map(
  (id) => TICKET_PRIORITY_META[id],
);

export function isTicketPriority(value: unknown): value is TicketPriority {
  return typeof value === 'string' && (TICKET_PRIORITIES as readonly string[]).includes(value);
}
