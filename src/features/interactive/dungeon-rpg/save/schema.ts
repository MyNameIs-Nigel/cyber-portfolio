/**
 * Versioned save shapes and the type guards that police them.
 *
 * A `JSON.parse` result is untrusted input. `as RunSave` is a lie the compiler will happily
 * believe, so every field a save claims to have is actually checked here.
 */
import {
  PROFILE_SCHEMA_VERSION,
  RUN_SCHEMA_VERSION,
} from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";
import type { Combatant, ItemStack, Profile, RunSave, Vec2 } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function isVec2(value: unknown): value is Vec2 {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y);
}

export function isCombatant(value: unknown): value is Combatant {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    isFiniteNumber(value.level) &&
    isFiniteNumber(value.integrity) &&
    isFiniteNumber(value.maxIntegrity) &&
    isFiniteNumber(value.cycles) &&
    isFiniteNumber(value.maxCycles) &&
    isFiniteNumber(value.atk) &&
    isFiniteNumber(value.def) &&
    isFiniteNumber(value.aggression) &&
    isFiniteNumber(value.xpReward)
  );
}

function isItemStack(value: unknown): value is ItemStack {
  return isRecord(value) && typeof value.itemId === "string" && isFiniteNumber(value.count);
}

export function isRunSave(value: unknown): value is RunSave {
  if (!isRecord(value)) return false;
  return (
    value.v === RUN_SCHEMA_VERSION &&
    typeof value.seed === "string" &&
    value.seed.length > 0 &&
    isFiniteNumber(value.floor) &&
    isCombatant(value.player) &&
    isFiniteNumber(value.xp) &&
    isVec2(value.pos) &&
    typeof value.explored === "string" &&
    isStringArray(value.defeated) &&
    Array.isArray(value.inventory) &&
    value.inventory.every(isItemStack) &&
    isFiniteNumber(value.bounty) &&
    isFiniteNumber(value.kills) &&
    isFiniteNumber(value.rngCursor) &&
    isFiniteNumber(value.updatedAt)
  );
}

export function isProfile(value: unknown): value is Profile {
  if (!isRecord(value)) return false;
  return (
    value.v === PROFILE_SCHEMA_VERSION &&
    isFiniteNumber(value.deepestFloor) &&
    isFiniteNumber(value.totalRuns) &&
    isFiniteNumber(value.deaths) &&
    isFiniteNumber(value.bestBounty) &&
    isStringArray(value.unlocks) &&
    isStringArray(value.achievements)
  );
}

export function emptyProfile(): Profile {
  return {
    v: PROFILE_SCHEMA_VERSION,
    deepestFloor: 0,
    totalRuns: 0,
    deaths: 0,
    bestBounty: 0,
    unlocks: [],
    achievements: [],
  };
}
