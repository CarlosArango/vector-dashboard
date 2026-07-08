import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { type Session } from '@supabase/supabase-js';
import { applySession, createAuthClient, getMode } from './supabase.js';

const PORT = Number(process.env.VECTOR_OAUTH_PORT ?? 54121);
const REDIRECT = `http://localhost:${PORT}/callback`;

function openBrowser(url: string) {
  const cmd =
    process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  spawn(cmd, [url], { stdio: 'ignore', detached: true, shell: process.platform === 'win32' }).unref();
}

/** Wait for the OAuth provider to redirect back with a `code`. */
function waitForCode(timeoutMs: number): Promise<string> {
  return new Promise((resolveCode, reject) => {
    const server = createServer((req, res) => {
      const u = new URL(req.url ?? '/', REDIRECT);
      if (u.pathname !== '/callback') {
        res.writeHead(404).end();
        return;
      }
      const code = u.searchParams.get('code');
      const err = u.searchParams.get('error_description') ?? u.searchParams.get('error');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(
        `<html><body style="font-family:sans-serif;padding:2rem">${
          code ? 'Signed in. You can close this tab.' : `Login failed: ${err ?? 'no code'}`
        }</body></html>`,
      );
      server.close();
      clearTimeout(timer);
      if (code) resolveCode(code);
      else reject(new Error(err ?? 'No authorization code returned'));
    });
    const timer = setTimeout(() => {
      server.close();
      reject(new Error('Login timed out'));
    }, timeoutMs);
    server.listen(PORT);
  });
}

/**
 * Supabase OAuth via PKCE loopback: open the provider in a browser, catch the
 * redirect on localhost, exchange the code for a session, and switch CRUD tools
 * to run as that user (RLS enforced). The session is persisted for reuse.
 */
export async function oauthLogin(provider: string): Promise<{ mode: string; email?: string }> {
  const auth = createAuthClient(); // same instance holds the PKCE verifier
  const { data, error } = await auth.auth.signInWithOAuth({
    provider: provider as never,
    options: { redirectTo: REDIRECT, skipBrowserRedirect: true },
  });
  if (error) throw new Error(`signInWithOAuth failed: ${error.message}`);
  if (!data?.url) throw new Error('No authorization URL returned');

  const codePromise = waitForCode(180_000);
  openBrowser(data.url);
  const code = await codePromise;

  const { data: exchanged, error: exErr } = await auth.auth.exchangeCodeForSession(code);
  if (exErr || !exchanged.session) {
    throw new Error(`Code exchange failed: ${exErr?.message ?? 'no session'}`);
  }
  return finalize(exchanged.session);
}

/** Email + password sign-in — works on any Supabase without provider config. */
export async function passwordLogin(
  email: string,
  password: string,
): Promise<{ mode: string; email?: string }> {
  const auth = createAuthClient();
  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw new Error(`Password login failed: ${error?.message ?? 'no session'}`);
  return finalize(data.session);
}

function finalize(session: Session): { mode: string; email?: string } {
  applySession(session);
  return { mode: getMode(), email: session.user?.email ?? undefined };
}

export function authUrl(): string {
  return REDIRECT;
}
