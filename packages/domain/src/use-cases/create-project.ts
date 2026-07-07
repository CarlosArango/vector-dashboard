import type { Project } from '../entities/project';
import type { ProjectRepository } from '../repositories/project-repository';
import { ValidationError } from '../shared/errors';

export interface CreateProjectInput {
  workspaceId: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  key: string;
  dueDate?: string | null;
  memberIds?: string[];
}

export interface CreateProjectDeps {
  projects: ProjectRepository;
}

export async function createProject(
  deps: CreateProjectDeps,
  input: CreateProjectInput,
): Promise<Project> {
  const name = input.name.trim();
  if (!name) throw new ValidationError('Project name is required');

  const key = input.key.trim().toUpperCase();
  if (!/^[A-Z]{2,6}$/.test(key)) {
    throw new ValidationError('Project key must be 2–6 letters');
  }

  return deps.projects.create({
    workspaceId: input.workspaceId,
    name,
    description: input.description?.trim() ?? '',
    color: input.color,
    icon: input.icon,
    key,
    dueDate: input.dueDate ?? null,
    memberIds: input.memberIds ?? [],
  });
}
