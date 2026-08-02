import type { TileKind } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

// ── Persistence ───────────────────────────────────────────────────────────────
// Keying storage off the version means a bump moves to a new key automatically:
// old data is orphaned rather than misread. Same trick as `FS_SCHEMA_VERSION`.

export const RUN_SCHEMA_VERSION = 1;
export const PROFILE_SCHEMA_VERSION = 1;
export const RUN_STORAGE_KEY = `dungeon-rpg:run:v${RUN_SCHEMA_VERSION}`;
export const PROFILE_STORAGE_KEY = `dungeon-rpg:profile:v${PROFILE_SCHEMA_VERSION}`;

// ── Map ───────────────────────────────────────────────────────────────────────

export const TILE_PX = 16;
export const FLOOR_COUNT = 5;
export const MAP_W = 48;
export const MAP_H = 32;
export const TILE_COUNT = MAP_W * MAP_H;

export const TILE_CODE = {
  wall: 0,
  floor: 1,
  door: 2,
  stairs: 3,
  chest: 4,
  shop: 5,
} satisfies Record<TileKind, number>;

export const TILE_BY_CODE: readonly TileKind[] = ["wall", "floor", "door", "stairs", "chest", "shop"];

/** Everything except `wall`. Doors are cosmetic — you walk straight through them. */
export const WALKABLE_TILES: ReadonlySet<TileKind> = new Set<TileKind>(["floor", "door", "stairs", "chest", "shop"]);

// ── Generation ────────────────────────────────────────────────────────────────

/** Smallest BSP leaf worth splitting further; must fit a room plus a one-tile margin. */
export const MIN_LEAF = 9;
export const MIN_ROOM_W = 5;
export const MIN_ROOM_H = 4;
export const MAX_BSP_DEPTH = 5;
/** Retries before falling back to a hardcoded known-good layout. */
export const MAX_GEN_ATTEMPTS = 20;

// ── Sight ─────────────────────────────────────────────────────────────────────

export const FOV_RADIUS = 8;

// ── Inventory and logs ────────────────────────────────────────────────────────

export const MAX_INVENTORY = 12;
/** Bounded so a long run can't grow the save without limit. */
export const MAX_LOG_LINES = 200;

// ── Player ────────────────────────────────────────────────────────────────────

export const PLAYER_BASE_INTEGRITY = 40;
export const PLAYER_BASE_CYCLES = 12;
export const PLAYER_BASE_ATK = 8;
export const PLAYER_BASE_DEF = 3;

export const LEVEL_UP_INTEGRITY = 8;
export const LEVEL_UP_CYCLES = 3;
export const LEVEL_UP_ATK = 2;
export const LEVEL_UP_DEF = 1;

/** XP needed to reach level 2; each level after costs `XP_GROWTH` times the last. */
export const XP_BASE = 20;
export const XP_GROWTH = 1.45;
export const MAX_LEVEL = 30;

// ── Combat ────────────────────────────────────────────────────────────────────

export const DAMAGE_VARIANCE_MIN = 0.85;
export const DAMAGE_VARIANCE_MAX = 1.15;
export const CRIT_CHANCE = 0.1;
export const CRIT_MULTIPLIER = 1.75;
/** ENUMERATE costs a turn; this is what the next EXPLOIT buys with it. */
export const ENUMERATE_MULTIPLIER = 1.8;
/** ISOLATE halves one incoming hit and patches back this fraction of max Integrity. */
export const ISOLATE_DAMAGE_MULTIPLIER = 0.5;
export const ISOLATE_REGEN_FRACTION = 0.08;
/**
 * Patches per battle. Without a budget, turtling regenerates faster than a weak enemy can
 * chip through a halved hit, and the battle never ends. Mitigation stays available all
 * battle; only the healing runs out.
 */
export const ISOLATE_PATCH_BUDGET = 2;
export const FLEE_BASE_CHANCE = 0.55;
/** Each level the enemy has on you shaves this much off the flee roll. */
export const FLEE_LEVEL_PENALTY = 0.08;
export const FLEE_MIN_CHANCE = 0.15;
export const FLEE_MAX_CHANCE = 0.95;
/** Below this fraction of max Integrity an enemy may choose to defend instead of attack. */
export const ENEMY_DEFEND_THRESHOLD = 0.35;
/** A battle that hasn't resolved by here is a bug; the termination sweep asserts it never happens. */
export const MAX_BATTLE_TURNS = 200;

// ── Rendering ─────────────────────────────────────────────────────────────────

/** Viewport in tiles. Odd numbers keep the player exactly centred. */
export const VIEW_W = 31;
export const VIEW_H = 21;
export const EXPLORED_DIM_ALPHA = 0.55;
