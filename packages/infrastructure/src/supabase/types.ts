export interface CookieItem {
  name: string;
  value: string;
}

export interface CookieOptions {
  [key: string]: unknown;
}

export interface CookieAdapter {
  getAll(): CookieItem[] | Promise<CookieItem[]>;
  setAll(cookies: Array<CookieItem & { options?: CookieOptions }>): void | Promise<void>;
}

export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

export function readSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set');
  }
  return { url, anonKey };
}
