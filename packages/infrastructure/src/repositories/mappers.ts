import type { Comment, Member, Project, Ticket, Workspace } from '@vector/domain';
import type { CommentRow, ProfileRow, ProjectRow, TicketRow, WorkspaceRow } from '../db/schema';

export function toProject(row: ProjectRow, memberIds: string[]): Project {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    description: row.description,
    color: row.color,
    icon: row.icon,
    key: row.key,
    dueDate: row.dueDate,
    createdAt: row.createdAt.toISOString(),
    memberIds,
  };
}

export function toTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    projectId: row.projectId,
    code: row.code,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assigneeId: row.assigneeId,
    dueDate: row.dueDate,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toComment(row: CommentRow): Comment {
  return {
    id: row.id,
    ticketId: row.ticketId,
    authorId: row.authorId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toMember(row: ProfileRow): Member {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    color: row.color,
    initials: row.initials,
  };
}

export function toWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    plan: row.plan,
    createdAt: row.createdAt.toISOString(),
  };
}
