'use client';

import * as React from 'react';
import { ArrowDown, ArrowUp, ArrowsDownUp, CalendarBlank } from '@phosphor-icons/react';
import type { Ticket } from '@vector/domain';
import {
  TICKET_PRIORITY_META,
  TICKET_STATUS_META,
  isOverdue,
} from '@vector/domain';
import { cn } from '@vector/ui/lib/utils';
import { Avatar } from '@vector/ui/avatar';
import { PriorityBadge } from './priority-badge';
import { DueBadge } from './due-badge';
import { StatusChip } from './status-chip';
import type { AvatarVM } from '@/lib/view-models';

type SortKey = 'title' | 'assignee' | 'due' | 'priority' | 'status';

const COLS: { key: SortKey; label: string }[] = [
  { key: 'title', label: 'Ticket' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'due', label: 'Due' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
];

const GRID = 'grid grid-cols-[minmax(0,1fr)_150px_120px_120px_130px] gap-3';

export function ListTable({
  tickets,
  membersMap,
  today,
  onOpenTicket,
}: {
  tickets: Ticket[];
  membersMap: Record<string, AvatarVM>;
  today: string;
  onOpenTicket: (id: string) => void;
}) {
  const [sortKey, setSortKey] = React.useState<SortKey>('due');
  const [dir, setDir] = React.useState(1);

  function rank(t: Ticket, key: SortKey): string | number {
    switch (key) {
      case 'title':
        return t.title.toLowerCase();
      case 'assignee':
        return t.assigneeId ? (membersMap[t.assigneeId]?.name ?? '') : '';
      case 'due':
        return t.dueDate ?? '9999';
      case 'priority':
        return TICKET_PRIORITY_META[t.priority].rank;
      case 'status':
        return TICKET_STATUS_META[t.status].order;
    }
  }

  const sorted = [...tickets].sort((a, b) => {
    const av = rank(a, sortKey);
    const bv = rank(b, sortKey);
    return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
  });

  function toggle(key: SortKey) {
    if (key === sortKey) setDir((d) => -d);
    else {
      setSortKey(key);
      setDir(1);
    }
  }

  return (
    <div className="flex-1 overflow-auto p-6 pt-[18px]">
      <div className="max-w-[1100px] overflow-hidden rounded-xl border border-border bg-card">
        <div className={cn(GRID, 'border-b border-border bg-card-2 px-[18px] py-2.5')}>
          {COLS.map((c) => (
            <button
              key={c.key}
              onClick={() => toggle(c.key)}
              className={cn(
                'flex items-center gap-1.5 text-left text-[11px] font-semibold uppercase tracking-wide',
                sortKey === c.key ? 'text-fg-2' : 'text-muted',
              )}
            >
              {c.label}
              {sortKey === c.key ? (
                dir > 0 ? (
                  <ArrowUp size={11} weight="bold" />
                ) : (
                  <ArrowDown size={11} weight="bold" />
                )
              ) : (
                <ArrowsDownUp size={11} className="opacity-40" />
              )}
            </button>
          ))}
        </div>

        {sorted.map((t) => {
          const assignee = t.assigneeId ? membersMap[t.assigneeId] : undefined;
          return (
            <button
              key={t.id}
              onClick={() => onOpenTicket(t.id)}
              className={cn(GRID, 'w-full items-center border-b border-border px-[18px] py-3 text-left hover:bg-card-2')}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className="h-1.5 w-1.5 flex-none rounded-full"
                  style={{ background: TICKET_PRIORITY_META[t.priority].color }}
                />
                <span className="flex-none font-mono text-[10.5px] text-muted">{t.code}</span>
                <span className="truncate text-[13px] font-medium">{t.title}</span>
              </div>
              <div className="flex items-center gap-2">
                {assignee && <Avatar initials={assignee.initials} background={assignee.color} size={22} />}
                <span className="truncate text-[12.5px] text-fg-2">{assignee?.name ?? '—'}</span>
              </div>
              <div>
                {t.dueDate ? (
                  <DueBadge date={t.dueDate} overdue={isOverdue(t, today)} />
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                    <CalendarBlank size={11} /> —
                  </span>
                )}
              </div>
              <div>
                <PriorityBadge priority={t.priority} />
              </div>
              <div>
                <StatusChip status={t.status} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
