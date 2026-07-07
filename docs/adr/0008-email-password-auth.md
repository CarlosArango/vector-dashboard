# 0008 — Email + password auth, no confirmation

- **Status:** Accepted
- **Date:** 2026-07-07

## Context

The design prototype showed magic-link + Google sign-in. In practice the team
wanted the simplest possible credential flow for this app: email and password,
with no email-confirmation step, and a clean first-run experience (no seeded
demo data).

## Decision

Use **Supabase email + password** authentication.

- `/login` offers Sign in (`signInWithPassword`) and Sign up (`signUp`) with a
  toggle. No magic link, no OAuth, no "check your inbox" screen.
- `enable_confirmations = false` in `supabase/config.toml`, so a sign-up returns
  a session immediately.
- Sessions are cookie-based via `@supabase/ssr`; `proxy.ts` refreshes them and
  guards routes.
- On sign-up, a DB trigger (`handle_new_user`) creates the user's **profile**
  and a **personal workspace** (`"<name>'s Workspace"`, owner role), so every
  new account starts in an empty but usable space.
- No seed data — `supabase/seed.sql` is empty. The projects screen shows the
  empty state until the user creates their first project.

This **supersedes** the magic-link + Google flow shown in the prototype. The
Google provider block remains in `config.toml`, disabled, for future use.

## Consequences

- Lowest-friction sign-up; no mail server needed for auth in any environment.
- Each user is isolated in their own workspace by default.
- No email verification means no built-in protection against typo'd or
  unowned email addresses — acceptable for the current scope; revisit before
  opening public sign-ups.
- Password minimum length is 6 (Supabase default); tighten for production.

## Alternatives considered

- **Magic link (prototype default)** — passwordless and nice, but needs a
  deliverable mail path and a redirect/callback flow; more moving parts.
- **Google OAuth** — good UX, but requires provider credentials and user sync;
  kept available but disabled.
- **Shared demo workspace for new users** — simpler seed story, but conflates
  tenants; replaced by per-user workspace bootstrap.
