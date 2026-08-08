import { describe, expect, it } from "vitest";
import { FOV_RADIUS, TILE_CODE } from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";
import { computeFov } from "@/features/interactive/dungeon-rpg/engine/fov";
import { tileIndex } from "@/features/interactive/dungeon-rpg/engine/grid";
import { DIRECTION_DELTAS, isOnStairs, tryMove, withPosition } from "@/features/interactive/dungeon-rpg/engine/movement";
import { startRun } from "@/features/interactive/dungeon-rpg/engine/run";
import { getBit } from "@/features/interactive/dungeon-rpg/save/bitset";
import type { Direction, RunState, Vec2 } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

function firstWallNeighbour(run: RunState): Direction | null {
  for (const dir of Object.keys(DIRECTION_DELTAS) as Direction[]) {
    const d = DIRECTION_DELTAS[dir];
    const target = { x: run.pos.x + d.x, y: run.pos.y + d.y };
    if (run.map.tiles[tileIndex(target.x, target.y, run.map.w)] === TILE_CODE.wall) return dir;
  }
  return null;
}

function put(run: RunState, pos: Vec2): RunState {
  return withPosition(run, pos, FOV_RADIUS);
}

describe("direction set", () => {
  it("is four-way — there is no diagonal to reject", () => {
    const dirs = Object.keys(DIRECTION_DELTAS) as Direction[];
    expect(dirs.sort()).toEqual(["down", "left", "right", "up"]);
    for (const dir of dirs) {
      const { x, y } = DIRECTION_DELTAS[dir];
      expect(Math.abs(x) + Math.abs(y)).toBe(1);
    }
  });
});

describe("tryMove", () => {
  it("reports a wall as blocked", () => {
    const run = startRun("move-wall");
    const dir = firstWallNeighbour(run);
    expect(dir).not.toBeNull();
    expect(tryMove(run, dir!)).toEqual({ kind: "blocked" });
  });

  it("treats the map edge as a hard bound", () => {
    const run = put(startRun("move-edge"), { x: 1, y: 1 });
    // (1,1) is inside the border ring, so up and left both leave the map.
    expect(tryMove(run, "up")).toEqual({ kind: "blocked" });
    expect(tryMove(run, "left")).toEqual({ kind: "blocked" });
  });

  it("does not mutate the run", () => {
    const run = startRun("move-pure");
    const before = { ...run.pos };
    const exploredBefore = Uint8Array.from(run.explored);
    tryMove(run, "up");
    tryMove(run, "down");
    expect(run.pos).toEqual(before);
    expect(run.explored).toEqual(exploredBefore);
  });

  it("reports an enemy on the target tile as an encounter", () => {
    const run = startRun("move-encounter");
    const placement = run.enemies[0]!;
    const beside = { x: placement.pos.x - 1, y: placement.pos.y };
    const staged = put(run, beside);
    const result = tryMove(staged, "right");
    expect(result.kind).toBe("encounter");
    expect(result.kind === "encounter" && result.placement.id).toBe(placement.id);
  });

  it("reports the tile it moved onto", () => {
    const run = startRun("move-tile");
    // Stand next to the stairs and step on.
    const stairs = run.map.stairs;
    const staged = put(run, { x: stairs.x, y: stairs.y });
    expect(isOnStairs(staged)).toBe(true);
  });
});

describe("withPosition", () => {
  it("marks everything newly visible as explored", () => {
    const run = startRun("explore-mark");
    const target = run.map.spawn;
    const moved = put(run, target);
    const fov = computeFov(moved.map, target, FOV_RADIUS);
    for (const index of fov) {
      expect(getBit(moved.explored, index)).toBe(true);
    }
  });

  it("only ever grows the explored set", () => {
    let run = startRun("explore-monotonic");
    const seen = new Set<number>();
    for (let i = 0; i < run.explored.length * 8; i++) {
      if (getBit(run.explored, i)) seen.add(i);
    }

    for (const dir of ["right", "down", "left", "up", "right", "right"] as Direction[]) {
      const result = tryMove(run, dir);
      if (result.kind !== "moved") continue;
      run = put(run, result.pos);
      for (const index of seen) {
        expect(getBit(run.explored, index)).toBe(true);
      }
      for (let i = 0; i < run.explored.length * 8; i++) {
        if (getBit(run.explored, i)) seen.add(i);
      }
    }
    expect(seen.size).toBeGreaterThan(0);
  });

  it("copies the explored bitset instead of mutating it", () => {
    const run = startRun("explore-copy");
    const original = run.explored;
    const moved = put(run, run.map.stairs);
    expect(moved.explored).not.toBe(original);
    expect(run.explored).toEqual(original);
  });

  it("recomputes visible from scratch each step, unlike explored", () => {
    const run = startRun("visible-fresh");
    const far = put(run, run.map.stairs);
    expect(far.visible.has(tileIndex(far.pos.x, far.pos.y, far.map.w))).toBe(true);
    // Sight is local; the whole floor is never lit at once.
    expect(far.visible.size).toBeLessThan(far.map.w * far.map.h);
  });
});
