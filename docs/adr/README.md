# Architecture Decision Records

This directory records the significant architectural decisions made for **Vector**.
Each ADR is immutable once accepted; to change a decision, add a new ADR that
supersedes the old one (and update the old one's status).

Format: a lightweight [MADR](https://adr.github.io/madr/) — Status, Context,
Decision, Consequences, Alternatives considered.

| #    | Title                                                            | Status   |
| ---- | --------------------------------------------------------------- | -------- |
| 0001 | [Turborepo + pnpm monorepo](0001-monorepo-turborepo.md)         | Accepted |
| 0002 | [Clean architecture with a domain package](0002-clean-architecture.md) | Accepted |
| 0003 | [Next.js 16 App Router (RSC + Server Actions)](0003-nextjs-app-router.md) | Accepted |
| 0004 | [Supabase Postgres + Drizzle ORM](0004-supabase-drizzle.md)     | Accepted |
| 0005 | [RLS plus app-layer workspace scoping](0005-rls-and-app-authz.md) | Accepted |
| 0006 | [TanStack Query + Server Actions for data flow](0006-data-flow.md) | Accepted |
| 0007 | [dnd-kit with fractional indexing for the board](0007-board-dnd-fractional-index.md) | Accepted |
| 0008 | [Email + password auth, no confirmation](0008-email-password-auth.md) | Accepted |
