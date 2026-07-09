'use client';

import * as React from 'react';
import {
  CaretDown,
  FunnelSimple,
  Kanban,
  MagnifyingGlass,
  Plus,
  Rows,
} from '@phosphor-icons/react';
import type { TicketStatus } from '@vector/domain';
import { Button } from '@vector/ui/button';
import { Input } from '@vector/ui/input';
import { AvatarStack } from '@vector/ui/avatar';
import { SegmentedControl } from '@vector/ui/segmented-control';
import { Board } from './board';
import { BoardSkeleton } from './board-skeleton';
import { ListTable } from './list-table';
import { TicketSheet } from './ticket-sheet';
import { useCreateTicket, useTickets } from '@/hooks/use-tickets';
import type { AvatarVM } from '@/lib/view-models';

interface ProjectViewProps {
  project: { id: string; name: string; color: string };
  projectAvatars: AvatarVM[];
  members: AvatarVM[];
  membersMap: Record<string, AvatarVM>;
  today: string;
  currentUser: AvatarVM;
}

export function ProjectView({
  project,
  projectAvatars,
  members,
  membersMap,
  today,
  currentUser,
}: ProjectViewProps) {
  const { data: tickets = [], isPending } = useTickets(project.id);
  const createTicket = useCreateTicket(project.id);
  const [view, setView] = React.useState<'board' | 'list'>('board');
  const [search, setSearch] = React.useState('');
  const [openId, setOpenId] = React.useState<string | null>(null);

  // Gate the data-dependent content so the server render and the first client
  // paint both show the skeleton — a warm React Query cache would otherwise
  // hydrate different HTML than the (empty) server render and mismatch.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const showSkeleton = !mounted || (isPending && tickets.length === 0);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? tickets.filter((t) => t.title.toLowerCase().includes(q) || t.code.toLowerCase().includes(q))
    : tickets;

  const openTicket = tickets.find((t) => t.id === openId) ?? null;

  async function handleNewTicket(status: TicketStatus = 'backlog') {
    const res = await createTicket.mutateAsync({ projectId: project.id, title: 'Untitled ticket', status });
    if (res.ok && res.data) setOpenId(res.data.id);
  }

  return (
    <>
      <header className="flex h-[57px] flex-none items-center justify-between gap-4 border-b border-border px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="h-[11px] w-[11px] flex-none rounded-[4px]" style={{ background: project.color }} />
          <h1 className="truncate text-[15px] font-semibold tracking-tight">{project.name}</h1>
          <CaretDown size={13} className="text-muted" />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets"
              className="h-[34px] w-[190px] bg-card-2 pl-[30px] text-[13px]"
            />
          </div>
          <Button variant="secondary" size="sm" className="h-[34px]">
            <FunnelSimple size={14} /> Filter
          </Button>
          <SegmentedControl<'board' | 'list'>
            value={view}
            onValueChange={setView}
            options={[
              { value: 'board', label: (<><Kanban size={14} weight="bold" /> Board</>) },
              { value: 'list', label: (<><Rows size={14} weight="bold" /> List</>) },
            ]}
          />
          <div className="mx-0.5 h-[22px] w-px bg-border" />
          <div className="flex items-center">
            <AvatarStack members={projectAvatars} size={28} />
            <div className="-ml-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-dashed border-border bg-card-2 text-muted">
              <Plus size={12} weight="bold" />
            </div>
          </div>
          <Button size="sm" className="h-[34px]" onClick={() => handleNewTicket('backlog')}>
            <Plus size={13} weight="bold" /> New Ticket
          </Button>
        </div>
      </header>

      {showSkeleton ? (
        <BoardSkeleton />
      ) : view === 'board' ? (
        <Board
          projectId={project.id}
          tickets={filtered}
          membersMap={membersMap}
          today={today}
          onOpenTicket={setOpenId}
          onNewTicket={handleNewTicket}
        />
      ) : (
        <ListTable
          tickets={filtered}
          membersMap={membersMap}
          today={today}
          onOpenTicket={setOpenId}
        />
      )}

      <TicketSheet
        key={openTicket?.id ?? 'none'}
        ticket={openTicket}
        projectId={project.id}
        projectName={project.name}
        projectColor={project.color}
        members={members}
        membersMap={membersMap}
        currentUser={currentUser}
        today={today}
        onClose={() => setOpenId(null)}
      />
    </>
  );
}
