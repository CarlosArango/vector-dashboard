import type { Project } from '../entities/project';

export interface CreateProjectData {
  workspaceId: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  key: string;
  dueDate: string | null;
  memberIds: string[];
}

export interface ProjectRepository {
  listByWorkspace(workspaceId: string): Promise<Project[]>;
  findById(id: string): Promise<Project | null>;
  create(data: CreateProjectData): Promise<Project>;
  update(id: string, patch: Partial<CreateProjectData>): Promise<Project>;
  delete(id: string): Promise<void>;
}
