import { CalendarBlank } from '@phosphor-icons/react';
import { formatDue } from '@/lib/format';
import { hexA } from './priority-badge';

export function DueBadge({
  date,
  overdue,
  fullLabel,
}: {
  date: string | null;
  overdue: boolean;
  fullLabel?: string;
}) {
  const label = fullLabel ?? formatDue(date) ?? 'No date';
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium"
      style={
        overdue
          ? { color: '#ef4444', background: hexA('#ef4444', 0.12) }
          : {
              color: 'var(--fg-2)',
              background: 'var(--card-2)',
              border: '1px solid var(--border)',
            }
      }
    >
      <CalendarBlank size={11} />
      {label}
    </span>
  );
}
