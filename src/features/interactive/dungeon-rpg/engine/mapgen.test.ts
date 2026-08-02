import { describe, expect, it } from "vitest";
import {
  FLOOR_COUNT,
  MAP_H,
  MAP_W,
  MIN_ROOM_H,
  MIN_ROOM_W,
  TILE_CODE,
} from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";
import { fallbackFloor, generateFloor, validate } from "@/features/interactive/dungeon-rpg/engine/mapgen";
import { isWalkableCode, reachableFrom, tileIndex } from "@/features/interactive/dungeon-rpg/engine/grid";
import type { FloorMap, Room } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

function overlaps(a: Room, b: Room): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

function walkableCount(map: FloorMap): number {
  let n = 0;
  for (const code of map.tiles) if (isWalkableCode(code)) n++;
  return n;
}

describe("generateFloor", () => {
  it("is deterministic for a (seed, floor) pair", () => {
    expect(generateFloor("abc", 3)).toEqual(generateFloor("abc", 3));
    expect(generateFloor("abc", 3).tiles).toEqual(generateFloor("abc", 3).tiles);
  });

  it("changes with the floor number", () => {
    const one = generateFloor("abc", 1);
    const two = generateFloor("abc", 2);
    expect(one.tiles).not.toEqual(two.tiles);
    expect(one.floor).toBe(1);
    expect(two.floor).toBe(2);
  });

  it("changes with the seed", () => {
    expect(generateFloor("abc", 1).tiles).not.toEqual(generateFloor("abd", 1).tiles);
  });

  it("writes exactly MAP_W × MAP_H tiles", () => {
    const map = generateFloor("bounds", 1);
    expect(map.tiles).toHaveLength(MAP_W * MAP_H);
    expect(map.w).toBe(MAP_W);
    expect(map.h).toBe(MAP_H);
  });

  it("places a staircase tile at map.stairs", () => {
    const map = generateFloor("stairs", 2);
    expect(map.tiles[tileIndex(map.stairs.x, map.stairs.y, map.w)]).toBe(TILE_CODE.stairs);
  });
});

describe("fallbackFloor", () => {
  it("passes every reachability assertion the generator does", () => {
    for (let floor = 1; floor <= FLOOR_COUNT; floor++) {
      expect(validate(fallbackFloor(floor))).toBe(true);
    }
  });

  it("connects all six rooms", () => {
    const map = fallbackFloor(1);
    expect(map.rooms).toHaveLength(6);
    const reachable = reachableFrom(map, map.spawn);
    for (const room of map.rooms) {
      const centre = tileIndex(room.x + Math.floor(room.w / 2), room.y + Math.floor(room.h / 2), map.w);
      expect(reachable.has(centre)).toBe(true);
    }
  });
});

/**
 * The suite worth over-testing. A generator that seals the staircase one seed in a thousand is
 * a run-ending bug a visitor will hit and never report.
 */
describe("reachability property sweep (1000 seeds × 5 floors)", () => {
  const seeds = Array.from({ length: 1000 }, (_, i) => `sweep-${i}`);

  it("never produces an unreachable staircase, an orphan tile, or an overlapping room", () => {
    for (const seed of seeds) {
      for (let floor = 1; floor <= FLOOR_COUNT; floor++) {
        const map = generateFloor(seed, floor);
        const where = `${seed}#${floor}`;

        // Spawn and stairs are distinct, walkable, and in bounds.
        expect(`${where}:spawn!=stairs:${map.spawn.x !== map.stairs.x || map.spawn.y !== map.stairs.y}`).toBe(
          `${where}:spawn!=stairs:true`,
        );
        expect(`${where}:spawnWalkable:${isWalkableCode(map.tiles[tileIndex(map.spawn.x, map.spawn.y, map.w)]!)}`).toBe(
          `${where}:spawnWalkable:true`,
        );

        // Every walkable tile is reachable from spawn — no sealed stairs, no orphan corridor.
        const reachable = reachableFrom(map, map.spawn);
        expect(`${where}:reachable:${reachable.size}`).toBe(`${where}:reachable:${walkableCount(map)}`);
        expect(`${where}:stairsReached:${reachable.has(tileIndex(map.stairs.x, map.stairs.y, map.w))}`).toBe(
          `${where}:stairsReached:true`,
        );

        // The border ring is solid wall on all four sides.
        let borderBreaches = 0;
        for (let x = 0; x < map.w; x++) {
          if (isWalkableCode(map.tiles[tileIndex(x, 0, map.w)]!)) borderBreaches++;
          if (isWalkableCode(map.tiles[tileIndex(x, map.h - 1, map.w)]!)) borderBreaches++;
        }
        for (let y = 0; y < map.h; y++) {
          if (isWalkableCode(map.tiles[tileIndex(0, y, map.w)]!)) borderBreaches++;
          if (isWalkableCode(map.tiles[tileIndex(map.w - 1, y, map.w)]!)) borderBreaches++;
        }
        expect(`${where}:border:${borderBreaches}`).toBe(`${where}:border:0`);

        // Rooms are at least the minimum size, in bounds, and never overlap.
        expect(`${where}:rooms:${map.rooms.length >= 2}`).toBe(`${where}:rooms:true`);
        let roomFaults = 0;
        for (let i = 0; i < map.rooms.length; i++) {
          const a = map.rooms[i]!;
          if (a.w < MIN_ROOM_W || a.h < MIN_ROOM_H) roomFaults++;
          if (a.x < 1 || a.y < 1 || a.x + a.w > map.w - 1 || a.y + a.h > map.h - 1) roomFaults++;
          for (let j = i + 1; j < map.rooms.length; j++) {
            if (overlaps(a, map.rooms[j]!)) roomFaults++;
          }
          // …and every room is genuinely walked to, not merely carved.
          const centre = tileIndex(a.x + Math.floor(a.w / 2), a.y + Math.floor(a.h / 2), map.w);
          if (!reachable.has(centre)) roomFaults++;
        }
        expect(`${where}:roomFaults:${roomFaults}`).toBe(`${where}:roomFaults:0`);
      }
    }
  });

  it("never falls back on a real seed", () => {
    // The fallback exists as a floor, not as a crutch. If sweep seeds hit it, generation regressed.
    let fellBack = 0;
    for (const seed of seeds.slice(0, 200)) {
      for (let floor = 1; floor <= FLOOR_COUNT; floor++) {
        const map = generateFloor(seed, floor);
        if (map.rooms.length === 6 && map.rooms[0]!.x === 3 && map.rooms[0]!.y === 3 && map.rooms[0]!.w === 10) {
          fellBack++;
        }
      }
    }
    expect(fellBack).toBe(0);
  });
});

describe("validate", () => {
  it("rejects a map whose stairs are walled off", () => {
    const map = generateFloor("sealed", 1);
    const sealed: FloorMap = { ...map, tiles: Uint8Array.from(map.tiles) };
    // Wall in the staircase and everything orthogonally touching it.
    for (const [dx, dy] of [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      sealed.tiles[tileIndex(map.stairs.x + dx, map.stairs.y + dy, map.w)] = TILE_CODE.wall;
    }
    expect(validate(sealed)).toBe(false);
  });

  it("rejects a breached border", () => {
    const map = generateFloor("border", 1);
    const breached: FloorMap = { ...map, tiles: Uint8Array.from(map.tiles) };
    breached.tiles[tileIndex(0, 5, map.w)] = TILE_CODE.floor;
    expect(validate(breached)).toBe(false);
  });

  it("rejects spawn sitting on the stairs", () => {
    const map = generateFloor("same", 1);
    expect(validate({ ...map, spawn: { ...map.stairs } })).toBe(false);
  });

  it("rejects an orphaned pocket of floor", () => {
    const map = generateFloor("orphan", 1);
    const orphaned: FloorMap = { ...map, tiles: Uint8Array.from(map.tiles) };
    // A single walkable tile in the middle of the border wall's inner ring, touching nothing.
    let placed = false;
    for (let y = 2; y < map.h - 2 && !placed; y++) {
      for (let x = 2; x < map.w - 2 && !placed; x++) {
        const neighbours = [
          [x, y],
          [x + 1, y],
          [x - 1, y],
          [x, y + 1],
          [x, y - 1],
        ];
        if (neighbours.every(([nx, ny]) => orphaned.tiles[tileIndex(nx!, ny!, map.w)] === TILE_CODE.wall)) {
          orphaned.tiles[tileIndex(x, y, map.w)] = TILE_CODE.floor;
          placed = true;
        }
      }
    }
    expect(placed).toBe(true);
    expect(validate(orphaned)).toBe(false);
  });
});
