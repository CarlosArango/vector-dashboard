// supabase/functions/mcp/domain.ts
//
// Pure logic for the MCP edge function: tool input shapes, date/code helpers,
// and update-patch building. No I/O.
import { z } from 'npm:zod@3.25.76';

export const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const STATUSES = ['backlog', 'todo', 'inprogress', 'done'] as const;
export const PRIORITIES = ['urgent', 'high', 'medium', 'low'] as const;

export type ProjectRow = {
  id: string;
  name: string;
  key: string;
  ticket_seq: number;
  color: string;
  icon: string;
};

// ----- tool input shapes (Zod raw shapes, passed to registerTool) -----

export const listProjectsShape = {};

export const createProjectShape = {
  name: z.string().trim().min(1).max(120).describe('Project name'),
  key: z
    .string()
    .trim()
    .regex(/^[A-Z][A-Z0-9]{1,9}$/)
    .describe('Short uppercase code used in ticket ids, e.g. "ENG"'),
  color: z.string().trim().min(1).describe('Any CSS color or gradient'),
  icon: z.string().trim().min(1).describe('Emoji or icon name'),
  description: z.string().trim().max(1000).optional(),
  due_date: z.string().regex(DATE_RE).optional().describe('YYYY-MM-DD'),
};

export const listTicketsShape = {
  project_id: z.string().uuid().describe('A project id from list_projects'),
  status: z.enum(STATUSES).optional().describe('Filter by status'),
  assignee_id: z.string().uuid().optional().describe('Filter by assignee profile id'),
  limit: z.number().int().min(1).max(200).optional(),
};

export const createTicketShape = {
  project_id: z.string().uuid().describe('A project id from list_projects'),
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(5000).optional(),
  status: z.enum(STATUSES).optional().describe('Defaults to backlog'),
  priority: z.enum(PRIORITIES).optional().describe('Defaults to medium'),
  assignee_id: z.string().uuid().optional().describe('A member profile id from list_members'),
  due_date: z.string().regex(DATE_RE).optional().describe('YYYY-MM-DD'),
};

export const updateTicketShape = {
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().max(5000).optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  assignee_id: z.string().uuid().nullable().optional().describe('null to unassign'),
  due_date: z.string().regex(DATE_RE).nullable().optional(),
};

export const deleteTicketShape = {
  id: z.string().uuid(),
};

export const listCommentsShape = {
  ticket_id: z.string().uuid(),
};

export const addCommentShape = {
  ticket_id: z.string().uuid(),
  body: z.string().trim().min(1).max(5000),
};

// ----- helpers -----

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Ticket code from a project key and its (already incremented) sequence. */
export function ticketCode(key: string, seq: number): string {
  return `${key}-${seq}`;
}

/** Next board position: after the current max within a status lane. */
export function nextPosition(maxPosition: number | null): number {
  return (maxPosition ?? 0) + 1024;
}

/** Keep only the fields the caller actually provided (drop `id` and undefined). */
export function buildUpdatePatch(input: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === 'id' || value === undefined) continue;
    patch[key] = value;
  }
  return patch;
}
