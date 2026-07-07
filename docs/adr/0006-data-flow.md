# 0006 — TanStack Query + Server Actions for data flow

- **Status:** Accepted
- **Date:** 2026-07-07

## Context

The board and ticket panel need instant, Trello-like feedback: dragging a card
or changing a status should update the UI immediately and reconcile with the
server. Server Components give us fast first paint but no client cache for
interactive mutation.

## Decision

- **Reads:** Server Components fetch via domain use-cases and pass initial data
  down as props.
- **Client cache:** **TanStack Query** owns the interactive ticket state, seeded
  with `initialData` from the server (query key `['tickets', projectId]`).
- **Writes:** **Server Actions** validate with Zod and call use-cases. Client
  mutations wrap those actions with **optimistic updates** (`onMutate` patches
  the cache, `onError` rolls back, `onSettled` invalidates).
- Comments use their own query/mutation keyed by ticket.

## Consequences

- Drag and field edits feel instant; the server reconciles in the background.
- No bespoke REST endpoints — actions double as the mutation API, and are also
  callable as query functions (e.g. `listTicketsAction`).
- Two sources of truth (RSC props + Query cache) coexist via `initialData`;
  invalidation keeps them consistent.
- Slightly more moving parts than pure Server Actions with `revalidatePath`.

## Alternatives considered

- **Server Actions + `revalidatePath` only** — simplest, but drag-and-drop
  optimistic UX is hard without a client cache.
- **SWR** — lighter, but fewer mutation/optimistic primitives than TanStack.
- **Realtime subscriptions now** — deferred to phase 2 (see README); the query
  keys are structured so Supabase Realtime can invalidate them later.
