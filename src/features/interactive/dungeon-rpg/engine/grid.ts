/** Tile lookups shared by generation, sight, movement, and the renderer. Pure. */
import {
  MAP_W,
  TILE_BY_CODE,
  TILE_CODE,
  WALKABLE_TILES,
} from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";
import type { FloorMap, TileKind, Vec2 } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

export function tileIndex(x: number, y: number, width: number = MAP_W): number {
  return y * width + x;
}

export function indexToVec(index: number, width: number = MAP_W): Vec2 {
  return { x: index % width, y: Math.floor(index / width) };
}

export function inBounds(map: Pick<FloorMap, "w" | "h">, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < map.w && y < map.h;
}

export function tileAt(map: FloorMap, x: number, y: number): TileKind {
  if (!inBounds(map, x, y)) return "wall";
  return TILE_BY_CODE[map.tiles[tileIndex(x, y, map.w)]!] ?? "wall";
}

export function isWalkable(map: FloorMap, x: number, y: number): boolean {
  return WALKABLE_TILES.has(tileAt(map, x, y));
}

/** Only walls block sight. Doors are cosmetic openings, so you can see straight through them. */
export function isOpaque(map: FloorMap, x: number, y: number): boolean {
  return tileAt(map, x, y) === "wall";
}

export function isWalkableCode(code: number): boolean {
  return code !== TILE_CODE.wall;
}

export function samePos(a: Vec2, b: Vec2): boolean {
  return a.x === b.x && a.y === b.y;
}

/** Walkable tiles reachable from `origin`, as a set of tile indexes. Four-way, like movement. */
export function reachableFrom(map: FloorMap, origin: Vec2): Set<number> {
  const seen = new Set<number>();
  if (!isWalkable(map, origin.x, origin.y)) return seen;

  const start = tileIndex(origin.x, origin.y, map.w);
  seen.add(start);
  const queue: number[] = [start];

  for (let head = 0; head < queue.length; head++) {
    const current = queue[head]!;
    const cx = current % map.w;
    const cy = Math.floor(current / map.w);
    const neighbours: [number, number][] = [
      [cx, cy - 1],
      [cx, cy + 1],
      [cx - 1, cy],
      [cx + 1, cy],
    ];
    for (const [nx, ny] of neighbours) {
      if (!inBounds(map, nx, ny)) continue;
      const next = tileIndex(nx, ny, map.w);
      if (seen.has(next)) continue;
      if (!isWalkableCode(map.tiles[next]!)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return seen;
}

/**
 * Step distance from `origin` to every reachable walkable tile. `-1` means unreachable.
 * Corridor layout, not Euclidean distance, is what the player actually walks.
 */
export function distanceField(map: FloorMap, origin: Vec2): Int32Array {
  const dist = new Int32Array(map.w * map.h).fill(-1);
  if (!isWalkable(map, origin.x, origin.y)) return dist;

  const start = tileIndex(origin.x, origin.y, map.w);
  dist[start] = 0;
  const queue: number[] = [start];

  for (let head = 0; head < queue.length; head++) {
    const current = queue[head]!;
    const cx = current % map.w;
    const cy = Math.floor(current / map.w);
    const step = dist[current]! + 1;
    const neighbours: [number, number][] = [
      [cx, cy - 1],
      [cx, cy + 1],
      [cx - 1, cy],
      [cx + 1, cy],
    ];
    for (const [nx, ny] of neighbours) {
      if (!inBounds(map, nx, ny)) continue;
      const next = tileIndex(nx, ny, map.w);
      if (dist[next] !== -1) continue;
      if (!isWalkableCode(map.tiles[next]!)) continue;
      dist[next] = step;
      queue.push(next);
    }
  }
  return dist;
}
