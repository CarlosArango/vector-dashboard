# 0007 — dnd-kit with fractional indexing for the board

- **Status:** Accepted
- **Date:** 2026-07-07

## Context

The Kanban board must support dragging cards within and across columns, stay
smooth with large boards, be accessible, and persist order cheaply — a move
should not rewrite every card's position.

## Decision

- Use **dnd-kit** (`@dnd-kit/core` + `@dnd-kit/sortable`) for drag-and-drop:
  accessible, performant, and React 19-friendly.
- Persist order with **fractional indexing**. Tickets have a `double precision`
  `position`; a card dropped between two neighbours takes the midpoint of their
  positions (`positionBetween`), and a card dropped at the end takes
  `highest + STEP` (`positionAtEnd`). These helpers live in
  `@vector/domain/services/ordering` and are unit-tested.
- The board is indexed by `(project_id, status, position)` to serve column reads
  in order.

## Consequences

- A move is a **single-row update** — O(1), no column-wide reindex.
- Drag interactions are optimistic (ADR 0006); the new status + position persist
  on drop.
- Fractional positions can converge after many midpoint inserts between the same
  pair; a periodic rebalance can be added later if needed (not required at
  current scale).
- The prototype's native HTML5 drag was replaced by dnd-kit for smoothness and
  Safari/mobile behaviour.

## Alternatives considered

- **Integer positions** — every reorder rewrites the tail of the column.
- **Native HTML5 drag-and-drop** — what the design prototype used; janky on
  Safari/mobile, poor accessibility.
- **Pragmatic drag-and-drop (Atlassian)** — excellent, but a heavier API than
  needed here.
