'use client';

import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from '@phosphor-icons/react';
import type { Ticket } from '@vector/domain';
import { TICKET_STATUS_LIST, positionAtEnd, positionBetween, type TicketStatus } from '@vector/domain';
import { cn } from '@vector/ui/lib/utils';
import { TicketCard } from './ticket-card';
import { useMoveTicket } from '@/hooks/use-tickets';
import type { AvatarVM } from '@/lib/view-models';

interface BoardProps {
  projectId: string;
  tickets: Ticket[];
  membersMap: Record<string, AvatarVM>;
  today: string;
  onOpenTicket: (id: string) => void;
  onNewTicket: (status: TicketStatus) => void;
}

function groupByStatus(tickets: Ticket[]): Record<TicketStatus, Ticket[]> {
  const map = { backlog: [], todo: [], inprogress: [], done: [] } as Record<TicketStatus, Ticket[]>;
  for (const t of tickets) map[t.status].push(t);
  for (const key of Object.keys(map) as TicketStatus[]) {
    map[key].sort((a, b) => a.position - b.position);
  }
  return map;
}

function SortableTicket({
  ticket,
  membersMap,
  today,
  onOpen,
}: {
  ticket: Ticket;
  membersMap: Record<string, AvatarVM>;
  today: string;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
  });
  return (
    <TicketCard
      ref={setNodeRef}
      ticket={ticket}
      membersMap={membersMap}
      today={today}
      dragging={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      onClick={onOpen}
      {...attributes}
      {...listeners}
    />
  );
}

function Column({
  status,
  label,
  dot,
  tickets,
  membersMap,
  today,
  onOpenTicket,
  onNewTicket,
}: {
  status: TicketStatus;
  label: string;
  dot: string;
  tickets: Ticket[];
  membersMap: Record<string, AvatarVM>;
  today: string;
  onOpenTicket: (id: string) => void;
  onNewTicket: (status: TicketStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${status}` });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-full w-[288px] flex-none flex-col rounded-xl border bg-bg-2 p-2.5 transition-[border-color,box-shadow]',
        isOver ? 'border-primary shadow-[0_0_0_3px_var(--primary-soft)]' : 'border-border',
      )}
    >
      <div className="flex flex-none items-center gap-2 px-1 pb-3 pt-0.5">
        <span className="h-2 w-2 rounded-[3px]" style={{ background: dot }} />
        <span className="text-[12.5px] font-semibold tracking-tight">{label}</span>
        <span className="rounded-full border border-border bg-card-2 px-1.5 font-mono text-[11px] text-muted">
          {tickets.length}
        </span>
        <div className="flex-1" />
        <Plus
          size={13}
          weight="bold"
          className="cursor-pointer text-muted"
          onClick={() => onNewTicket(status)}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-0.5">
        <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tickets.map((t) => (
            <SortableTicket
              key={t.id}
              ticket={t}
              membersMap={membersMap}
              today={today}
              onOpen={() => onOpenTicket(t.id)}
            />
          ))}
        </SortableContext>
        {tickets.length === 0 && (
          <button
            onClick={() => onNewTicket(status)}
            className="rounded-[10px] border border-dashed border-border p-4 text-center text-[12px] text-muted hover:bg-card-2"
          >
            + Add ticket
          </button>
        )}
      </div>
    </div>
  );
}

export function Board({
  projectId,
  tickets,
  membersMap,
  today,
  onOpenTicket,
  onNewTicket,
}: BoardProps) {
  const move = useMoveTicket(projectId);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const grouped = groupByStatus(tickets);
  const active = tickets.find((t) => t.id === activeId) ?? null;

  function statusOf(id: string): TicketStatus | null {
    if (id.startsWith('col:')) return id.slice(4) as TicketStatus;
    return tickets.find((t) => t.id === id)?.status ?? null;
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const ticket = tickets.find((t) => t.id === active.id);
    if (!ticket) return;

    const toStatus = statusOf(String(over.id));
    if (!toStatus) return;

    const destColumn = grouped[toStatus].filter((t) => t.id !== ticket.id);
    let index = destColumn.length;
    if (!String(over.id).startsWith('col:')) {
      const overIdx = destColumn.findIndex((t) => t.id === over.id);
      if (overIdx !== -1) index = overIdx;
    }

    const before = index > 0 ? destColumn[index - 1] ?? null : null;
    const after = index < destColumn.length ? destColumn[index] ?? null : null;

    if (toStatus === ticket.status && before?.id === undefined && destColumn.length === 0) return;

    const optimisticPosition =
      before || after
        ? positionBetween(before?.position ?? null, after?.position ?? null)
        : positionAtEnd(destColumn[destColumn.length - 1]?.position ?? null);

    move.mutate({
      id: ticket.id,
      toStatus,
      beforePosition: before?.position ?? null,
      afterPosition: after?.position ?? null,
      optimisticPosition,
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-[18px]">
        <div className="flex h-full min-w-min gap-4">
          {TICKET_STATUS_LIST.map((s) => (
            <Column
              key={s.id}
              status={s.id}
              label={s.label}
              dot={s.dot}
              tickets={grouped[s.id]}
              membersMap={membersMap}
              today={today}
              onOpenTicket={onOpenTicket}
              onNewTicket={onNewTicket}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {active ? (
          <TicketCard ticket={active} membersMap={membersMap} today={today} className="rotate-2" />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
