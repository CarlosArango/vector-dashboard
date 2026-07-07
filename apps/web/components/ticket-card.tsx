'use client';

import * as React from 'react';
import type { Ticket } from '@vector/domain';
import { isOverdue } from '@vector/domain';
import { Avatar } from '@vector/ui/avatar';
import { cn } from '@vector/ui/lib/utils';
import { PriorityBadge } from './priority-badge';
import { DueBadge } from './due-badge';
import type { AvatarVM } from '@/lib/view-models';

interface TicketCardProps extends React.HTMLAttributes<HTMLDivElement> {
  ticket: Ticket;
  membersMap: Record<string, AvatarVM>;
  today: string;
  dragging?: boolean;
}

export const TicketCard = React.forwardRef<HTMLDivElement, TicketCardProps>(
  ({ ticket, membersMap, today, dragging, className, ...props }, ref) => {
    const assignee = ticket.assigneeId ? membersMap[ticket.assigneeId] : undefined;
    return (
      <div
        ref={ref}
        className={cn(
          'cursor-grab rounded-[10px] border border-border bg-card p-3 shadow-[0_1px_2px_rgba(0,0,0,0.06)]',
          'transition-[border-color,box-shadow] hover:border-border-2 hover:shadow-[0_4px_16px_rgba(0,0,0,0.14)]',
          dragging && 'opacity-40',
          className,
        )}
        {...props}
      >
        <div className="mb-2.5 flex items-center justify-between">
          <PriorityBadge priority={ticket.priority} />
          <span className="font-mono text-[10.5px] text-muted">{ticket.code}</span>
        </div>
        <div className="mb-3 text-[13.5px] font-medium leading-snug tracking-tight text-fg">
          {ticket.title}
        </div>
        <div className="flex items-center justify-between">
          <DueBadge date={ticket.dueDate} overdue={isOverdue(ticket, today)} />
          {assignee ? (
            <Avatar initials={assignee.initials} background={assignee.color} size={24} />
          ) : (
            <div className="h-6 w-6 rounded-full border border-dashed border-border" />
          )}
        </div>
      </div>
    );
  },
);
TicketCard.displayName = 'TicketCard';
