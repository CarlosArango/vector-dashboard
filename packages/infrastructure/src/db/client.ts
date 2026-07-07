import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Schema = typeof schema;

export type Database = ReturnType<typeof createDatabase>;

/**
 * Drizzle client over Supabase Postgres. Uses a small pool suited to
 * serverless — point DATABASE_URL at the Supabase transaction pooler in prod.
 */
export function createDatabase(connectionString: string) {
  const queryClient = postgres(connectionString, { prepare: false, max: 5 });
  return drizzle(queryClient, { schema });
}

let cached: Database | undefined;

/** Singleton DB using DATABASE_URL — for server runtime. */
export function getDatabase(): Database {
  if (!cached) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    cached = createDatabase(url);
  }
  return cached;
}
