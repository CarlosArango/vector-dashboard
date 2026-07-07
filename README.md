# Vector

A lightweight Trello/Jira-style project management dashboard. Create projects, track tickets across a Kanban board or list view, drag between columns, and manage details (assignee, priority, due date, description, comments) in a side panel.

Built as a **Turborepo** monorepo with **clean architecture**.

## Stack

| Concern         | Choice                                             |
| --------------- | -------------------------------------------------- |
| Monorepo        | Turborepo + pnpm                                   |
| Framework       | Next.js 16 (App Router, RSC, Server Actions)       |
| Styling         | Tailwind v4 + shadcn-style primitives              |
| Database / Auth | Supabase (Postgres + Auth, email + password)       |
| ORM             | Drizzle                                            |
| Server state    | TanStack Query (optimistic board/ticket updates)   |
| Drag & drop     | dnd-kit                                            |
| Validation      | Zod (shared client + server)                       |
| Tests           | Vitest (unit) + Playwright (e2e)                   |

## Architecture

Dependencies point inward: `apps/web → @vector/domain ← @vector/infrastructure`.

```
apps/web              Next.js — presentation + composition root (actions, RSC, UI)
packages/
  domain              Entities, enums, repository INTERFACES, use-cases (pure TS, zero deps)
  infrastructure      Drizzle schema + repository IMPLEMENTATIONS, Supabase adapters
  ui                  Design tokens + shadcn-style primitives (Tailwind v4)
  validation          Zod schemas shared across the client/server boundary
  typescript-config   Shared tsconfig bases
  eslint-config       Shared flat ESLint config
supabase/             Migrations, RLS policies, seed (mirrors the design prototype)
```

- **Use-cases** are pure `(deps, input) => result` functions, unit-tested with in-memory repositories.
- **Server Actions** validate input with Zod, resolve the authenticated user's workspace, and invoke use-cases with Drizzle repositories.
- **Reads** happen in Server Components; **writes** go through Server Actions with optimistic TanStack Query updates.
- **RLS** gates every table by workspace membership (defense in depth); the app layer additionally scopes all queries to the authenticated user's workspace.

## Prerequisites

- Node 20.9+ (Supabase recommends Node 22)
- pnpm 9
- Docker (for local Supabase)
- Supabase CLI

## Getting started

```bash
pnpm install

# Start local Supabase (Postgres, Auth, Mailpit). Ports are remapped to the
# 552xx range in supabase/config.toml to avoid clashing with other local stacks.
supabase start

# Apply schema + seed (mirrors the Vector design: Acme Labs workspace, 4 projects,
# 12 Atlas tickets, 4 members).
supabase db reset --local

# Copy env and fill from `supabase start` output (values are pre-filled for the
# default local ports in .env.example).
cp apps/web/.env.example apps/web/.env.local

pnpm dev            # http://localhost:3000
```

### Signing in (local)

Auth is **email + password**, no email confirmation (`enable_confirmations = false`).

- Seeded demo users all use password **`password123`** — e.g. `jordan@acme.co`, `mara@acme.co`, `rafael@acme.co`, `aisha@acme.co`.
- Or hit **Sign up** on `/login` to create a new account — it signs you in immediately.

New sign-ups are auto-added to the seeded demo workspace (a dev-only DB trigger; remove for production).

## Scripts

```bash
pnpm dev          # run all dev servers (turbo)
pnpm build        # production build
pnpm typecheck    # tsc across all packages
pnpm lint         # eslint across all packages
pnpm test         # Vitest unit tests (domain use-cases, utils)
pnpm --filter web e2e   # Playwright e2e (needs supabase + dev server running)
pnpm db:reset     # reset local db + reseed
```

## Deployment (Vercel)

The app is Vercel-ready. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
and `DATABASE_URL` (point at the Supabase transaction pooler for serverless) in project env.
`proxy.ts` runs on the Node runtime and refreshes the Supabase session on every request.

## Phase 2 (not yet built)

Supabase Realtime board sync · My Tickets + Inbox views · richer filtering ·
avatar uploads · project/member management UI.
