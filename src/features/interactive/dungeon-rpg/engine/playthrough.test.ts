import { describe, expect, it } from "vitest";
import { FLOOR_COUNT } from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";
import { distanceField, tileIndex } from "@/features/interactive/dungeon-rpg/engine/grid";
import { DIRECTION_DELTAS } from "@/features/interactive/dungeon-rpg/engine/movement";
import { reduce, titleState } from "@/features/interactive/dungeon-rpg/engine/reducer";
import { emptyProfile } from "@/features/interactive/dungeon-rpg/save/schema";
import type { Direction, GameState } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

const MAX_STEPS = 4000;

/**
 * Plays a whole run through the public reducer, exactly as the view would: walk toward the
 * pivot point, fight whatever stands on the way, descend, repeat. No engine internals are
 * poked, so a green result here means the loop a visitor gets is genuinely playable.
 */
function playToTheEnd(seed: string, boost = 0): { state: GameState; steps: number; battles: number } {
  let state: GameState = reduce(titleState(emptyProfile(), false), { type: "run:new", seed });
  if (state.mode !== "explore") throw new Error("run did not start");

  if (boost !== 0) {
    const player = state.run.player;
    state = {
      ...state,
      run: {
        ...state.run,
        player: {
          ...player,
          atk: player.atk + boost,
          def: player.def + boost,
          maxIntegrity: player.maxIntegrity + boost * 20,
          integrity: player.maxIntegrity + boost * 20,
        },
      },
    };
  }

  let steps = 0;
  let battles = 0;
  let field: Int32Array | null = null;
  let fieldFloor = -1;

  while (steps < MAX_STEPS) {
    steps++;

    if (state.mode === "victory" || state.mode === "dead") break;

    if (state.mode === "battle") {
      if (state.battle.outcome !== "ongoing") {
        state = reduce(state, { type: "battle:advance" });
        continue;
      }
      if (state.battle.turns === 0) battles++;
      // ENUMERATE first, then press — the intended play pattern, not a degenerate one.
      state = reduce(state, { type: "battle:choose", choice: state.battle.turns === 0 ? "enumerate" : "exploit" });
      continue;
    }

    if (state.mode !== "explore") break;

    const { run } = state;
    if (run.floor !== fieldFloor) {
      field = distanceField(run.map, run.map.stairs);
      fieldFloor = run.floor;
    }

    const here = field![tileIndex(run.pos.x, run.pos.y, run.map.w)]!;
    if (here === 0) {
      state = reduce(state, { type: "descend" });
      continue;
    }

    // Greedy descent of the distance field. Every walkable tile is connected, so this
    // always finds the stairs — if it ever doesn't, mapgen regressed.
    let chosen: Direction | null = null;
    for (const dir of Object.keys(DIRECTION_DELTAS) as Direction[]) {
      const delta = DIRECTION_DELTAS[dir];
      const nx = run.pos.x + delta.x;
      const ny = run.pos.y + delta.y;
      if (nx < 0 || ny < 0 || nx >= run.map.w || ny >= run.map.h) continue;
      const next = field![tileIndex(nx, ny, run.map.w)]!;
      if (next !== -1 && next < here) {
        chosen = dir;
        break;
      }
    }
    expect(`${seed}#${run.floor}@${run.pos.x},${run.pos.y}:${chosen !== null}`).toBe(
      `${seed}#${run.floor}@${run.pos.x},${run.pos.y}:true`,
    );

    state = reduce(state, { type: "move", dir: chosen! });
  }

  return { state, steps, battles };
}

describe("full playthrough", () => {
  it("can be won: a capable player clears all five segments", () => {
    const { state, steps, battles } = playToTheEnd("WINRUN", 20);
    expect(state.mode).toBe("victory");
    if (state.mode !== "victory") throw new Error("unreachable");
    expect(state.run.floor).toBe(FLOOR_COUNT);
    expect(battles).toBeGreaterThan(0);
    expect(steps).toBeLessThan(MAX_STEPS);
  });

  it("can be won across several unrelated seeds", () => {
    for (const seed of ["ALPHA1", "BRAVO2", "CHARLIE3", "DELTA4"]) {
      const { state } = playToTheEnd(seed, 20);
      expect(`${seed}:${state.mode}`).toBe(`${seed}:victory`);
    }
  });

  it("can be lost: an outmatched player dies rather than stalling forever", () => {
    const { state, steps } = playToTheEnd("LOSERUN", -2);
    expect(state.mode).toBe("dead");
    expect(steps).toBeLessThan(MAX_STEPS);
  });

  it("banks progress along the way", () => {
    const { state } = playToTheEnd("PROGRESS", 20);
    if (state.mode !== "victory") throw new Error("expected victory");
    expect(state.run.kills).toBeGreaterThan(0);
    expect(state.run.bounty).toBeGreaterThan(0);
    expect(state.run.player.level).toBeGreaterThan(1);
    expect(state.run.defeated.length).toBe(state.run.kills);
  });
});
