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
  const stats = await deps.tickets.statsByProjects(projects.map((p) => p.id));
  return projects.map((project) => {
    const s = stats.get(project.id) ?? { total: 0, done: 0 };
    return { ...project, stats: projectStats(s.total, s.done) };
  });
}
