/** A workspace member / user profile. */
export interface Member {
  id: string;
  name: string;
  email: string;
  /** CSS gradient or color used for the avatar fallback. */
  color: string;
  initials: string;
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
