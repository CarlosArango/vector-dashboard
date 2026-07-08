#!/usr/bin/env -S npx tsx
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { getClient, getMode, initSupabase, resetToEnvAuth } from './supabase.js';
import { oauthLogin, passwordLogin } from './auth.js';
import { clearSession, readSession } from './session.js';
import { TABLES, type TableDef } from './tables.js';

const { mode: initialMode } = await initSupabase();

const server = new McpServer({ name: 'vector-supabase', version: '0.1.0' });

/** JSON result payload. */
function ok(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}
function fail(msg: string) {
  return { content: [{ type: 'text' as const, text: `Error: ${msg}` }], isError: true as const };
}

/** Strip undefined keys so we only send provided fields. */
function clean<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

function pkShape(t: TableDef): z.ZodRawShape {
  return Object.fromEntries(t.pk.map((c) => [c, t.columns[c]!.schema]));
}

function optionalCols(t: TableDef, exclude: string[] = []): z.ZodRawShape {
  return Object.fromEntries(
    Object.entries(t.columns)
      .filter(([name]) => !exclude.includes(name))
      .map(([name, def]) => [name, def.schema.optional()]),
  );
}

function createShape(t: TableDef): z.ZodRawShape {
  return Object.fromEntries(
    Object.entries(t.columns).map(([name, def]) => [
      name,
      def.required ? def.schema : def.schema.optional(),
    ]),
  );
}

function registerTable(t: TableDef) {
  const pkCols = t.pk;

  // list ---------------------------------------------------------------------
  server.tool(
    `${t.name}_list`,
    `List rows from ${t.name}. Optional column filters (exact match), limit, offset, order.`,
    {
      ...optionalCols(t),
      limit: z.number().int().positive().max(1000).optional().describe('Max rows (default 100)'),
      offset: z.number().int().nonnegative().optional(),
      order_by: z.string().optional().describe('Column to sort by'),
      ascending: z.boolean().optional().describe('Sort direction (default true)'),
    },
    async (args) => {
      const { limit, offset, order_by, ascending, ...filters } = args as Record<string, unknown>;
      let q = getClient().from(t.name).select('*');
      for (const [col, val] of Object.entries(clean(filters))) q = q.eq(col, val);
      if (order_by) q = q.order(order_by as string, { ascending: ascending !== false });
      const lim = (limit as number) ?? 100;
      const off = (offset as number) ?? 0;
      q = q.range(off, off + lim - 1);
      const { data, error } = await q;
      return error ? fail(error.message) : ok(data);
    },
  );

  // get ----------------------------------------------------------------------
  server.tool(
    `${t.name}_get`,
    `Get a single ${t.name} row by primary key (${pkCols.join(', ')}).`,
    pkShape(t),
    async (args) => {
      const { data, error } = await getClient()
        .from(t.name)
        .select('*')
        .match(clean(args as Record<string, unknown>))
        .maybeSingle();
      return error ? fail(error.message) : ok(data);
    },
  );

  // create -------------------------------------------------------------------
  server.tool(
    `${t.name}_create`,
    `Insert a row into ${t.name}. Returns the created row.`,
    createShape(t),
    async (args) => {
      const { data, error } = await getClient()
        .from(t.name)
        .insert(clean(args as Record<string, unknown>))
        .select();
      return error ? fail(error.message) : ok(data);
    },
  );

  // update -------------------------------------------------------------------
  server.tool(
    `${t.name}_update`,
    `Update a ${t.name} row identified by primary key (${pkCols.join(', ')}). Provide only fields to change.`,
    { ...pkShape(t), ...optionalCols(t, pkCols) },
    async (args) => {
      const all = clean(args as Record<string, unknown>);
      const key = Object.fromEntries(pkCols.map((c) => [c, all[c]]));
      const patch = Object.fromEntries(Object.entries(all).filter(([k]) => !pkCols.includes(k)));
      if (Object.keys(patch).length === 0) return fail('No fields to update.');
      const { data, error } = await getClient().from(t.name).update(patch).match(key).select();
      return error ? fail(error.message) : ok(data);
    },
  );

  // delete -------------------------------------------------------------------
  server.tool(
    `${t.name}_delete`,
    `Delete a ${t.name} row by primary key (${pkCols.join(', ')}). Returns the deleted row.`,
    pkShape(t),
    async (args) => {
      const { data, error } = await getClient()
        .from(t.name)
        .delete()
        .match(clean(args as Record<string, unknown>))
        .select();
      return error ? fail(error.message) : ok(data);
    },
  );
}

for (const t of TABLES) registerTable(t);

// Auth tools -----------------------------------------------------------------

server.tool(
  'login',
  'Sign in via Supabase OAuth (opens a browser, PKCE loopback). On success, all CRUD tools run as that user with RLS enforced. Provider must be enabled in Supabase Auth.',
  {
    provider: z
      .string()
      .optional()
      .describe('OAuth provider (google, github, …). Defaults to VECTOR_OAUTH_PROVIDER or google.'),
  },
  async (args) => {
    const provider = (args.provider as string) ?? process.env.VECTOR_OAUTH_PROVIDER ?? 'google';
    try {
      const { mode, email } = await oauthLogin(provider);
      return ok({ status: 'signed in', provider, email, mode });
    } catch (e) {
      return fail(e instanceof Error ? e.message : String(e));
    }
  },
);

server.tool(
  'login_password',
  'Sign in with a Supabase email + password. Switches CRUD tools to that user (RLS enforced). Works without any OAuth provider configured.',
  { email: z.string().email(), password: z.string() },
  async (args) => {
    try {
      const { mode, email } = await passwordLogin(args.email as string, args.password as string);
      return ok({ status: 'signed in', email, mode });
    } catch (e) {
      return fail(e instanceof Error ? e.message : String(e));
    }
  },
);

server.tool('logout', 'Clear the stored session and revert to env credentials (service-role/anon).', {}, async () => {
  clearSession();
  resetToEnvAuth();
  return ok({ status: 'logged out', mode: getMode() });
});

server.tool('whoami', 'Report the current auth mode and signed-in user (if any).', {}, async () => {
  const s = readSession();
  return ok({ mode: getMode(), user_email: s?.user_email ?? null });
});

const transport = new StdioServerTransport();
await server.connect(transport);
// stderr only — stdout is the MCP stream.
process.stderr.write(
  `vector-supabase MCP up — ${TABLES.length} tables, ${TABLES.length * 5 + 4} tools, auth: ${initialMode}\n`,
);
