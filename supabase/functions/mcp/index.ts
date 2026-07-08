// supabase/functions/mcp/index.ts
//
// Remote MCP server for Claude (Desktop/web/mobile). Exposes Vector project /
// ticket tools over stateless Streamable HTTP. Authorization is OAuth 2.1:
// Supabase Auth is the authorization server, this function is the resource
// server. Each request carries a Bearer JWT; queries run through a client built
// from that token, so RLS scopes everything to the caller's workspace.
import { z } from 'npm:zod@3.25.76';
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { McpServer } from 'npm:@modelcontextprotocol/sdk@1.29.0/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from 'npm:@modelcontextprotocol/sdk@1.29.0/server/webStandardStreamableHttp.js';

import {
  addCommentShape,
  buildUpdatePatch,
  createProjectShape,
  createTicketShape,
  deleteTicketShape,
  listCommentsShape,
  listProjectsShape,
  listTicketsShape,
  nextPosition,
  ticketCode,
  today,
  updateTicketShape,
  type ProjectRow,
} from './domain.ts';

import {
  bearerToken,
  isMetadataPath,
  protectedResourceMetadata,
  wwwAuthenticate,
} from './auth.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, content-type, mcp-session-id, mcp-protocol-version, last-event-id',
};

type Ctx = { client: SupabaseClient; userId: string; workspaceId: string };

/**
 * Validate the caller's token and build a per-request, RLS-scoped context.
 * Returns null for an invalid/expired token (caller answers 401). Every user
 * gets a workspace on signup (handle_new_user trigger), so the first membership
 * identifies the active workspace.
 */
async function buildCtx(token: string): Promise<Ctx | null> {
  const client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await client.auth.getUser(token);
  const user = userData?.user;
  // A network failure to GoTrue is not an invalid token: surface it as a
  // 500 (throw) instead of a 401 that would make clients re-run OAuth.
  if (userErr && (userErr.name === 'AuthRetryableFetchError' || userErr.status === 0)) {
    throw userErr;
  }
  if (userErr || !user) return null;

  const { data: member, error: mErr } = await client
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();
  if (mErr) throw new Error(mErr.message);
  if (!member?.workspace_id) {
    throw new Error('no workspace found for this user');
  }

  return { client, userId: user.id, workspaceId: member.workspace_id as string };
}

// ----- tool result helpers -----

function ok(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
}

function fail(message: string) {
  return { isError: true, content: [{ type: 'text' as const, text: message }] };
}

// ----- MCP server -----

function buildServer(ctx: Ctx): McpServer {
  const server = new McpServer({ name: 'vector-mcp', version: '1.0.0' });

  server.registerTool(
    'list_members',
    {
      title: 'List members',
      description:
        'List the members of your workspace. Use these profile ids as assignee_id when creating or updating tickets.',
      inputSchema: listProjectsShape,
    },
    async () => {
      try {
        const { data, error } = await ctx.client
          .from('workspace_members')
          .select('role, profiles(id, name, email, initials)')
          .eq('workspace_id', ctx.workspaceId);
        if (error) return fail(error.message);
        const members = (data ?? []).map((m) => ({ role: m.role, ...(m.profiles as object) }));
        return ok({ members });
      } catch (e) {
        return fail(String(e));
      }
    },
  );

  server.registerTool(
    'list_projects',
    {
      title: 'List projects',
      description:
        'List the projects in your workspace. Use the ids as project_id when listing or creating tickets.',
      inputSchema: listProjectsShape,
    },
    async () => {
      try {
        const { data, error } = await ctx.client
          .from('projects')
          .select('id, name, key, description, color, icon, due_date, created_at')
          .eq('workspace_id', ctx.workspaceId)
          .order('created_at', { ascending: true });
        if (error) return fail(error.message);
        return ok({ projects: data ?? [] });
      } catch (e) {
        return fail(String(e));
      }
    },
  );

  server.registerTool(
    'create_project',
    {
      title: 'Create project',
      description: 'Create a project in your workspace.',
      inputSchema: createProjectShape,
    },
    async (input: z.infer<z.ZodObject<typeof createProjectShape>>) => {
      try {
        const { data, error } = await ctx.client
          .from('projects')
          .insert({
            workspace_id: ctx.workspaceId,
            name: input.name,
            key: input.key,
            color: input.color,
            icon: input.icon,
            description: input.description ?? '',
            due_date: input.due_date ?? null,
          })
          .select('id, name, key, description, color, icon, due_date')
          .single();
        if (error) return fail(error.message);
        return ok({ created: data });
      } catch (e) {
        return fail(String(e));
      }
    },
  );

  server.registerTool(
    'list_tickets',
    {
      title: 'List tickets',
      description:
        'List tickets in a project, ordered by board position. Optionally filter by status or assignee.',
      inputSchema: listTicketsShape,
    },
    async (input: z.infer<z.ZodObject<typeof listTicketsShape>>) => {
      try {
        let q = ctx.client
          .from('tickets')
          .select(
            'id, code, title, description, status, priority, assignee_id, due_date, position, created_at',
          )
          .eq('project_id', input.project_id);
        if (input.status) q = q.eq('status', input.status);
        if (input.assignee_id) q = q.eq('assignee_id', input.assignee_id);
        const { data, error } = await q
          .order('position', { ascending: true })
          .limit(input.limit ?? 100);
        if (error) return fail(error.message);
        return ok({ tickets: data ?? [] });
      } catch (e) {
        return fail(String(e));
      }
    },
  );

  server.registerTool(
    'create_ticket',
    {
      title: 'Create ticket',
      description:
        `Create a ticket in a project (today is ${today()}). The ticket code (e.g. ENG-42) ` +
        'and board position are assigned automatically.',
      inputSchema: createTicketShape,
    },
    async (input: z.infer<z.ZodObject<typeof createTicketShape>>) => {
      try {
        const { data: project, error: pErr } = await ctx.client
          .from('projects')
          .select('id, key, ticket_seq')
          .eq('id', input.project_id)
          .maybeSingle();
        if (pErr) return fail(pErr.message);
        if (!project) return fail(`no project found with id ${input.project_id}`);

        const proj = project as Pick<ProjectRow, 'id' | 'key' | 'ticket_seq'>;
        const seq = proj.ticket_seq + 1;
        const { error: seqErr } = await ctx.client
          .from('projects')
          .update({ ticket_seq: seq })
          .eq('id', proj.id);
        if (seqErr) return fail(seqErr.message);

        const status = input.status ?? 'backlog';
        const { data: top } = await ctx.client
          .from('tickets')
          .select('position')
          .eq('project_id', proj.id)
          .eq('status', status)
          .order('position', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data, error } = await ctx.client
          .from('tickets')
          .insert({
            project_id: proj.id,
            code: ticketCode(proj.key, seq),
            title: input.title,
            description: input.description ?? '',
            status,
            priority: input.priority ?? 'medium',
            assignee_id: input.assignee_id ?? null,
            due_date: input.due_date ?? null,
            position: nextPosition((top?.position as number | undefined) ?? null),
          })
          .select('id, code, title, status, priority, assignee_id, due_date, position')
          .single();
        if (error) return fail(error.message);
        return ok({ created: data });
      } catch (e) {
        return fail(String(e));
      }
    },
  );

  server.registerTool(
    'update_ticket',
    {
      title: 'Update ticket',
      description: 'Update fields of a ticket by id. Only the provided fields change.',
      inputSchema: updateTicketShape,
    },
    async (input: z.infer<z.ZodObject<typeof updateTicketShape>>) => {
      try {
        const patch = buildUpdatePatch(input);
        if (Object.keys(patch).length === 0) return fail('provide at least one field to update');
        const { data, error } = await ctx.client
          .from('tickets')
          .update(patch)
          .eq('id', input.id)
          .select('id, code, title, status, priority, assignee_id, due_date, position')
          .maybeSingle();
        if (error) return fail(error.message);
        if (!data) return fail(`no ticket found with id ${input.id}`);
        return ok({ updated: data });
      } catch (e) {
        return fail(String(e));
      }
    },
  );

  server.registerTool(
    'delete_ticket',
    {
      title: 'Delete ticket',
      description: 'Delete a ticket by id. This cannot be undone.',
      inputSchema: deleteTicketShape,
    },
    async ({ id }: z.infer<z.ZodObject<typeof deleteTicketShape>>) => {
      try {
        const { data, error } = await ctx.client.from('tickets').delete().eq('id', id).select('id');
        if (error) return fail(error.message);
        if (!data || data.length === 0) return fail(`no ticket found with id ${id}`);
        return ok({ deleted: id });
      } catch (e) {
        return fail(String(e));
      }
    },
  );

  server.registerTool(
    'list_comments',
    {
      title: 'List comments',
      description: 'List comments on a ticket, oldest first.',
      inputSchema: listCommentsShape,
    },
    async ({ ticket_id }: z.infer<z.ZodObject<typeof listCommentsShape>>) => {
      try {
        const { data, error } = await ctx.client
          .from('comments')
          .select('id, body, author_id, created_at')
          .eq('ticket_id', ticket_id)
          .order('created_at', { ascending: true });
        if (error) return fail(error.message);
        return ok({ comments: data ?? [] });
      } catch (e) {
        return fail(String(e));
      }
    },
  );

  server.registerTool(
    'add_comment',
    {
      title: 'Add comment',
      description: 'Post a comment on a ticket, authored by you.',
      inputSchema: addCommentShape,
    },
    async (input: z.infer<z.ZodObject<typeof addCommentShape>>) => {
      try {
        const { data, error } = await ctx.client
          .from('comments')
          .insert({ ticket_id: input.ticket_id, author_id: ctx.userId, body: input.body })
          .select('id, body, author_id, created_at')
          .single();
        if (error) return fail(error.message);
        return ok({ created: data });
      } catch (e) {
        return fail(String(e));
      }
    },
  );

  return server;
}

// ----- handler -----

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return new Response('supabase env missing', { status: 500, headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Unauthenticated discovery endpoint (RFC 9728): tells MCP clients which
  // authorization server protects this resource.
  if (req.method === 'GET' && isMetadataPath(url.pathname)) {
    return new Response(JSON.stringify(protectedResourceMetadata(SUPABASE_URL)), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // No server-initiated streams in stateless mode: a GET would open an SSE
  // stream that never emits and holds the invocation open until timeout.
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405, headers: corsHeaders });
  }

  const unauthorized = () =>
    new Response('unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': wwwAuthenticate(SUPABASE_URL), ...corsHeaders },
    });

  const token = bearerToken(req.headers.get('Authorization'));
  if (!token) return unauthorized();

  try {
    const ctx = await buildCtx(token);
    if (!ctx) return unauthorized();

    const server = buildServer(ctx);
    // Stateless: fresh transport per request, JSON responses (no SSE stream).
    const transport = new WebStandardStreamableHTTPServerTransport({ enableJsonResponse: true });
    await server.connect(transport);
    const response = await transport.handleRequest(req);
    const headers = new Headers(response.headers);
    for (const [k, v] of Object.entries(corsHeaders)) headers.set(k, v);
    return new Response(response.body, { status: response.status, headers });
  } catch (error) {
    console.error('mcp failed', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
