import {
  bigint,
  date,
  doublePrecision,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const ticketStatus = pgEnum('ticket_status', ['backlog', 'todo', 'inprogress', 'done']);
export const ticketPriority = pgEnum('ticket_priority', ['urgent', 'high', 'medium', 'low']);

/** Mirrors auth.users; RLS keys off this. */
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  color: text('color').notNull().default('linear-gradient(135deg,#3b82f6,#8b5cf6)'),
  initials: text('initials').notNull().default('?'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  plan: text('plan').notNull().default('Free'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('member'),
  },
  (t) => [primaryKey({ columns: [t.workspaceId, t.userId] })],
);

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    color: text('color').notNull(),
    icon: text('icon').notNull(),
    key: text('key').notNull(),
    /** Running ticket counter, drives ticket codes. */
    ticketSeq: bigint('ticket_seq', { mode: 'number' }).notNull().default(0),
    dueDate: date('due_date'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('projects_workspace_idx').on(t.workspaceId)],
);

export const projectMembers = pgTable(
  'project_members',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.userId] })],
);

export const tickets = pgTable(
  'tickets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    status: ticketStatus('status').notNull().default('backlog'),
    priority: ticketPriority('priority').notNull().default('medium'),
    assigneeId: uuid('assignee_id').references(() => profiles.id, { onDelete: 'set null' }),
    dueDate: date('due_date'),
    position: doublePrecision('position').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('tickets_board_idx').on(t.projectId, t.status, t.position),
    index('tickets_assignee_idx').on(t.assigneeId),
    index('tickets_due_idx').on(t.dueDate),
  ],
);

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => tickets.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('comments_ticket_idx').on(t.ticketId)],
);

export type ProjectRow = typeof projects.$inferSelect;
export type TicketRow = typeof tickets.$inferSelect;
export type CommentRow = typeof comments.$inferSelect;
export type ProfileRow = typeof profiles.$inferSelect;
export type WorkspaceRow = typeof workspaces.$inferSelect;
