export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  /** Hex accent color. */
  color: string;
  /** Phosphor icon class, e.g. "ph-fill ph-browsers". */
  icon: string;
  /** Short code prefix for ticket codes, e.g. "ATL". */
  key: string;
  dueDate: string | null;
  createdAt: string;
  memberIds: string[];
}

export interface ProjectStats {
  total: number;
  done: number;
  /** 0–100 */
  percent: number;
}

export function projectStats(total: number, done: number): ProjectStats {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, percent };
}
