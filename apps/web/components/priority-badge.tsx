import { TICKET_PRIORITY_META, type TicketPriority } from '@vector/domain/enums';

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const meta = TICKET_PRIORITY_META[priority];
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={{ color: meta.color, background: hexA(meta.color, 0.12) }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

export { hexA };
