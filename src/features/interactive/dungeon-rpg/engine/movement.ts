/**
 * One step of walking. Pure and non-mutating: `tryMove` reports what *would* happen and the
 * reducer decides what to do about it.
 *
 * Four-way only. That is decided here rather than in combat, because range maths downstream
 * gets to assume orthogonal steps for good — there is no diagonal `Direction` to reject at
 * runtime because there is no diagonal `Direction` to write down.
 */
import { computeFov } from "@/features/interactive/dungeon-rpg/engine/fov";
import { enemyAt } from "@/features/interactive/dungeon-rpg/engine/encounter";
import { inBounds, isWalkable, tileAt, tileIndex } from "@/features/interactive/dungeon-rpg/engine/grid";
import { setBit } from "@/features/interactive/dungeon-rpg/save/bitset";
import type { Direction, MoveResult, RunState, Vec2 } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

export const DIRECTION_DELTAS: Readonly<Record<Direction, Vec2>> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function tryMove(run: RunState, dir: Direction): MoveResult {
  const delta = DIRECTION_DELTAS[dir];
  const target: Vec2 = { x: run.pos.x + delta.x, y: run.pos.y + delta.y };

  if (!inBounds(run.map, target.x, target.y)) return { kind: "blocked" };
  if (!isWalkable(run.map, target.x, target.y)) return { kind: "blocked" };

  const placement = enemyAt(run.enemies, target);
  if (placement) return { kind: "encounter", pos: target, placement };

  return { kind: "moved", pos: target, tile: tileAt(run.map, target.x, target.y) };
}

/**
 * Moves the player and refreshes sight. Returns a new run — `explored` is copied rather than
 * mutated so a caller holding the previous state still holds the previous state.
 *
 * *Visible* and *explored* are deliberately separate: visible is recomputed every step and
 * thrown away, explored only ever grows and is the half that gets persisted.
 */
export function withPosition(run: RunState, pos: Vec2, sightRadius: number): RunState {
  const visible = computeFov(run.map, pos, sightRadius);
  const explored = Uint8Array.from(run.explored);
  for (const index of visible) setBit(explored, index);
  return { ...run, pos, visible, explored };
}

/** Recomputes sight where the player already stands — used on arriving at a floor. */
export function refreshSight(run: RunState, sightRadius: number): RunState {
  return withPosition(run, run.pos, sightRadius);
}

export function isOnStairs(run: RunState): boolean {
  return tileAt(run.map, run.pos.x, run.pos.y) === "stairs";
}

export function exploredIndexes(run: RunState): number[] {
  const out: number[] = [];
  for (let y = 0; y < run.map.h; y++) {
    for (let x = 0; x < run.map.w; x++) {
      const index = tileIndex(x, y, run.map.w);
      if ((run.explored[index >> 3]! & (1 << (index & 7))) !== 0) out.push(index);
    }
  }
  return out;
}
