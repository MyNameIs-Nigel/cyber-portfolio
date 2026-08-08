# Phase 0 — Foundations

> **Shipped.** See the deviation table in [the roadmap](./README.md#where-phases-02-landed).

**Ships:** types, constants, seeded RNG, save layer. **No gameplay, nothing visible.**
**Gate:** RNG and storage suites green; determinism proven.

The least exciting phase and the one most likely to be rushed. Everything after this inherits these
decisions, and the two hardest bugs to retrofit — RNG desync and save corruption — are both
prevented here or not at all.

---

## 1. Scaffold

```
src/features/interactive/dungeon-rpg/
  dungeon-rpg.types.ts
  dungeon-rpg.constants.ts
  engine/rng.ts
  engine/rng.test.ts
  save/schema.ts
  save/storage.ts
  save/storage.test.ts
```

Nothing is registered in `registry-meta.ts` or `InteractiveAppHost.tsx` yet — there is no component
to register. The slug stays `published: false`.

---

## 2. Types (`dungeon-rpg.types.ts`)

Model the state so illegal combinations can't be written down.

```ts
export type Vec2 = { x: number; y: number };

export type TileKind = "wall" | "floor" | "door" | "stairs" | "chest" | "shop";

export type GameMode = "title" | "explore" | "battle" | "shop" | "dead" | "victory";

/** Discriminated on `mode` — an explore state has no battle cursor, by construction. */
export type GameState =
  | { mode: "title"; profile: Profile; hasRunSave: boolean }
  | { mode: "explore"; run: RunState }
  | { mode: "battle"; run: RunState; battle: BattleState }
  | { mode: "shop"; run: RunState; shop: ShopState }
  | { mode: "dead"; run: RunState; cause: string }
  | { mode: "victory"; run: RunState };

export type GameAction =
  | { type: "run:new"; seed: string }
  | { type: "run:continue" }
  | { type: "move"; dir: Direction }
  | { type: "descend" }
  | { type: "battle:choose"; choice: BattleChoice }
  | { type: "item:use"; itemId: string }
  | { type: "shop:buy"; itemId: string }
  | { type: "dismiss" };
```

Write the full union now even where phases 2–5 fill in the payloads. A stub field is cheaper than
reshaping `GameState` in phase 4.

**`Combatant`** is shared by the player and enemies — same shape, same combat maths, no branching on
"is this the player" inside `combat.ts`.

---

## 3. Constants (`dungeon-rpg.constants.ts`)

Every magic number lands here, named, with a comment where the value isn't obvious.

```ts
export const RUN_SCHEMA_VERSION = 1;
export const PROFILE_SCHEMA_VERSION = 1;
export const RUN_STORAGE_KEY = `dungeon-rpg:run:v${RUN_SCHEMA_VERSION}`;
export const PROFILE_STORAGE_KEY = `dungeon-rpg:profile:v${PROFILE_SCHEMA_VERSION}`;

export const TILE_PX = 16;
export const FLOOR_COUNT = 5;
export const MAP_W = 48;
export const MAP_H = 32;

export const MAX_INVENTORY = 12;
export const MAX_LOG_LINES = 200;   // bounded so a long run can't grow the save without limit
export const MAX_GEN_ATTEMPTS = 20; // mapgen retries before falling back to a known-good layout
```

Keying storage off the version constant means a bump automatically moves to a new key — old data is
orphaned rather than misread, the same trick `FS_SCHEMA_VERSION` uses in the shell.

---

## 4. Seeded RNG (`engine/rng.ts`) — the load-bearing part

Two things must be true, and they pull in opposite directions:

- A reloaded save must reproduce the run exactly.
- Cosmetic randomness (flavor text, particles) must be free to consume numbers without affecting
  gameplay.

A single global stream cannot do both. So:

```ts
/** mulberry32 — small, fast, good enough, and trivially reimplementable. No dependency. */
export function makeRng(seed: number): Rng;

/** Deterministic sub-stream. Same (seed, purpose, index) → same sequence, always. */
export function rngFor(seed: string, purpose: RngPurpose, index: number): Rng;

export type RngPurpose = "mapgen" | "loot" | "encounter" | "flavor" | "combat";
```

`rngFor` hashes `${seed}:${purpose}:${index}` (FNV-1a or similar) into a 32-bit seed. Consequences
worth stating explicitly:

- Floor 3's layout is `rngFor(seed, "mapgen", 3)` — regenerating it on load gives the identical map,
  so **the map is never stored in the save**. Only the explored bitset is.
- A chest's contents are `rngFor(seed, "loot", roomId)` — stable across reloads without persisting
  loot tables.
- **Combat is the sole exception.** Its consumption depends on player choices and can't be
  re-derived from an index, so `RunState.rngCursor` persists that one stream's position.

Helpers: `int(min, max)`, `pick(array)`, `weighted(entries)`, `shuffle(array)`, `chance(p)`.

### Tests
- Same seed → identical sequence; different seeds → different.
- Sub-streams are independent: exhausting `"flavor"` does not shift `"mapgen"` output.
- Order-insensitive: deriving `"loot"` before or after `"mapgen"` yields the same values.
- `weighted` respects weights across a large sample; zero-weight entries never appear.
- Cursor round-trip: save at N draws, restore, continue → matches the uninterrupted sequence.

---

## 5. Save layer (`save/schema.ts`, `save/storage.ts`)

```ts
export type RunSave = {
  v: typeof RUN_SCHEMA_VERSION;
  seed: string;
  floor: number;
  player: Combatant;
  pos: Vec2;
  explored: string;      // base64 bitset, one bit per tile
  inventory: ItemStack[];
  bounty: number;
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
```

`storage.ts` rules, all of which exist because a portfolio site must not white-screen:

- **Every read is wrapped.** Missing key, unparseable JSON, wrong `v`, hostile hand-edited values,
  `localStorage` throwing because the browser blocks it (private mode, cookies off) — each returns
  `null` and the caller starts fresh. **No read path may throw.**
- **Type guards, not casts.** `isRunSave(x)` actually checks fields. A `JSON.parse` result is
  untrusted input, and `as RunSave` is a lie the compiler will happily believe.
- **Writes are quota-safe.** `QuotaExceededError` is caught; the game keeps playing in memory and
  surfaces a quiet "progress won't be saved" note rather than dying mid-run.
- **Run and profile are independent.** Clearing a run on death must not touch the profile. This is
  the single most annoying bug to discover in phase 6, so it gets a test now.
- **Bitset over coordinates.** `MAP_W * MAP_H = 1536` bits ≈ 192 bytes ≈ ~256 base64 chars, versus
  several KB as a coordinate array.

### Tests
- Round-trip: write → read → deep equal.
- Corrupt JSON → `null`, no throw. Valid JSON with wrong shape → `null`, no throw.
- Wrong `v` → `null` (or migrates, once a v2 exists).
- Quota exceeded on write → caught, no throw, reported.
- `localStorage` absent entirely → all operations degrade silently.
- Clearing the run leaves the profile byte-identical.
- Bitset set/get round-trips across the full map, including the last bit (off-by-one at the tail is
  the classic failure).

---

## 6. Housekeeping

- Update the `dungeon-rpg` entry in `src/data/interactiveProjects.ts`: replace the
  "EarthBound-inspired vibes" copy with the cyber-theme description. Leave `published: false` and
  `status: "coming-soon"` alone.
- Fix the stale "There is no test runner configured in this project" line in `CLAUDE.md`.
- Add a `dungeon-rpg` section to `src/features/interactive/README.md` pointing at
  `docs/dungeon-rpg.md`.

---

## Exit criteria

- [x] `npm run test` green, including determinism and corruption suites
- [x] `npm run lint` and `tsc --noEmit` clean
- [x] `npm run build` succeeds; site behaves exactly as before (nothing user-visible changed)
- [x] `/projects/interactive/dungeon-rpg` still 404s
- [x] No new runtime dependency
