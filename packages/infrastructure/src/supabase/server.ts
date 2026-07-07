import { createServerClient } from '@supabase/ssr';
import type { CookieAdapter, SupabaseEnv } from './types';

/**
 * Server-side Supabase client. The cookie adapter is injected by the host
 * (e.g. Next's next/headers cookies) so this package stays framework-agnostic.
 */
export function createSupabaseServerClient(env: SupabaseEnv, cookies: CookieAdapter) {
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll: () => cookies.getAll(),
      setAll: (all: Parameters<CookieAdapter['setAll']>[0]) => cookies.setAll(all),
    },
  });
}
