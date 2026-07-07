import type { Member } from '@vector/domain';

export interface AvatarVM {
  id: string;
  initials: string;
  color: string;
  name: string;
}

export function membersToMap(members: Member[]): Record<string, AvatarVM> {
  return Object.fromEntries(
    members.map((m) => [m.id, { id: m.id, initials: m.initials, color: m.color, name: m.name }]),
  );
}

export function resolveAvatars(
  ids: string[],
  map: Record<string, AvatarVM>,
): AvatarVM[] {
  return ids.map((id) => map[id]).filter(Boolean) as AvatarVM[];
}
