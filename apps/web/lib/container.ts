import 'server-only';
import { getDatabase } from '@vector/infrastructure/db';
import { createRepositories, type Repositories } from '@vector/infrastructure/repositories';

let repositories: Repositories | undefined;

/** Concrete repositories over the singleton Drizzle connection. */
export function getRepositories(): Repositories {
  if (!repositories) {
    repositories = createRepositories(getDatabase());
  }
  return repositories;
}
