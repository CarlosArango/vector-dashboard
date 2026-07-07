import 'server-only';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@vector/infrastructure/supabase';
import { supabaseEnv } from '../env';

/** Server-side Supabase client bound to Next's async cookie store. */
export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createSupabaseServerClient(supabaseEnv(), {
    getAll: () => cookieStore.getAll(),
    setAll: (all) => {
      try {
        for (const { name, value, options } of all) {
          cookieStore.set(name, value, options);
        }
      } catch {
        // Called from a Server Component where cookies are read-only; the
        // proxy refreshes the session so this can be safely ignored.
      }
    },
  });
}

/** Returns the authenticated user or null. */
export async function getCurrentUser() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
