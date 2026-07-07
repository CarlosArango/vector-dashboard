import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseEnv } from './types';

export function createSupabaseBrowserClient(env: SupabaseEnv) {
  return createBrowserClient(env.url, env.anonKey);
}
