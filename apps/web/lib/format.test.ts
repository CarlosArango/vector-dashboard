import { describe, expect, it } from 'vitest';
import { formatDue, formatDueFull } from './format';

describe('format', () => {
  it('formats a due date as short month + day', () => {
    expect(formatDue('2026-07-12')).toBe('Jul 12');
    expect(formatDue(null)).toBeNull();
  });

  it('formats a full due date with year', () => {
    expect(formatDueFull('2026-07-12')).toBe('Jul 12, 2026');
    expect(formatDueFull(null)).toBe('No due date');
  });
});
