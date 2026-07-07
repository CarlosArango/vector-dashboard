import 'server-only';
import {
  getBoard,
  listProjects,
  type BoardColumn,
  type Comment,
  type Member,
  type ProjectWithStats,
  type Ticket,
} from '@vector/domain';
import { getRepositories } from './container';

export async function getProjects(workspaceId: string): Promise<ProjectWithStats[]> {
  const repos = getRepositories();
  return listProjects({ projects: repos.projects, tickets: repos.tickets }, workspaceId);
}

export async function getMembers(workspaceId: string): Promise<Member[]> {
  return getRepositories().members.listByWorkspace(workspaceId);
}

export async function getProjectById(id: string) {
  return getRepositories().projects.findById(id);
}

export async function getProjectBoard(projectId: string): Promise<BoardColumn[]> {
  return getBoard({ tickets: getRepositories().tickets }, projectId);
}

export async function getProjectTickets(projectId: string): Promise<Ticket[]> {
  return getRepositories().tickets.listByProject(projectId);
}

export async function getTicketComments(ticketId: string): Promise<Comment[]> {
  return getRepositories().comments.listByTicket(ticketId);
}
