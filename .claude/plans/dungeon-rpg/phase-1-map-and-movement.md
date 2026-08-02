# Phase 1 — Map generation, rendering, and movement

**Ships:** a generated floor you can walk around, on a canvas, with fog of war. No enemies yet.
**Gate:** reachability property test over 1000 seeds; a floor is genuinely explorable.

First phase with pixels. Also the phase where a subtle generator bug can hide for weeks, so the
reachability guarantee is written as a test before the renderer exists.

---

## 1. Map generation (`engine/mapgen.ts`)

```ts
export function generateFloor(seed: string, floor: number): FloorMap;
```

Pure. Same arguments → same map, every time. **The map is never saved** — it's recomputed on load
from `rngFor(seed, "mapgen", floor)`.

**Algorithm: BSP room-and-corridor.** Chosen over cellular automata (which makes organic caves that
read as a blob at 16px tiles and complicates door placement) and over drunkard's walk (which needs
retry loops to guarantee connectivity anyway). BSP gives rectangular rooms connected by construction
— the tree structure *is* the connectivity proof.

1. Recursively split `MAP_W × MAP_H` until leaves hit a minimum size.
2. Carve one room per leaf, inset randomly within the leaf.
3. Walk back up the tree connecting sibling rooms with L-corridors. Connectivity is structural.
4. Place doors where a corridor meets a room wall.
5. Place spawn in the room furthest from the stairs (BFS distance, not Euclidean — corridor layout
   is what the player actually walks).
6. Place stairs; reserve room slots for chest/shop/boss for later phases.
7. **Validate:** BFS from spawn must reach the stairs and every room. On failure, retry with a
   derived seed, up to `MAX_GEN_ATTEMPTS`, then fall back to a hardcoded known-good layout.

The retry loop must stay deterministic: attempt *n* uses `rngFor(seed, "mapgen", floor * 100 + n)`,
not a mutated stream. Otherwise a reload picks a different attempt and the map changes underfoot.

### Tests — the important ones in this plan
- **Property test, 1000 seeds × 5 floors:** spawn reaches stairs; every room reachable; no room
  overlaps; no floor tile sealed by walls on all four sides; spawn and stairs never coincide.
- Determinism: `generateFloor("abc", 3)` deep-equals a second call.
- Floor number affects layout (floor 1 ≠ floor 2 for one seed).
- Bounds: no tile written outside the map; the border is solid wall.
- The fallback layout itself passes every reachability assertion.

---

## 2. Field of view (`engine/fov.ts`)

```ts
export function computeFov(map: FloorMap, origin: Vec2, radius: number): Set<number>;
```

Recursive shadowcasting — the standard roguelike solution, symmetric and artifact-free.

Two distinct visibility layers, and conflating them is a common bug:

- **Visible** — lit right now, recomputed every move, not persisted.
- **Explored** — seen at least once, drawn dimmed, persisted in the run save bitset.

### Tests
- Symmetry: if A sees B, B sees A.
- A wall blocks tiles behind it; the wall itself is visible.
- No leaking diagonally through corner joins.
- Radius respected; origin always visible.
- Explored is monotonic — it only ever grows.

---

## 3. Movement (`engine/movement.ts`)

```ts
export function tryMove(run: RunState, dir: Direction): MoveResult;
```

Resolves one step: blocked by wall → no-op; onto floor → move, recompute FOV, mark explored; onto
stairs → `descend` available; onto a door → move (doors are cosmetic for now).

Returns a result describing what happened; **it does not mutate**. The reducer applies it.

### Tests
- Walking into a wall is a no-op and does not consume a turn.
- Map edges are hard bounds.
- Moving marks the new FOV as explored.
- Diagonal movement is rejected (four-way only — decided here so combat range maths stays simple).

---

## 4. Rendering (`render/`)

### `palette.ts`
Reads `--color-bg`, `--color-surface`, `--color-border`, `--color-fg`, `--color-muted`, and
`--color-accent-1..4` from `getComputedStyle(document.documentElement)` at mount. Falls back to
hardcoded values matching `globals.css` if a property is missing, so a canvas is never blank because
a variable was renamed.

### `sprites.ts`
Draws every tile and entity programmatically into an `OffscreenCanvas` once at boot — walls, floors,
doors, stairs, the player. No image files, no sprite sheet, no network request, no interaction with
the `next.config.ts` remote-image allowlist. Deterministic texture noise comes from a fixed seed, not
the run seed: tile art must not change between runs.

### `renderer.ts`
```ts
export function draw(ctx: CanvasRenderingContext2D, state: GameState, camera: Camera): void;
```
Reads state, draws pixels, decides nothing. Layers: floor → explored dim overlay → entities →
player → unexplored blackout. Camera centers on the player and clamps at map edges.

- Sized to `devicePixelRatio`; `imageSmoothingEnabled = false`.
- **Render on dirty flag, not a permanent rAF loop.** A single frame is scheduled when state
  changes. An idle game must use no CPU — this is a portfolio page that may sit open in a tab.
- Resize handled via `ResizeObserver`, torn down on unmount.

---

## 5. Hook and view

### `useDungeonRpg.ts`
`useReducer` over the pure reducer, plus keyboard binding (arrows + WASD), the dirty-flag render
scheduler, and load-on-mount. Every listener, observer, and rAF handle is cleaned up on unmount.

Keyboard handling attaches to the game container, not `window`, and calls `preventDefault` on arrow
keys **only when the container has focus** — otherwise the game hijacks page scrolling for someone
who is just reading the page.

### `DungeonRpgApp.tsx`
`"use client"`. Canvas plus minimal chrome: seed display, floor number, a "new run" button. Styled
with the existing Tailwind theme utilities (`bg-surface`, `border-border`, `text-accent-1`) to match
Minesweeper and the shell.

Register now: slug into `LIVE_INTERACTIVE_SLUGS`, component into `InteractiveAppHost`. **Keep
`published: false`** — registration makes it renderable, the publish flag keeps it invisible. Verify
the route still 404s for visitors.

### Tests (`// @vitest-environment jsdom`)
- Mounts without throwing; canvas acquires a 2D context.
- Arrow key dispatches a move; the player position changes.
- Keys are ignored when the container lacks focus.
- Unmount removes listeners and cancels pending frames (no "state update after unmount" warning).

---

## Exit criteria

- [ ] 1000-seed reachability property test passes
- [ ] A floor can be walked end to end; fog of war reveals and persists as explored
- [ ] Reload regenerates the identical map from the seed
- [ ] Idle game schedules no frames (verify in a profiler, not by eye)
- [ ] Registered in both registry files, still `published: false`, route still 404s for visitors
- [ ] Lint, types, tests, build all clean
