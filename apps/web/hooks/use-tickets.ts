'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Ticket, TicketStatus } from '@vector/domain';
import type { CreateTicketValues, UpdateTicketValues } from '@vector/validation';
import { listTicketsAction } from '@/app/actions/tickets';
import {
  createTicketAction,
  moveTicketAction,
  updateTicketAction,
} from '@/app/actions/tickets';

export function ticketsKey(projectId: string) {
  return ['tickets', projectId] as const;
}

export function useTickets(projectId: string, initialData?: Ticket[]) {
  return useQuery({
    queryKey: ticketsKey(projectId),
    queryFn: () => listTicketsAction(projectId),
    initialData,
  });
}

export interface MoveArgs {
  id: string;
  toStatus: TicketStatus;
  beforePosition?: number | null;
  afterPosition?: number | null;
  /** Optimistic position for immediate reordering. */
  optimisticPosition: number;
}

export function useMoveTicket(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: MoveArgs) =>
      moveTicketAction({
        id: args.id,
        toStatus: args.toStatus,
        beforePosition: args.beforePosition,
        afterPosition: args.afterPosition,
      }),
    onMutate: async (args) => {
      await qc.cancelQueries({ queryKey: ticketsKey(projectId) });
      const prev = qc.getQueryData<Ticket[]>(ticketsKey(projectId));
      qc.setQueryData<Ticket[]>(ticketsKey(projectId), (old) =>
        (old ?? []).map((t) =>
          t.id === args.id
            ? { ...t, status: args.toStatus, position: args.optimisticPosition }
            : t,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(ticketsKey(projectId), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ticketsKey(projectId) }),
  });
}

export function useUpdateTicket(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTicketValues) => updateTicketAction(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ticketsKey(projectId) });
      const prev = qc.getQueryData<Ticket[]>(ticketsKey(projectId));
      qc.setQueryData<Ticket[]>(ticketsKey(projectId), (old) =>
        (old ?? []).map((t) => (t.id === input.id ? { ...t, ...input } : t)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(ticketsKey(projectId), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ticketsKey(projectId) }),
  });
}

export function useCreateTicket(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTicketValues) => createTicketAction(input),
    onSettled: () => qc.invalidateQueries({ queryKey: ticketsKey(projectId) }),
  });
}
