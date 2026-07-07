# 0001 — Turborepo + pnpm monorepo

- **Status:** Accepted
- **Date:** 2026-07-07

## Context

Vector is a single product but is composed of several concerns that benefit from
strong boundaries: business rules, data access, a reusable UI kit, shared
validation, and the Next.js app itself. We want those boundaries enforced by
package structure (not just folders), fast incremental builds, and a single
`pnpm install`.

## Decision

Use a **Turborepo** monorepo managed with **pnpm workspaces**.

```
apps/web              Next.js application
packages/domain       pure business rules
packages/infrastructure  Drizzle + Supabase adapters
packages/ui           design tokens + components
packages/validation   Zod schemas
packages/typescript-config, packages/eslint-config  shared tooling
```

`turbo.json` defines the `build`, `lint`, `typecheck`, `test` pipelines with
`^build` dependencies and output caching. Workspace packages are consumed by
name (`@vector/*`) and transpiled by Next via `transpilePackages`.

## Consequences

- Clean-architecture layers (ADR 0002) are enforced at the package boundary —
  `@vector/domain` literally cannot import framework code.
- One lockfile, one install, shared tsconfig/eslint bases.
- Turbo caching keeps CI fast; the dependency-free `domain` package tests run in
  isolation and are cheap.
- Slight upfront overhead: package.json/tsconfig per package, and Next must be
  told to transpile the workspace packages.

## Alternatives considered

- **Single Next.js app, folders for layers** — no enforced boundaries; easy to
  leak Postgres/Next imports into business rules.
- **Nx** — more powerful but heavier; Turbo + pnpm is sufficient here.
