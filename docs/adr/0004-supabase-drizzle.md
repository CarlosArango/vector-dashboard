# 0004 — Supabase Postgres + Drizzle ORM

- **Status:** Accepted
- **Date:** 2026-07-07

## Context

We need a relational store (projects → tickets → comments, membership joins),
authentication, and row-level authorization, without standing up bespoke infra.
We also want type-safe queries that fit the repository pattern from ADR 0002.

## Decision

Use **Supabase** for Postgres + Auth, and **Drizzle ORM** for typed data access
inside `@vector/infrastructure`.

- Schema, enums (`ticket_status`, `ticket_priority`), indexes, RLS policies, and
  triggers live in `supabase/migrations` (hand-authored SQL — RLS and triggers
  aren't expressible in Drizzle).
- The Drizzle schema in `packages/infrastructure/src/db/schema.ts` mirrors that
  SQL and is the type source for repositories.
- Connection is `postgres-js` with `prepare: false` and a small pool, suited to
  serverless (point `DATABASE_URL` at the Supabase transaction pooler in prod).
- Local dev runs the Supabase CLI stack (Docker); ports are remapped to `552xx`
  in `supabase/config.toml` to coexist with other local stacks.

## Consequences

- One vendor covers DB, auth, and local tooling (Mailpit, Studio).
- Migrations are plain SQL — full control over RLS/triggers, at the cost of
  keeping the Drizzle schema in sync by hand.
- Drizzle gives type-safe queries and prepared statements with a tiny runtime
  and fast cold starts.

## Alternatives considered

- **Prisma** — great DX, but heavier client and slower serverless cold starts;
  RLS still needs raw SQL.
- **supabase-js (PostgREST) only** — no separate ORM, but weaker types on joins
  and awkward inside a repository abstraction.
- **Plain `pg`** — no type safety.
