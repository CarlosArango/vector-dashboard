import { readSupabaseEnv } from '@vector/infrastructure/supabase';

export function supabaseEnv() {
  return readSupabaseEnv();
}

export function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return url;
}
