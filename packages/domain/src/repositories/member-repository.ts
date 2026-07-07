import type { Member } from '../entities/member';
import type { Workspace } from '../entities/workspace';

export interface MemberRepository {
  listByWorkspace(workspaceId: string): Promise<Member[]>;
  findById(id: string): Promise<Member | null>;
}

export interface WorkspaceRepository {
  listForUser(userId: string): Promise<Workspace[]>;
  findById(id: string): Promise<Workspace | null>;
}
