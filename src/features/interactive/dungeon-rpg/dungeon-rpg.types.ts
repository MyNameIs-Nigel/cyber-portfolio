/**
 * Shared shapes for the dungeon RPG. See `docs/dungeon-rpg.md`.
 *
 * Type-only imports here: `dungeon-rpg.constants.ts` imports this file for `TileKind`,
 * so anything but `import type` would be a runtime cycle.
 */
import type { PROFILE_SCHEMA_VERSION, RUN_SCHEMA_VERSION } from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";

export type Vec2 = { x: number; y: number };

export type Direction = "up" | "down" | "left" | "right";

export type TileKind = "wall" | "floor" | "door" | "stairs" | "chest" | "shop";

export type Room = { id: number; x: number; y: number; w: number; h: number };

/**
 * A generated floor. Derived from `(seed, floor)` and therefore **never persisted** —
 * `generateFloor` reproduces it exactly on load.
 */
export type FloorMap = {
  floor: number;
  w: number;
  h: number;
  /** Row-major tile codes; index with `y * w + x`. Values are `TILE_CODE` entries. */
  tiles: Uint8Array;
  rooms: Room[];
  spawn: Vec2;
  stairs: Vec2;
};

/**
 * One shape for the player and every enemy, so `combat.ts` never branches on
 * "is this the player". `aggression` is only read by enemy AI; `xpReward` is only
 * read when this combatant is the one defeated.
 */
export type Combatant = {
  id: string;
  name: string;
  level: number;
  /** HP. */
  integrity: number;
  maxIntegrity: number;
  /** MP — unspent until phase 5's skills. */
  cycles: number;
  maxCycles: number;
  atk: number;
  def: number;
  /** 0–1. How readily this combatant presses the attack instead of defending when hurt. */
  aggression: number;
  /** XP handed to the victor when this combatant falls. */
  xpReward: number;
};

/** An enemy standing on the map, before any battle starts. */
export type EnemyPlacement = {
  /** Stable per `(floor, index)` so a defeated enemy stays defeated across a reload. */
  id: string;
  defId: string;
  pos: Vec2;
  level: number;
};

export type ItemStack = { itemId: string; count: number };

/** Phase 4 fills this in; the shape exists now so `GameState` never needs reshaping. */
export type ShopState = { stock: ItemStack[]; cursor: number };

export type BattleChoice = "exploit" | "enumerate" | "isolate" | "flee";

export type BattleOutcome = "ongoing" | "won" | "lost" | "fled";

/** Resolved facts awaiting animation. The reducer has already applied all of them. */
export type BattleEvent =
  | { kind: "damage"; target: "player" | "enemy"; amount: number; crit: boolean }
  | { kind: "heal"; target: "player" | "enemy"; amount: number }
  | { kind: "status"; target: "player" | "enemy"; label: string }
  | { kind: "flee"; success: boolean }
  | { kind: "defeat"; target: "player" | "enemy" };

export type BattleState = {
  enemy: Combatant;
  /** Which `EnemyPlacement` this battle came from, so a win can remove it from the map. */
  placementId: string;
  turn: "player" | "enemy";
  cursor: BattleChoice;
  log: string[];
  pending: BattleEvent[];
  outcome: BattleOutcome;
  /** ENUMERATE: how many upcoming EXPLOITs still carry the analysis bonus. */
  analyzed: number;
  /** ISOLATE: incoming damage is halved while this is above zero. */
  playerGuard: number;
  enemyGuard: number;
  /** ISOLATE patches left this battle. Mitigation is unlimited; the healing is not. */
  patches: number;
  /** Whether ENUMERATE has exposed the enemy's stats to the HUD. */
  revealed: boolean;
  turns: number;
};

export type RunState = {
  seed: string;
  floor: number;
  player: Combatant;
  xp: number;
  pos: Vec2;
  /** Derived from `(seed, floor)`; not persisted. */
  map: FloorMap;
  /** Bitset, one bit per tile. Persisted base64-encoded. */
  explored: Uint8Array;
  /** Recomputed every move; not persisted. */
  visible: ReadonlySet<number>;
  /** Derived from `(seed, floor)`, minus everything in `defeated`. */
  enemies: EnemyPlacement[];
  /** `EnemyPlacement.id`s already beaten, across every floor of this run. */
  defeated: string[];
  inventory: ItemStack[];
  bounty: number;
  /** Position of the one RNG stream whose consumption depends on player choices. */
  rngCursor: number;
  log: string[];
  kills: number;
};

export type GameMode = "title" | "explore" | "battle" | "shop" | "dead" | "victory";

/**
 * Discriminated on `mode`, so illegal combinations can't be written down: an explore
 * state has no battle cursor by construction.
 */
export type GameState =
  | { mode: "title"; profile: Profile; hasRunSave: boolean }
  | { mode: "explore"; profile: Profile; run: RunState }
  | { mode: "battle"; profile: Profile; run: RunState; battle: BattleState }
  | { mode: "shop"; profile: Profile; run: RunState; shop: ShopState }
  | { mode: "dead"; profile: Profile; run: RunState; cause: string }
  | { mode: "victory"; profile: Profile; run: RunState };

export type GameAction =
  /** Storage is I/O, so the hook reads it and hands the result to the reducer. */
  | { type: "boot"; profile: Profile; hasRunSave: boolean }
  | { type: "run:new"; seed: string }
  | { type: "run:continue"; run: RunState }
  | { type: "run:abandon" }
  | { type: "move"; dir: Direction }
  | { type: "descend" }
  | { type: "battle:cursor"; choice: BattleChoice }
  | { type: "battle:choose"; choice: BattleChoice }
  | { type: "battle:advance" }
  | { type: "item:use"; itemId: string }
  | { type: "shop:buy"; itemId: string }
  | { type: "dismiss" };

export type MoveResult =
  | { kind: "blocked" }
  | { kind: "moved"; pos: Vec2; tile: TileKind }
  | { kind: "encounter"; pos: Vec2; placement: EnemyPlacement };

/** Top-left of the visible window, in tiles. The renderer owns it; the engine never sees it. */
export type Camera = { x: number; y: number };

// ── Persistence ───────────────────────────────────────────────────────────────

export type RunSave = {
  v: typeof RUN_SCHEMA_VERSION;
  seed: string;
  floor: number;
  player: Combatant;
  xp: number;
  pos: Vec2;
  /** base64 bitset, one bit per tile. */
  explored: string;
  defeated: string[];
  inventory: ItemStack[];
  bounty: number;
  kills: number;
  rngCursor: number;
  updatedAt: number;
};

export type Profile = {
  v: typeof PROFILE_SCHEMA_VERSION;
  deepestFloor: number;
  totalRuns: number;
  deaths: number;
  bestBounty: number;
  unlocks: string[];
  achievements: string[];
};

/** Why a write didn't land. The game keeps playing in memory either way. */
export type SaveStatus = "ok" | "unavailable" | "quota";
