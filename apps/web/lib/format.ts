const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDue(date: string | null): string | null {
  if (!date) return null;
  const [, m, d] = date.split('-');
  return `${MONTHS[Number(m) - 1]} ${Number(d)}`;
}

export function formatDueFull(date: string | null): string {
  if (!date) return 'No due date';
  const [y, m, d] = date.split('-');
  return `${MONTHS[Number(m) - 1]} ${Number(d)}, ${y}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
