# 0003 — Next.js 16 App Router (RSC + Server Actions)

- **Status:** Accepted
- **Date:** 2026-07-07

## Context

The product needs SEO-irrelevant but auth-gated, data-heavy screens with fast
interactions (board, list, ticket panel), deployed to Vercel. We want reads on
the server (close to the DB, RLS-enforced) and mutations without hand-rolling an
API layer.

## Decision

Use **Next.js 16** with the **App Router**. Reads happen in **React Server
Components**; writes go through **Server Actions** that validate with Zod and
invoke domain use-cases. Deploy target is **Vercel**.

Next 16 specifics that shaped the code:

- The `middleware` convention is renamed to **`proxy.ts`** (Node runtime, not
  edge). Session refresh + route guarding live there.
- Request APIs are **async**: `cookies()` is awaited, and route `params` are
  `Promise`-typed and awaited.
- The bundled Next docs under `node_modules/next/dist/docs` are the source of
  truth for these breaking changes.

## Consequences

- No separate REST/GraphQL layer for mutations — Server Actions call use-cases
  directly; client cache reconciliation is handled by TanStack Query (ADR 0006).
- `proxy.ts` runs on Node, which suits the Supabase SSR client.
- Workspace packages must be listed in `transpilePackages`; `postgres` is marked
  a server-external package.
- Tied to a fast-moving framework; upgrades require re-reading breaking changes.

## Alternatives considered

- **Next Pages Router** — mature but no RSC/Server Actions; more client JS.
- **Remix / TanStack Start** — viable, but Next on Vercel is the lowest-friction
  path and the team's default.
