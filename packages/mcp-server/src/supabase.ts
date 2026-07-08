import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { WebSocket } from 'ws';
import { readSession, writeSession, type StoredSession } from './session.js';

// supabase-js eagerly builds a realtime client that needs a global WebSocket.
// Node < 22 has none; we never use realtime, so a polyfill just satisfies init.
if (!(globalThis as { WebSocket?: unknown }).WebSocket) {
  (globalThis as { WebSocket?: unknown }).WebSocket = WebSocket;
}

/**
 * Dev convenience: if Supabase env vars aren't already set (e.g. launched by an
 * MCP client that passes no env), load them from the web app's .env.local so the
 * committed MCP config stays secret-free. Never overwrites existing env.
 */
function loadEnvFallback() {
  if (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) return;
  const here = dirname(fileURLToPath(import.meta.url));
  const envPath = resolve(here, '../../../apps/web/.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]!] === undefined) {
      process.env[m[1]!] = m[2]!.replace(/^["']|["']$/g, '');
    }
  }
}
loadEnvFallback();

function env() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error('SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) is not set');
  return { url, anonKey, serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY };
}

const NO_PERSIST = { auth: { persistSession: false, autoRefreshToken: false } };

let active: SupabaseClient | undefined;
let mode = 'uninitialized';

export function getClient(): SupabaseClient {
  if (!active) throw new Error('Supabase client not initialised');
  return active;
}
export function getMode(): string {
  return mode;
}

function bearerClient(token: string): SupabaseClient {
  const { url, anonKey } = env();
  if (!anonKey) throw new Error('SUPABASE_ANON_KEY is required to use an access token');
  return createClient(url, anonKey, {
    ...NO_PERSIST,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

/** Anon client with PKCE + in-process storage — used only for the login flow. */
export function createAuthClient(): SupabaseClient {
  const { url, anonKey } = env();
  if (!anonKey) throw new Error('SUPABASE_ANON_KEY is required for login');
  const mem = new Map<string, string>();
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      flowType: 'pkce',
      storage: {
        getItem: (k: string) => mem.get(k) ?? null,
        setItem: (k: string, v: string) => void mem.set(k, v),
        removeItem: (k: string) => void mem.delete(k),
      },
    },
  });
}

/** Point CRUD tools at a signed-in user; persists the session for reuse. */
export function applySession(session: Session): void {
  active = bearerClient(session.access_token);
  mode = `user-token (RLS enforced)${session.user?.email ? ` — ${session.user.email}` : ''}`;
  const stored: StoredSession = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at ?? 0,
    user_email: session.user?.email ?? undefined,
  };
  writeSession(stored);
}

/** Drop the user session; fall back to service/anon env credentials. */
export function resetToEnvAuth(): void {
  const { serviceKey } = env();
  if (serviceKey) {
    const { url } = env();
    active = createClient(url, serviceKey, NO_PERSIST);
    mode = 'service-role (RLS bypassed)';
  } else {
    const { url, anonKey } = env();
    if (!anonKey) throw new Error('No credentials: set a token, service role, or anon key');
    active = createClient(url, anonKey, NO_PERSIST);
    mode = 'anon (RLS as anonymous)';
  }
}

async function tryPersistedSession(): Promise<boolean> {
  const s = readSession();
  if (!s) return false;
  const now = Math.floor(Date.now() / 1000);
  if (s.expires_at > now + 60) {
    active = bearerClient(s.access_token);
    mode = `user-token (RLS enforced)${s.user_email ? ` — ${s.user_email}` : ''}`;
    return true;
  }
  // Expired — attempt refresh.
  try {
    const auth = createAuthClient();
    const { data, error } = await auth.auth.refreshSession({ refresh_token: s.refresh_token });
    if (error || !data.session) return false;
    applySession(data.session);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve auth at startup. Precedence:
 *   1. SUPABASE_ACCESS_TOKEN env (explicit user JWT)
 *   2. persisted login session (refreshed if expired)
 *   3. SUPABASE_SERVICE_ROLE_KEY (admin)
 *   4. anon
 */
export async function initSupabase(): Promise<{ mode: string }> {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (token) {
    active = bearerClient(token);
    mode = 'user-token (RLS enforced, from env)';
    return { mode };
  }
  if (await tryPersistedSession()) return { mode };
  resetToEnvAuth();
  return { mode };
}
