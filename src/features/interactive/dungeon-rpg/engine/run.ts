/**
 * Run lifecycle: starting one, walking into a new floor, and the two conversions between the
 * live `RunState` and the much smaller `RunSave`.
 *
 * The map, the enemy placements, and the visible set are all **derived** from `(seed, floor)`,
 * so none of them are persisted. Only the parts that can't be recomputed are: where you stand,
 * what you're carrying, what you've already killed, what you've already seen, and the one RNG
 * cursor whose position depends on choices rather than on an index.
 */
import { RUN_SCHEMA_VERSION, TILE_COUNT } from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";
import { floorConfig } from "@/features/interactive/dungeon-rpg/content/floors";
import { LOG } from "@/features/interactive/dungeon-rpg/content/flavor";
import { placeEnemies } from "@/features/interactive/dungeon-rpg/engine/encounter";
import { appendLog } from "@/features/interactive/dungeon-rpg/engine/log";
import { generateFloor } from "@/features/interactive/dungeon-rpg/engine/mapgen";
import { refreshSight } from "@/features/interactive/dungeon-rpg/engine/movement";
import { createPlayer } from "@/features/interactive/dungeon-rpg/engine/progression";
import { createBitset, decodeBitset, encodeBitset } from "@/features/interactive/dungeon-rpg/save/bitset";
import type { RunSave, RunState } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

/** Builds the floor-scoped half of a run: map, enemies, fresh fog, sight from spawn. */
function buildFloor(run: Omit<RunState, "map" | "enemies" | "explored" | "visible" | "pos">, floor: number): RunState {
  const map = generateFloor(run.seed, floor);
  const config = floorConfig(floor);
  const placements = placeEnemies(run.seed, map).filter((p) => !run.defeated.includes(p.id));

  const staged: RunState = {
    ...run,
    floor,
    map,
    pos: map.spawn,
    explored: createBitset(TILE_COUNT),
    visible: new Set<number>(),
    enemies: placements,
  };

  return refreshSight(staged, config.sightRadius);
}

export function startRun(seed: string): RunState {
  const config = floorConfig(1);
  const base = {
    seed,
    floor: 1,
    player: createPlayer(),
    xp: 0,
    defeated: [] as string[],
    inventory: [],
    bounty: 0,
    rngCursor: 0,
    log: appendLog([], LOG.runStart(seed), LOG.arrive(config.segment, 1)),
    kills: 0,
  };
  return buildFloor(base, 1);
}

/** Moves the run to `floor`, regenerating everything derived. Fog resets; the player doesn't. */
export function enterFloor(run: RunState, floor: number): RunState {
  const config = floorConfig(floor);
  const next = buildFloor(
    {
      seed: run.seed,
      floor,
      player: run.player,
      xp: run.xp,
      defeated: run.defeated,
      inventory: run.inventory,
      bounty: run.bounty,
      rngCursor: run.rngCursor,
      log: appendLog(run.log, LOG.arrive(config.segment, floor)),
      kills: run.kills,
    },
    floor,
  );
  return next;
}

export function toRunSave(run: RunState, now: number = Date.now()): RunSave {
  return {
    v: RUN_SCHEMA_VERSION,
    seed: run.seed,
    floor: run.floor,
    player: run.player,
    xp: run.xp,
    pos: run.pos,
    explored: encodeBitset(run.explored),
    defeated: run.defeated,
    inventory: run.inventory,
    bounty: run.bounty,
    kills: run.kills,
    rngCursor: run.rngCursor,
    updatedAt: now,
  };
}

/**
 * Rebuilds a live run from a save. Returns `null` rather than a half-built run if the save is
 * internally inconsistent — a position outside the map, or a bitset that won't decode.
 * The caller starts fresh; it never patches around a bad save.
 */
export function fromRunSave(save: RunSave): RunState | null {
  const map = generateFloor(save.seed, save.floor);
  const explored = decodeBitset(save.explored, TILE_COUNT);
  if (!explored) return null;
  if (save.pos.x < 0 || save.pos.y < 0 || save.pos.x >= map.w || save.pos.y >= map.h) return null;
  if (!Number.isInteger(save.pos.x) || !Number.isInteger(save.pos.y)) return null;

  const config = floorConfig(save.floor);
  const staged: RunState = {
    seed: save.seed,
    floor: save.floor,
    player: save.player,
    xp: save.xp,
    pos: save.pos,
    map,
    explored,
    visible: new Set<number>(),
    enemies: placeEnemies(save.seed, map).filter((p) => !save.defeated.includes(p.id)),
    defeated: save.defeated,
    inventory: save.inventory,
    bounty: save.bounty,
    rngCursor: save.rngCursor,
    log: appendLog([], LOG.arrive(config.segment, save.floor)),
    kills: save.kills,
  };
  return refreshSight(staged, config.sightRadius);
}
