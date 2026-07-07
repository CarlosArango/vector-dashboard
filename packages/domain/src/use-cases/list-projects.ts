import type { Project, ProjectStats } from '../entities/project';
import { projectStats } from '../entities/project';
import type { ProjectRepository } from '../repositories/project-repository';
import type { TicketRepository } from '../repositories/ticket-repository';

export interface ProjectWithStats extends Project {
  stats: ProjectStats;
}

export interface ListProjectsDeps {
  projects: ProjectRepository;
  tickets: TicketRepository;
}

export async function listProjects(
  deps: ListProjectsDeps,
  workspaceId: string,
): Promise<ProjectWithStats[]> {
  const projects = await deps.projects.listByWorkspace(workspaceId);
  return Promise.all(
    projects.map(async (project) => {
      const tickets = await deps.tickets.listByProject(project.id);
      const done = tickets.filter((t) => t.status === 'done').length;
      return { ...project, stats: projectStats(tickets.length, done) };
    }),
  );
}
