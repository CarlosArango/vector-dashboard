import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export interface StoredSession {
  access_token: string;
  refresh_token: string;
  /** Unix seconds. */
  expires_at: number;
  user_email?: string;
}

const FILE = join(homedir(), '.vector-mcp', 'session.json');

export function readSession(): StoredSession | null {
  if (!existsSync(FILE)) return null;
  try {
    return JSON.parse(readFileSync(FILE, 'utf8')) as StoredSession;
  } catch {
    return null;
  }
}

export function writeSession(s: StoredSession): void {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(s, null, 2), { mode: 0o600 });
}

export function clearSession(): void {
  if (existsSync(FILE)) rmSync(FILE);
}

export function sessionPath(): string {
  return FILE;
}
