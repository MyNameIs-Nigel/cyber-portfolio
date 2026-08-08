import { describe, expect, it } from "vitest";
import { FOV_RADIUS, TILE_CODE } from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";
import { computeFov } from "@/features/interactive/dungeon-rpg/engine/fov";
import { generateFloor } from "@/features/interactive/dungeon-rpg/engine/mapgen";
import { tileIndex } from "@/features/interactive/dungeon-rpg/engine/grid";
import type { FloorMap, Vec2 } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

/**
 * Builds a map from ASCII art. `#` is wall, everything else is floor — which keeps these tests
 * readable, and readable is the whole point when debugging a light leak.
 */
function fromAscii(rows: string[]): FloorMap {
  const h = rows.length;
  const w = rows[0]!.length;
  const tiles = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      tiles[y * w + x] = rows[y]![x] === "#" ? TILE_CODE.wall : TILE_CODE.floor;
    }
  }
  return { floor: 1, w, h, tiles, rooms: [], spawn: { x: 1, y: 1 }, stairs: { x: 1, y: 1 } };
}

function visibleAscii(map: FloorMap, origin: Vec2, radius: number): string[] {
  const fov = computeFov(map, origin, radius);
  const out: string[] = [];
  for (let y = 0; y < map.h; y++) {
    let line = "";
    for (let x = 0; x < map.w; x++) {
      line += fov.has(tileIndex(x, y, map.w)) ? "." : " ";
    }
    out.push(line);
  }
  return out;
}

describe("computeFov", () => {
  it("always includes the origin", () => {
    const map = fromAscii(["#####", "#...#", "#...#", "#####"]);
    expect(computeFov(map, { x: 2, y: 1 }, 5).has(tileIndex(2, 1, map.w))).toBe(true);
    expect(computeFov(map, { x: 2, y: 1 }, 0).has(tileIndex(2, 1, map.w))).toBe(true);
  });

  it("returns nothing for an out-of-bounds origin", () => {
    const map = fromAscii(["###", "#.#", "###"]);
    expect(computeFov(map, { x: -1, y: 1 }, 5).size).toBe(0);
    expect(computeFov(map, { x: 99, y: 1 }, 5).size).toBe(0);
  });

  it("sees the whole of a small open room", () => {
    const map = fromAscii([
      "#######",
      "#.....#",
      "#.....#",
      "#.....#",
      "#######",
    ]);
    const fov = computeFov(map, { x: 3, y: 2 }, 8);
    for (let y = 1; y <= 3; y++) {
      for (let x = 1; x <= 5; x++) {
        expect(fov.has(tileIndex(x, y, map.w))).toBe(true);
      }
    }
  });

  it("lights the walls that enclose a lit room", () => {
    const map = fromAscii(["#####", "#...#", "#####"]);
    const fov = computeFov(map, { x: 2, y: 1 }, 6);
    expect(fov.has(tileIndex(0, 1, map.w))).toBe(true);
    expect(fov.has(tileIndex(4, 1, map.w))).toBe(true);
    expect(fov.has(tileIndex(2, 0, map.w))).toBe(true);
    expect(fov.has(tileIndex(2, 2, map.w))).toBe(true);
  });

  it("blocks the tiles behind a pillar but shows the pillar itself", () => {
    //         x: 0123456
    const map = fromAscii([
      "#######",
      "#.....#",
      "#..#..#",
      "#.....#",
      "#######",
    ]);
    const fov = computeFov(map, { x: 1, y: 2 }, 8);
    expect(fov.has(tileIndex(3, 2, map.w))).toBe(true); // the pillar
    expect(fov.has(tileIndex(4, 2, map.w))).toBe(false); // directly behind it
    expect(fov.has(tileIndex(5, 2, map.w))).toBe(false);
    expect(fov.has(tileIndex(4, 1, map.w))).toBe(true); // beside its shadow
  });

  it("does not spill light sideways through a diagonal corner join", () => {
    // Two rooms touching only at a corner: (2,2) and (3,3) meet diagonally, walled at
    // (3,2) and (2,3). The exact diagonal ray is geometrically unobstructed, so it stays
    // lit — but nothing beside it does. A leak here would light the whole far room.
    const map = fromAscii([
      "######",
      "#..###",
      "#..###",
      "###..#",
      "###..#",
      "######",
    ]);
    const fov = computeFov(map, { x: 1, y: 1 }, 10);
    expect(fov.has(tileIndex(3, 3, map.w))).toBe(true);
    expect(fov.has(tileIndex(4, 3, map.w))).toBe(false);
    expect(fov.has(tileIndex(3, 4, map.w))).toBe(false);
  });

  it("respects the radius", () => {
    const rows = Array.from({ length: 21 }, (_, y) =>
      y === 0 || y === 20 ? "#".repeat(21) : `#${".".repeat(19)}#`,
    );
    const map = fromAscii(rows);
    const origin = { x: 10, y: 10 };
    const fov = computeFov(map, origin, 4);
    for (const index of fov) {
      const x = index % map.w;
      const y = Math.floor(index / map.w);
      const d2 = (x - origin.x) ** 2 + (y - origin.y) ** 2;
      expect(d2).toBeLessThanOrEqual(16);
    }
    expect(fov.has(tileIndex(14, 10, map.w))).toBe(true);
    expect(fov.has(tileIndex(15, 10, map.w))).toBe(false);
  });

  it("casts a one-tile-wide shadow from a pillar directly below the viewer", () => {
    const map = fromAscii([
      "#########",
      "#.......#",
      "#.......#",
      "#...#...#",
      "#.......#",
      "#########",
    ]);
    // Standing at (4,1), straight above the pillar at (4,3): the shadow is the column
    // behind it and nothing else. A widening shadow means the slopes are drifting.
    expect(visibleAscii(map, { x: 4, y: 1 }, 6)).toEqual([
      ".........",
      ".........",
      ".........",
      ".........",
      ".... ....",
      ".... ....",
    ]);
  });
});

describe("symmetry", () => {
  /**
   * The property the symmetric variant exists to provide: for floor tiles, seeing is mutual.
   * Without it you get enemies firing from tiles the player has no line to.
   */
  it("holds across generated floors", () => {
    for (const seed of ["sym-a", "sym-b", "sym-c"]) {
      const map = generateFloor(seed, 1);
      const floors: Vec2[] = [];
      for (let y = 0; y < map.h; y++) {
        for (let x = 0; x < map.w; x++) {
          if (map.tiles[tileIndex(x, y, map.w)] !== TILE_CODE.wall) floors.push({ x, y });
        }
      }

      // Sampling: the full O(n²) pairing over 700-odd floor tiles is slower than it is useful.
      const sample = floors.filter((_, i) => i % 17 === 0);
      const cache = new Map<number, Set<number>>();
      const fovOf = (p: Vec2) => {
        const key = tileIndex(p.x, p.y, map.w);
        let cached = cache.get(key);
        if (!cached) {
          cached = computeFov(map, p, FOV_RADIUS);
          cache.set(key, cached);
        }
        return cached;
      };

      for (const a of sample) {
        const seenByA = fovOf(a);
        for (const b of floors) {
          const bIndex = tileIndex(b.x, b.y, map.w);
          if (!seenByA.has(bIndex)) continue;
          const aIndex = tileIndex(a.x, a.y, map.w);
          expect(`${seed} ${a.x},${a.y}->${b.x},${b.y}:${fovOf(b).has(aIndex)}`).toBe(
            `${seed} ${a.x},${a.y}->${b.x},${b.y}:true`,
          );
        }
      }
    }
  });

  it("holds in a corridor maze", () => {
    const map = fromAscii([
      "###########",
      "#.........#",
      "#.#######.#",
      "#.#.....#.#",
      "#.#.###.#.#",
      "#.#.#...#.#",
      "#.#.#####.#",
      "#.........#",
      "###########",
    ]);
    const floors: Vec2[] = [];
    for (let y = 0; y < map.h; y++) {
      for (let x = 0; x < map.w; x++) {
        if (map.tiles[tileIndex(x, y, map.w)] !== TILE_CODE.wall) floors.push({ x, y });
      }
    }
    for (const a of floors) {
      const seenByA = computeFov(map, a, 10);
      for (const b of floors) {
        const mutual = computeFov(map, b, 10).has(tileIndex(a.x, a.y, map.w));
        expect(`${a.x},${a.y}<->${b.x},${b.y}:${seenByA.has(tileIndex(b.x, b.y, map.w))}`).toBe(
          `${a.x},${a.y}<->${b.x},${b.y}:${mutual}`,
        );
      }
    }
  });
});
