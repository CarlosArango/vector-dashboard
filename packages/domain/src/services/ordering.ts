/**
 * Fractional indexing for O(1) reorders. A card dropped between two others
 * gets the midpoint of their positions; at the ends we offset by a step.
 */
const STEP = 1024;

export function positionBetween(before: number | null, after: number | null): number {
  if (before === null && after === null) return STEP;
  if (before === null) return after! - STEP;
  if (after === null) return before + STEP;
  return (before + after) / 2;
}

export function positionAtEnd(highest: number | null): number {
  return highest === null ? STEP : highest + STEP;
}
