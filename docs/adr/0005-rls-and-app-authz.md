# 0005 — RLS plus app-layer workspace scoping

- **Status:** Accepted
- **Date:** 2026-07-07

## Context

Data is multi-tenant by workspace. Two facts are in tension:

1. We want authorization enforced at the database (defense in depth), and
2. Drizzle connects with the Postgres service role (via `DATABASE_URL`), which
   **bypasses RLS**. Threading a per-request JWT/role into every Drizzle
   connection to make RLS apply is complex and slow.

## Decision

Use **both layers, with clear responsibilities**:

- **Row-Level Security** is enabled on every table and gates access by workspace
  membership, via `SECURITY DEFINER` helpers (`is_workspace_member`,
  `can_access_project`, `can_access_ticket`). This protects the PostgREST/anon
  surface and any direct Supabase client access.
- **The application layer** is the primary enforcement for server-side data
  access: `requireAuthContext()` resolves the authenticated user's workspace,
  and every read/write is scoped to that `workspaceId`. Server Actions call
  `assertProjectAccess()` before mutating.

## Consequences

- No cross-tenant leak path: the app never issues an unscoped query, and RLS
  backstops any client-side access.
- Reads via Drizzle are simple and fast (no per-request role switching).
- The trade-off is explicit and documented: RLS is *defense in depth*, not the
  sole gate for the trusted server connection. This is called out in the README.

## Alternatives considered

- **RLS-only, run Drizzle as `authenticated` with request JWT claims** — truest
  enforcement, but per-request `set local role` / claims injection adds latency
  and complexity for a single-workspace-per-user app.
- **App-layer only, no RLS** — loses defense in depth and leaves the PostgREST
  surface open.
