import { eq } from 'drizzle-orm';
import type {
  Member,
  MemberRepository,
  Workspace,
  WorkspaceRepository,
} from '@vector/domain';
import type { Database } from '../db/client';
import { profiles, workspaceMembers, workspaces } from '../db/schema';
import { toMember, toWorkspace } from './mappers';

export class DrizzleMemberRepository implements MemberRepository {
  constructor(private readonly db: Database) {}

  async listByWorkspace(workspaceId: string): Promise<Member[]> {
    const rows = await this.db
      .select({ profile: profiles })
      .from(workspaceMembers)
      .innerJoin(profiles, eq(profiles.id, workspaceMembers.userId))
      .where(eq(workspaceMembers.workspaceId, workspaceId));
    return rows.map((r) => toMember(r.profile));
  }

  async findById(id: string): Promise<Member | null> {
    const [row] = await this.db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    return row ? toMember(row) : null;
  }
}

export class DrizzleWorkspaceRepository implements WorkspaceRepository {
  constructor(private readonly db: Database) {}

  async listForUser(userId: string): Promise<Workspace[]> {
    const rows = await this.db
      .select({ workspace: workspaces })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(eq(workspaceMembers.userId, userId));
    return rows.map((r) => toWorkspace(r.workspace));
  }

  async findById(id: string): Promise<Workspace | null> {
    const [row] = await this.db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
    return row ? toWorkspace(row) : null;
  }
}
