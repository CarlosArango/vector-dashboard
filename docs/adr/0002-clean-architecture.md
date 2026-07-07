# 0002 — Clean architecture with a domain package

- **Status:** Accepted
- **Date:** 2026-07-07

## Context

The core value of the app is its business rules: how tickets get codes, how
positions are computed on move, what makes input valid. Those rules must be
testable without a database or a browser, and must not rot into framework glue.

## Decision

Adopt **clean architecture** with dependencies pointing inward:

```
apps/web  →  @vector/domain  ←  @vector/infrastructure
```

- **`@vector/domain`** — entities, enums, repository *interfaces*, and use-cases.
  Pure TypeScript, zero runtime dependencies. Use-cases are functions of the
  shape `(deps, input) => result`, where `deps` are repository interfaces.
- **`@vector/infrastructure`** — Drizzle-backed *implementations* of those
  interfaces, plus Supabase client adapters.
- **`apps/web`** — the composition root. It wires concrete repositories into
  use-cases and exposes them through Server Actions and RSC.

Business errors are modelled as `DomainError` subclasses; time is injected via a
`Clock` port to keep use-cases deterministic.

## Consequences

- Use-cases are unit-tested with in-memory fake repositories (`create-ticket`,
  `move-ticket` specs) — fast, no DB.
- Swapping the persistence layer (e.g. Prisma, or a different DB) touches only
  `@vector/infrastructure`.
- The domain never imports `next`, `postgres`, or `@supabase/*`.
- Cost: more indirection (interface + implementation + wiring) than calling the
  DB directly from a route.

## Alternatives considered

- **Active Record / call the ORM from routes** — faster to write, but business
  rules become untestable without a DB and leak across the app.
- **Full hexagonal with DTOs at every boundary** — more ceremony than this app
  needs; entities are shared directly where safe.
