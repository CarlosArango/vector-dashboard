import { TICKET_STATUS_META, type TicketStatus } from '@vector/domain/enums';

export function StatusChip({ status }: { status: TicketStatus }) {
  const meta = TICKET_STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card-2 px-2.5 py-0.5 text-[11.5px] font-medium text-fg-2">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
}
