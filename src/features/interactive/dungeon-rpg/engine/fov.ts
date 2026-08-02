/**
 * Field of view by symmetric shadowcasting (Albert Ford's formulation of recursive
 * shadowcasting).
 *
 * Plain recursive shadowcasting is subtly asymmetric — it will happily let you see a floor tile
 * that cannot see you back, which shows up as enemies shooting out of tiles you have no line to.
 * The symmetric variant guarantees that for two floor tiles A and B within radius, A sees B
 * exactly when B sees A. Walls are deliberately exempt: a wall is lit whenever the space in
 * front of it is, which is what makes rooms look like rooms.
 *
 * Slopes are exact integer fractions, not floats. The algorithm's rounding rules land on exact
 * halves constantly, and float drift there produces one-tile light leaks that are miserable to
 * track down.
 */
import { isOpaque, tileIndex } from "@/features/interactive/dungeon-rpg/engine/grid";
import type { FloorMap, Vec2 } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

type Fraction = { n: number; d: number };

type Row = { depth: number; start: Fraction; end: Fraction };

/** Which way a quadrant faces; `(depth, col)` is resolved through it into map coordinates. */
type Quadrant = 0 | 1 | 2 | 3;

function transform(origin: Vec2, quadrant: Quadrant, depth: number, col: number): Vec2 {
  switch (quadrant) {
    case 0:
      return { x: origin.x + col, y: origin.y - depth };
    case 1:
      return { x: origin.x + col, y: origin.y + depth };
    case 2:
      return { x: origin.x + depth, y: origin.y + col };
    case 3:
      return { x: origin.x - depth, y: origin.y + col };
  }
}

/** `floor(depth * f + 1/2)` with exact integer arithmetic; `f.d` is always positive. */
function roundTiesUp(depth: number, f: Fraction): number {
  return Math.floor((2 * depth * f.n + f.d) / (2 * f.d));
}

/** `ceil(depth * f - 1/2)`, likewise exact. */
function roundTiesDown(depth: number, f: Fraction): number {
  return Math.ceil((2 * depth * f.n - f.d) / (2 * f.d));
}

function slope(depth: number, col: number): Fraction {
  return { n: 2 * col - 1, d: 2 * depth };
}

function isSymmetric(row: Row, col: number): boolean {
  return col * row.start.d >= row.depth * row.start.n && col * row.end.d <= row.depth * row.end.n;
}

/**
 * Tiles currently lit from `origin`, as a set of tile indexes. Recomputed on every move and
 * never persisted — the *explored* set is the one that survives, and they are different things.
 */
export function computeFov(map: FloorMap, origin: Vec2, radius: number): Set<number> {
  const visible = new Set<number>();
  if (origin.x < 0 || origin.y < 0 || origin.x >= map.w || origin.y >= map.h) return visible;

  visible.add(tileIndex(origin.x, origin.y, map.w));
  if (radius <= 0) return visible;

  const radiusSquared = radius * radius;

  const reveal = (pos: Vec2): void => {
    if (pos.x < 0 || pos.y < 0 || pos.x >= map.w || pos.y >= map.h) return;
    const dx = pos.x - origin.x;
    const dy = pos.y - origin.y;
    // Euclidean, so the cut-off is symmetric too — a square radius is not.
    if (dx * dx + dy * dy > radiusSquared) return;
    visible.add(tileIndex(pos.x, pos.y, map.w));
  };

  const wallAt = (pos: Vec2): boolean => isOpaque(map, pos.x, pos.y);

  for (const quadrant of [0, 1, 2, 3] as const) {
    const scan = (row: Row): void => {
      if (row.depth > radius) return;

      const minCol = roundTiesUp(row.depth, row.start);
      const maxCol = roundTiesDown(row.depth, row.end);

      let prevWasWall: boolean | null = null;
      let start = row.start;

      for (let col = minCol; col <= maxCol; col++) {
        const pos = transform(origin, quadrant, row.depth, col);
        const wall = wallAt(pos);

        if (wall || isSymmetric({ ...row, start }, col)) reveal(pos);

        if (prevWasWall === true && !wall) {
          start = slope(row.depth, col);
        }
        if (prevWasWall === false && wall) {
          scan({ depth: row.depth + 1, start, end: slope(row.depth, col) });
        }
        prevWasWall = wall;
      }

      if (prevWasWall === false) {
        scan({ depth: row.depth + 1, start, end: row.end });
      }
    };

    scan({ depth: 1, start: { n: -1, d: 1 }, end: { n: 1, d: 1 } });
  }

  return visible;
}
