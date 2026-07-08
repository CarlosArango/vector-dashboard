import { z } from 'zod';

/**
 * Table registry driving generic CRUD tools. Column names are the real
 * Postgres identifiers (snake_case) since supabase-js queries by them.
 *
 * `required` marks NOT NULL columns with no DB default — they must be supplied
 * on insert. Defaulted / generated columns (id, created_at, …) are optional.
 */

export interface ColumnDef {
  schema: z.ZodTypeAny;
  /** Must be provided on create (NOT NULL, no default). */
  required?: boolean;
}

export interface TableDef {
  name: string;
  /** Primary-key column(s) — used to target get/update/delete. */
  pk: string[];
  columns: Record<string, ColumnDef>;
}

const uuid = () => z.string().uuid();
const text = () => z.string();
const isoDate = () => z.string().describe('ISO date (YYYY-MM-DD)');
const isoTs = () => z.string().describe('ISO 8601 timestamp');

const ticketStatus = z.enum(['backlog', 'todo', 'inprogress', 'done']);
const ticketPriority = z.enum(['urgent', 'high', 'medium', 'low']);

export const TABLES: TableDef[] = [
  {
    name: 'profiles',
    pk: ['id'],
    columns: {
      id: { schema: uuid(), required: true },
      name: { schema: text(), required: true },
      email: { schema: text(), required: true },
      color: { schema: text() },
      initials: { schema: text() },
      created_at: { schema: isoTs() },
    },
  },
  {
    name: 'workspaces',
    pk: ['id'],
    columns: {
      id: { schema: uuid() },
      name: { schema: text(), required: true },
      plan: { schema: text() },
      created_at: { schema: isoTs() },
    },
  },
  {
    name: 'workspace_members',
    pk: ['workspace_id', 'user_id'],
    columns: {
      workspace_id: { schema: uuid(), required: true },
      user_id: { schema: uuid(), required: true },
      role: { schema: text() },
    },
  },
  {
    name: 'projects',
    pk: ['id'],
    columns: {
      id: { schema: uuid() },
      workspace_id: { schema: uuid(), required: true },
      name: { schema: text(), required: true },
      description: { schema: text() },
      color: { schema: text(), required: true },
      icon: { schema: text(), required: true },
      key: { schema: text(), required: true },
      ticket_seq: { schema: z.number().int() },
      due_date: { schema: isoDate().nullable() },
      created_at: { schema: isoTs() },
    },
  },
  {
    name: 'project_members',
    pk: ['project_id', 'user_id'],
    columns: {
      project_id: { schema: uuid(), required: true },
      user_id: { schema: uuid(), required: true },
    },
  },
  {
    name: 'tickets',
    pk: ['id'],
    columns: {
      id: { schema: uuid() },
      project_id: { schema: uuid(), required: true },
      code: { schema: text(), required: true },
      title: { schema: text(), required: true },
      description: { schema: text() },
      status: { schema: ticketStatus },
      priority: { schema: ticketPriority },
      assignee_id: { schema: uuid().nullable() },
      due_date: { schema: isoDate().nullable() },
      position: { schema: z.number(), required: true },
      created_at: { schema: isoTs() },
      updated_at: { schema: isoTs() },
    },
  },
  {
    name: 'comments',
    pk: ['id'],
    columns: {
      id: { schema: uuid() },
      ticket_id: { schema: uuid(), required: true },
      author_id: { schema: uuid(), required: true },
      body: { schema: text(), required: true },
      created_at: { schema: isoTs() },
    },
  },
];
