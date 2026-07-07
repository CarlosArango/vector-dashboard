'use client';

import { createSupabaseBrowserClient, readSupabaseEnv } from '@vector/infrastructure/supabase';

let cached: ReturnType<typeof createSupabaseBrowserClient> | undefined;

export function getBrowserSupabase() {
  if (!cached) {
    cached = createSupabaseBrowserClient({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    });
  }
  return cached;
}

export { readSupabaseEnv };
