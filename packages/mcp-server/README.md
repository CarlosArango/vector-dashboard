# @vector/mcp-server

Model Context Protocol (MCP) server exposing generic **CRUD** over every Vector
Supabase table. Lets Claude (or any MCP client) read/write the DB through tools
instead of raw SQL. Backed by `supabase-js`, so **Row Level Security applies**
according to the credentials it runs with.

## Tools

Five tools per table (`<table>_list`, `_get`, `_create`, `_update`, `_delete`)
across all 7 tables — **35 tools total**:

`profiles`, `workspaces`, `workspace_members`, `projects`, `project_members`,
`tickets`, `comments`.

- `_list` — optional exact-match column filters + `limit` / `offset` / `order_by` / `ascending`
- `_get` — by primary key
- `_create` — insert; required (NOT NULL, no default) columns are enforced
- `_update` — by primary key; pass only the fields to change
- `_delete` — by primary key; returns the deleted row

Composite-key tables (`workspace_members`, `project_members`) take both key
columns for get/update/delete.

### Auth tools (4)

- `login` — Supabase **OAuth** (PKCE loopback). Opens a browser to the provider,
  catches the redirect on `http://localhost:54121/callback`, exchanges the code,
  and switches every CRUD tool to run **as that user (RLS enforced)**. Provider:
  arg → `VECTOR_OAUTH_PROVIDER` → `google`. The provider must be **enabled in
  Supabase Auth**, and the redirect URL allow-listed (already added to
  `supabase/config.toml`). Port override: `VECTOR_OAUTH_PORT`.
- `login_password` — email + password sign-in. Works with no OAuth provider
  configured; handy for local testing.
- `logout` — clear the stored session, revert to env credentials.
- `whoami` — report current auth mode and signed-in user.

The session (access + refresh token) is cached at `~/.vector-mcp/session.json`
(mode `600`) and reused on next startup; expired sessions auto-refresh.

## Auth (precedence)

Resolved at startup; a user identity always wins so you never get admin access
by accident:

1. `SUPABASE_ACCESS_TOKEN` env — user JWT → **as that user, RLS enforced**
2. persisted `login` session — refreshed if expired → **RLS enforced**
3. `SUPABASE_SERVICE_ROLE_KEY` — admin, **RLS bypassed**
4. anon only — RLS as anonymous (most tables return `permission denied`)

Call `login` / `login_password` at runtime to switch to a user session (jumps to
the top of that list); `logout` reverts to env credentials.

Env vars (either name works):

- `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` (required)
- `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_ACCESS_TOKEN` (optional user JWT)
- `SUPABASE_SERVICE_ROLE_KEY` (optional admin)

If none are set in the environment, the server falls back to
`apps/web/.env.local` so the committed MCP config stays secret-free.

## Run

```bash
pnpm --filter @vector/mcp-server start   # stdio MCP server
pnpm --filter @vector/mcp-server dev     # watch mode
```

## Connect (already wired in repo `.mcp.json`)

```json
{
  "mcpServers": {
    "vector-db": {
      "command": "pnpm",
      "args": ["-s", "--filter", "@vector/mcp-server", "exec", "tsx", "src/index.ts"]
    }
  }
}
```

In Claude Code: reload, then `/mcp` → `vector-db` should list 35 tools. To force
RLS-scoped access, add `"env": { "SUPABASE_ACCESS_TOKEN": "<user-jwt>" }` to that
block (overrides the service-role fallback).

## Notes

- `ws` is polyfilled onto `globalThis.WebSocket` because supabase-js on Node < 22
  eagerly builds a realtime client; realtime itself is unused here.
- Adding a table: append it to `src/tables.ts` — tools are generated from the
  registry, no handler code to write.
