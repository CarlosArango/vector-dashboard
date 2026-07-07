import type { Comment } from '../entities/comment';
import type { Project } from '../entities/project';
import type { Ticket } from '../entities/ticket';
import type { TicketStatus } from '../enums/ticket-status';
import type {
  CreateCommentData,
  CommentRepository,
} from '../repositories/comment-repository';
import type {
  CreateProjectData,
  ProjectRepository,
} from '../repositories/project-repository';
import type {
  CreateTicketData,
  TicketRepository,
  UpdateTicketData,
} from '../repositories/ticket-repository';

let counter = 0;
const id = (prefix: string) => `${prefix}_${++counter}`;
const NOW = '2026-07-07T00:00:00.000Z';

export class InMemoryProjectRepository implements ProjectRepository {
  constructor(public items: Project[] = []) {}

  async listByWorkspace(workspaceId: string) {
    return this.items.filter((p) => p.workspaceId === workspaceId);
  }
  async findById(pid: string) {
    return this.items.find((p) => p.id === pid) ?? null;
  }
  async create(data: CreateProjectData) {
    const project: Project = { id: id('proj'), createdAt: NOW, ...data };
    this.items.push(project);
    return project;
  }
  async update(pid: string, patch: Partial<CreateProjectData>) {
    const idx = this.items.findIndex((p) => p.id === pid);
    this.items[idx] = { ...this.items[idx]!, ...patch };
    return this.items[idx]!;
  }
  async delete(pid: string) {
    this.items = this.items.filter((p) => p.id !== pid);
  }
}

export class InMemoryTicketRepository implements TicketRepository {
  constructor(public items: Ticket[] = []) {}

  async listByProject(projectId: string) {
    return this.items.filter((t) => t.projectId === projectId);
  }
  async findById(tid: string) {
    return this.items.find((t) => t.id === tid) ?? null;
  }
  async countByProject(projectId: string) {
    return this.items.filter((t) => t.projectId === projectId).length;
  }
  async highestPosition(projectId: string, status: TicketStatus) {
    const positions = this.items
      .filter((t) => t.projectId === projectId && t.status === status)
      .map((t) => t.position);
    return positions.length ? Math.max(...positions) : null;
  }
  async create(data: CreateTicketData) {
    const ticket: Ticket = { id: id('tkt'), createdAt: NOW, updatedAt: NOW, ...data };
    this.items.push(ticket);
    return ticket;
  }
  async update(tid: string, patch: UpdateTicketData) {
    const idx = this.items.findIndex((t) => t.id === tid);
    this.items[idx] = { ...this.items[idx]!, ...patch, updatedAt: NOW };
    return this.items[idx]!;
  }
  async delete(tid: string) {
    this.items = this.items.filter((t) => t.id !== tid);
  }
}

export class InMemoryCommentRepository implements CommentRepository {
  constructor(public items: Comment[] = []) {}

  async listByTicket(ticketId: string) {
    return this.items.filter((c) => c.ticketId === ticketId);
  }
  async create(data: CreateCommentData) {
    const comment: Comment = { id: id('cmt'), createdAt: NOW, ...data };
    this.items.push(comment);
    return comment;
  }
}
