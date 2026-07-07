import type { Database } from '../db/client';
import { DrizzleProjectRepository } from './drizzle-project-repository';
import { DrizzleTicketRepository } from './drizzle-ticket-repository';
import { DrizzleCommentRepository } from './drizzle-comment-repository';
import {
  DrizzleMemberRepository,
  DrizzleWorkspaceRepository,
} from './drizzle-member-repository';

export * from './drizzle-project-repository';
export * from './drizzle-ticket-repository';
export * from './drizzle-comment-repository';
export * from './drizzle-member-repository';

/** Bundles all concrete repositories over one Drizzle connection. */
export function createRepositories(db: Database) {
  return {
    projects: new DrizzleProjectRepository(db),
    tickets: new DrizzleTicketRepository(db),
    comments: new DrizzleCommentRepository(db),
    members: new DrizzleMemberRepository(db),
    workspaces: new DrizzleWorkspaceRepository(db),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
