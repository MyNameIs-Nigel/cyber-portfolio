/** XP, levels, and the player's starting shape. Pure. */
import {
  LEVEL_UP_ATK,
  LEVEL_UP_CYCLES,
  LEVEL_UP_DEF,
  LEVEL_UP_INTEGRITY,
  MAX_LEVEL,
  PLAYER_BASE_ATK,
  PLAYER_BASE_CYCLES,
  PLAYER_BASE_DEF,
  PLAYER_BASE_INTEGRITY,
  XP_BASE,
  XP_GROWTH,
} from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";
import { PLAYER_NAME } from "@/features/interactive/dungeon-rpg/content/flavor";
import type { Combatant } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

export function createPlayer(): Combatant {
  return {
    id: "player",
    name: PLAYER_NAME,
    level: 1,
    integrity: PLAYER_BASE_INTEGRITY,
    maxIntegrity: PLAYER_BASE_INTEGRITY,
    cycles: PLAYER_BASE_CYCLES,
    maxCycles: PLAYER_BASE_CYCLES,
    atk: PLAYER_BASE_ATK,
    def: PLAYER_BASE_DEF,
    // Unread for the player — they choose their own actions and award nobody XP.
    aggression: 0,
    xpReward: 0,
  };
}

/** Total XP needed to go from `level` to `level + 1`. */
export function xpToNext(level: number): number {
  if (level >= MAX_LEVEL) return Number.POSITIVE_INFINITY;
  return Math.round(XP_BASE * XP_GROWTH ** (level - 1));
}

export type XpResult = { player: Combatant; xp: number; levelsGained: number };

/**
 * Banks XP and applies every level it pays for. A level-up also patches the Integrity it
 * added, so clearing a hard fight is a real reprieve rather than a bigger empty bar.
 */
export function applyXp(player: Combatant, currentXp: number, gained: number): XpResult {
  let xp = currentXp + Math.max(0, gained);
  let next = { ...player };
  let levelsGained = 0;

  while (next.level < MAX_LEVEL && xp >= xpToNext(next.level)) {
    xp -= xpToNext(next.level);
    next = {
      ...next,
      level: next.level + 1,
      maxIntegrity: next.maxIntegrity + LEVEL_UP_INTEGRITY,
      integrity: Math.min(next.maxIntegrity + LEVEL_UP_INTEGRITY, next.integrity + LEVEL_UP_INTEGRITY),
      maxCycles: next.maxCycles + LEVEL_UP_CYCLES,
      cycles: Math.min(next.maxCycles + LEVEL_UP_CYCLES, next.cycles + LEVEL_UP_CYCLES),
      atk: next.atk + LEVEL_UP_ATK,
      def: next.def + LEVEL_UP_DEF,
    };
    levelsGained += 1;
  }

  return { player: next, xp, levelsGained };
}
