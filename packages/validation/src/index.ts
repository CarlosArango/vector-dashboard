import { z } from 'zod';
import { TICKET_PRIORITIES, TICKET_STATUSES } from '@vector/domain/enums';

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
  .nullable()
  .optional();

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  description: z.string().trim().max(280).optional().default(''),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected a hex color'),
  icon: z.string().min(1),
  key: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2,6}$/, 'Key must be 2–6 letters')
    .transform((v) => v.toUpperCase()),
  dueDate: dateString,
  memberIds: z.array(z.string().uuid()).default([]),
});
export type CreateProjectValues = z.input<typeof createProjectSchema>;

export const createTicketSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(1, 'Title is required').max(160),
  description: z.string().trim().max(4000).optional().default(''),
  status: z.enum(TICKET_STATUSES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: dateString,
});
export type CreateTicketValues = z.input<typeof createTicketSchema>;

export const updateTicketSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(4000).optional(),
  status: z.enum(TICKET_STATUSES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: dateString,
});
export type UpdateTicketValues = z.input<typeof updateTicketSchema>;

export const moveTicketSchema = z.object({
  id: z.string().uuid(),
  toStatus: z.enum(TICKET_STATUSES),
  beforePosition: z.number().nullable().optional(),
  afterPosition: z.number().nullable().optional(),
});
export type MoveTicketValues = z.input<typeof moveTicketSchema>;

export const addCommentSchema = z.object({
  ticketId: z.string().uuid(),
  body: z.string().trim().min(1, 'Comment cannot be empty').max(2000),
});
export type AddCommentValues = z.input<typeof addCommentSchema>;
