import { eq } from 'drizzle-orm';
import type { CreateProjectData, Project, ProjectRepository } from '@vector/domain';
import type { Database } from '../db/client';
import { projectMembers, projects } from '../db/schema';
import { toProject } from './mappers';

export class DrizzleProjectRepository implements ProjectRepository {
  constructor(private readonly db: Database) {}

  private async memberIds(projectId: string): Promise<string[]> {
    const rows = await this.db
      .select({ userId: projectMembers.userId })
      .from(projectMembers)
      .where(eq(projectMembers.projectId, projectId));
    return rows.map((r) => r.userId);
  }

  async listByWorkspace(workspaceId: string): Promise<Project[]> {
    const rows = await this.db
      .select()
      .from(projects)
      .where(eq(projects.workspaceId, workspaceId));
    return Promise.all(rows.map(async (row) => toProject(row, await this.memberIds(row.id))));
  }

  async findById(id: string): Promise<Project | null> {
    const [row] = await this.db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!row) return null;
    return toProject(row, await this.memberIds(id));
  }

  async create(data: CreateProjectData): Promise<Project> {
    return this.db.transaction(async (tx) => {
      const [row] = await tx
        .insert(projects)
        .values({
          workspaceId: data.workspaceId,
          name: data.name,
          description: data.description,
          color: data.color,
          icon: data.icon,
          key: data.key,
          dueDate: data.dueDate,
        })
        .returning();
      if (data.memberIds.length) {
        await tx
          .insert(projectMembers)
          .values(data.memberIds.map((userId) => ({ projectId: row!.id, userId })));
      }
      return toProject(row!, data.memberIds);
    });
  }

  async update(id: string, patch: Partial<CreateProjectData>): Promise<Project> {
    const [row] = await this.db
      .update(projects)
      .set({
        name: patch.name,
        description: patch.description,
        color: patch.color,
        icon: patch.icon,
        key: patch.key,
        dueDate: patch.dueDate,
      })
      .where(eq(projects.id, id))
      .returning();
    return toProject(row!, await this.memberIds(id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(projects).where(eq(projects.id, id));
  }
}
