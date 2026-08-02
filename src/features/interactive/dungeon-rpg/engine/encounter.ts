/**
 * Where enemies stand, and what they are when a battle starts.
 *
 * Placements come from `rngFor(seed, "encounter", floor)` at generation time, so they are
 * visible on the map rather than sprung as random-step ambushes. Visible enemies mean the
 * player makes decisions with information, which avoids the "walked three tiles and got
 * jumped" feel that ages badly.
 */
import { enemiesForFloor, type EnemyDef } from "@/features/interactive/dungeon-rpg/content/enemies";
import { floorConfig } from "@/features/interactive/dungeon-rpg/content/floors";
import { isWalkable, samePos, tileAt } from "@/features/interactive/dungeon-rpg/engine/grid";
import { rngFor } from "@/features/interactive/dungeon-rpg/engine/rng";
import type { Combatant, EnemyPlacement, FloorMap, Vec2 } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

/** Enemies keep clear of the spawn room so a floor never opens with a forced fight. */
const SPAWN_EXCLUSION_RADIUS = 6;

function farEnough(a: Vec2, b: Vec2, radius: number): boolean {
  return Math.abs(a.x - b.x) > radius || Math.abs(a.y - b.y) > radius;
}

export function placeEnemies(seed: string, map: FloorMap): EnemyPlacement[] {
  const config = floorConfig(map.floor);
  const roster = enemiesForFloor(map.floor);
  if (roster.length === 0) return [];

  const rng = rngFor(seed, "encounter", map.floor);

  const candidates: Vec2[] = [];
  for (const room of map.rooms) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        const pos = { x, y };
        if (!isWalkable(map, x, y)) continue;
        if (tileAt(map, x, y) === "stairs") continue;
        if (samePos(pos, map.spawn)) continue;
        if (!farEnough(pos, map.spawn, SPAWN_EXCLUSION_RADIUS)) continue;
        candidates.push(pos);
      }
    }
  }
  if (candidates.length === 0) return [];

  const shuffled = rng.shuffle(candidates);
  const count = Math.min(config.enemyCount, shuffled.length);
  const weights = roster.map((def) => ({ value: def, weight: def.weight }));

  const placements: EnemyPlacement[] = [];
  for (let i = 0; i < count; i++) {
    const def = rng.weighted(weights);
    placements.push({
      id: `f${map.floor}e${i}`,
      defId: def.id,
      pos: shuffled[i]!,
      level: Math.max(1, 1 + config.levelBonus + rng.int(0, 1)),
    });
  }
  return placements;
}

/** Base stats grow ~18% per level over base — enough to matter, not enough to spike. */
export function scaleEnemy(def: EnemyDef, level: number): Combatant {
  const growth = 1 + (level - 1) * 0.18;
  const maxIntegrity = Math.round(def.integrity * growth);
  const maxCycles = Math.round(def.cycles * growth);
  return {
    id: def.id,
    name: def.name,
    level,
    integrity: maxIntegrity,
    maxIntegrity,
    cycles: maxCycles,
    maxCycles,
    atk: Math.round(def.atk * growth),
    def: Math.round(def.def * growth),
    aggression: def.aggression,
    xpReward: Math.round(def.xp * growth),
  };
}

export function enemyAt(placements: readonly EnemyPlacement[], pos: Vec2): EnemyPlacement | undefined {
  return placements.find((p) => samePos(p.pos, pos));
}
