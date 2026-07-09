'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUp, DotsThree, X } from '@phosphor-icons/react';
import type { Ticket, TicketPriority, TicketStatus } from '@vector/domain';
import {
  TICKET_PRIORITY_LIST,
  TICKET_STATUS_LIST,
  isOverdue,
} from '@vector/domain';
import { Sheet, SheetContent } from '@vector/ui/sheet';
import { Avatar } from '@vector/ui/avatar';
import { Button } from '@vector/ui/button';
import { Input } from '@vector/ui/input';
import { Textarea } from '@vector/ui/textarea';
import { cn } from '@vector/ui/lib/utils';
import { DueBadge } from './due-badge';
import { hexA } from './priority-badge';
import { useUpdateTicket } from '@/hooks/use-tickets';
import { addCommentAction, listCommentsAction } from '@/app/actions/comments';
import { formatDueFull } from '@/lib/format';
import type { AvatarVM } from '@/lib/view-models';

export interface CreateDraft {
  title: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string | null;
}

interface TicketSheetProps {
  open: boolean;
  /** null in create mode. */
  ticket: Ticket | null;
  /** Default status for a new draft; presence indicates create mode when ticket is null. */
  createStatus?: TicketStatus;
  /** True while the create mutation is in flight. */
  creating?: boolean;
  onCreate?: (values: CreateDraft) => void;
  projectId: string;
  projectName: string;
  projectColor: string;
  members: AvatarVM[];
  membersMap: Record<string, AvatarVM>;
  currentUser: AvatarVM;
  today: string;
  onClose: () => void;
}

export function TicketSheet({
  open,
  ticket,
  createStatus,
  creating = false,
  onCreate,
  projectId,
  projectName,
  projectColor,
  members,
  membersMap,
  currentUser,
  today,
  onClose,
}: TicketSheetProps) {
  const isCreate = !ticket;
  const update = useUpdateTicket(projectId);
  const qc = useQueryClient();
  // Initialized from the ticket (edit) or defaults (create); the parent remounts
  // this via `key` so no effect-based sync is needed.
  const [title, setTitle] = React.useState(() => ticket?.title ?? '');
  const [desc, setDesc] = React.useState(() => ticket?.description ?? '');
  const [draft, setDraft] = React.useState('');
  // Local field state used only in create mode.
  const [status, setStatus] = React.useState<TicketStatus>(
    () => ticket?.status ?? createStatus ?? 'backlog',
  );
  const [priority, setPriority] = React.useState<TicketPriority>(
    () => ticket?.priority ?? 'medium',
  );
  const [assigneeId, setAssigneeId] = React.useState<string | null>(
    () => ticket?.assigneeId ?? null,
  );

  const comments = useQuery({
    queryKey: ['comments', ticket?.id],
    queryFn: () => listCommentsAction(ticket!.id),
    enabled: !!ticket,
  });

  const addComment = useMutation({
    mutationFn: (body: string) => addCommentAction({ ticketId: ticket!.id, body }),
    onSuccess: () => {
      setDraft('');
      qc.invalidateQueries({ queryKey: ['comments', ticket?.id] });
    },
  });

  if (!open) return null;

  // Current values differ by mode: edit reads from the ticket, create from local state.
  const curStatus = isCreate ? status : ticket!.status;
  const curPriority = isCreate ? priority : ticket!.priority;
  const curAssignee = isCreate ? assigneeId : ticket!.assigneeId;

  function pickStatus(s: TicketStatus) {
    if (isCreate) setStatus(s);
    else update.mutate({ id: ticket!.id, status: s });
  }
  function pickPriority(p: TicketPriority) {
    if (isCreate) setPriority(p);
    else update.mutate({ id: ticket!.id, priority: p });
  }
  function pickAssignee(id: string) {
    const next = curAssignee === id ? null : id;
    if (isCreate) setAssigneeId(next);
    else update.mutate({ id: ticket!.id, assigneeId: next });
  }

  function commitTitle() {
    if (isCreate) return;
    if (title.trim() && title !== ticket!.title) update.mutate({ id: ticket!.id, title });
  }
  function commitDesc() {
    if (isCreate) return;
    if (desc !== ticket!.description) update.mutate({ id: ticket!.id, description: desc });
  }

  function submitCreate() {
    if (!title.trim() || creating) return;
    onCreate?.({
      title: title.trim(),
      description: desc.trim(),
      status,
      priority,
      assigneeId,
    });
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        {/* header */}
        <div className="flex h-14 flex-none items-center justify-between border-b border-border px-[18px]">
          <div className="flex items-center gap-2.5 font-mono text-[12px] text-muted">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: projectColor }} />
            {projectName} <span className="opacity-50">/</span>{' '}
            {isCreate ? 'New ticket' : ticket!.code}
          </div>
          <div className="flex items-center gap-1">
            {!isCreate && (
              <button className="flex h-[30px] w-[30px] items-center justify-center rounded-md text-muted hover:bg-card-2">
                <DotsThree size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-md text-muted hover:bg-card-2"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-[22px] pb-8 pt-[22px]">
          <Textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            placeholder={isCreate ? 'Ticket title' : undefined}
            rows={2}
            autoFocus={isCreate}
            className="mb-[18px] resize-none border-0 bg-transparent p-0 text-[20px] font-semibold leading-tight tracking-tight text-fg focus:ring-0"
          />

          <div className="grid grid-cols-[88px_1fr] items-center gap-x-3.5 gap-y-2.5 text-[13px]">
            <span className="text-muted">Status</span>
            <div className="flex flex-wrap gap-1.5">
              {TICKET_STATUS_LIST.map((s) => {
                const on = curStatus === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => pickStatus(s.id)}
                    className={cn(
                      'rounded-md border px-2.5 py-1 text-[12px] font-medium',
                      on
                        ? 'border-transparent bg-primary text-white'
                        : 'border-border bg-card-2 text-fg-2',
                    )}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            <span className="text-muted">Priority</span>
            <div className="flex flex-wrap gap-1.5">
              {TICKET_PRIORITY_LIST.map((p) => {
                const on = curPriority === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => pickPriority(p.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-medium',
                      on ? 'border-transparent' : 'border-border bg-card-2 text-fg-2',
                    )}
                    style={on ? { color: p.color, background: hexA(p.color, 0.14) } : undefined}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
                    {p.label}
                  </button>
                );
              })}
            </div>

            <span className="text-muted">Assignee</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {members.map((m) => {
                const on = curAssignee === m.id;
                return (
                  <button
                    key={m.id}
                    title={m.name}
                    onClick={() => pickAssignee(m.id)}
                    className="rounded-full"
                    style={{
                      opacity: on ? 1 : 0.55,
                      boxShadow: on ? '0 0 0 2px var(--bg-2), 0 0 0 4px var(--primary)' : 'none',
                    }}
                  >
                    <Avatar initials={m.initials} background={m.color} size={30} />
                  </button>
                );
              })}
            </div>

            {!isCreate && (
              <>
                <span className="text-muted">Due date</span>
                <div>
                  <DueBadge
                    date={ticket!.dueDate}
                    overdue={isOverdue(ticket!, today)}
                    fullLabel={formatDueFull(ticket!.dueDate)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="my-5 h-px bg-border" />
          <div className="mb-2.5 text-[12px] font-semibold text-fg-2">Description</div>
          <Textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onBlur={commitDesc}
            placeholder="Add a description…"
            className="min-h-24"
          />

          {isCreate ? (
            <div className="mt-6 flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={submitCreate} disabled={!title.trim() || creating}>
                {creating ? 'Creating…' : 'Create ticket'}
              </Button>
            </div>
          ) : (
            <>
              <div className="my-5 h-px bg-border" />
              <div className="mb-3.5 text-[12px] font-semibold text-fg-2">Activity</div>
              <div className="mb-4 flex flex-col gap-3.5">
                {(comments.data ?? []).map((c) => {
                  const author = membersMap[c.authorId];
                  return (
                    <div key={c.id} className="flex gap-2.5">
                      <Avatar
                        initials={author?.initials ?? '?'}
                        background={author?.color}
                        size={28}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-baseline gap-2">
                          <span className="text-[12.5px] font-semibold">{author?.name ?? 'User'}</span>
                        </div>
                        <div className="rounded-[9px] border border-border bg-card-2 px-3 py-2.5 text-[13px] leading-relaxed text-fg-2">
                          {c.body}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {comments.data?.length === 0 && (
                  <p className="text-[12.5px] text-muted">No activity yet.</p>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <Avatar initials={currentUser.initials} background={currentUser.color} size={28} />
                <div className="relative flex-1">
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && draft.trim()) {
                        e.preventDefault();
                        addComment.mutate(draft.trim());
                      }
                    }}
                    placeholder="Write a comment…"
                    className="h-[38px] pr-11"
                  />
                  <button
                    onClick={() => draft.trim() && addComment.mutate(draft.trim())}
                    className="absolute right-1.5 top-1.5 flex h-[26px] w-[26px] items-center justify-center rounded-md bg-primary text-white hover:brightness-110"
                  >
                    <ArrowUp size={14} weight="bold" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
