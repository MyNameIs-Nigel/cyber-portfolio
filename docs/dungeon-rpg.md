# Dungeon RPG — architecture

> **Status: phases 0–2 shipped.** Foundations, map generation, movement, rendering, and turn-based
> combat are implemented and tested; a run can be started, walked, fought, won, and lost. Items,
> shops, skills, meta-progression, and polish (phases 4–7) are still design. The build plan lives in
> [`.claude/plans/dungeon-rpg/`](../.claude/plans/dungeon-rpg/README.md).
>
> **The publish gate is still shut in production.** `dungeon-rpg` is `published: false`, so on
> production it is absent from the projects grid, the sitemap, and `generateStaticParams()`, and
> `/projects/interactive/dungeon-rpg` 404s. Preview deployments run with `ENVIRONMENT=DEV` and show
> unpublished projects, so the page *is* reachable there (as a "coming soon" placeholder until
> `status` flips to `"live"`). `publish-gate.test.ts` guards both. Phase 3 opens the gate.
>
> When code and this doc disagree, **the code wins and this doc gets fixed.**

A seeded, turn-based dungeon crawler that runs entirely in the browser, renders to a `<canvas>`, and
persists both an in-progress run and permanent meta-progression to `localStorage`. Themed as an
incident-response descent through a compromised network.

**Nothing executes on a server.** No `fetch`, no `eval`, no server route, no telemetry. Like the
[fake shell](./fake-shell.md), it is a pure front-end feature — the only state that survives a
refresh is the visitor's own `localStorage`.

---

## The one rule that shapes everything

> **The engine never imports React and never touches the DOM, `window`, or a canvas.**

Every rule of the game — map generation, movement, line of sight, combat maths, loot, levelling —
lives in `engine/` as pure functions over plain data. The canvas layer is a *projector*: it reads a
`GameState` and draws pixels. It never decides anything.

This is not architectural purity for its own sake. Canvas rendering was chosen deliberately (smooth
camera, fog-of-war, particles), and it costs us the two things a DOM-rendered game gets free:

| Canvas costs us | How the split buys it back |
|---|---|
| **Testability** — tests can't assert on pixels | ~90% of the game is pure functions tested in `environment: "node"` with zero rendering. Seeded RNG makes every assertion exact, not statistical. |
| **Accessibility** — no a11y tree, invisible to screen readers | A parallel DOM mirror (`a11y/describe.ts`) renders the same `GameState` as text. See [Accessibility](#accessibility). |

If a rule ever needs `document` to decide an outcome, that rule is in the wrong file.

---

## Where it lives

Files marked ✦ are not written yet — they arrive with the phase that needs them.

```
src/features/interactive/dungeon-rpg/
  dungeon-rpg.types.ts      GameState, FloorMap, Combatant, RunSave, Profile …
  dungeon-rpg.constants.ts  tile size, floor count, caps, storage keys, schema versions
  engine/                   ── pure, no React, no DOM ──
    rng.ts                  seeded PRNG + named sub-streams
    grid.ts                 tile lookups, BFS reachability, distance fields
    mapgen.ts               (seed, floor) → FloorMap
    fov.ts                  symmetric shadowcasting / fog-of-war
    movement.ts             step resolution, collision, sight refresh
    encounter.ts            enemy placement + level scaling
    combat.ts               turn resolution, damage, guards
    progression.ts          XP, levels, the starting player
    log.ts                  bounded log append
    run.ts                  run lifecycle + RunState ⇄ RunSave
    reducer.ts              (GameState, GameAction) → GameState — the single entry point
    loot.ts ✦               drop tables, weighted selection
  content/                  ── data, not logic ──
    enemies.ts  floors.ts  flavor.ts       items.ts ✦  skills.ts ✦
  render/                   ── canvas only, no game logic ──
    palette.ts              reads CSS custom properties from globals.css
    sprites.ts              procedural sprite generation → OffscreenCanvas
    renderer.ts             draw(ctx, GameState, camera, palette, sprites)
    particles.ts ✦          transient visual effects (never gameplay state)
  save/
    bitset.ts               explored-map bitset + hand-rolled base64
    schema.ts               versioned save shapes + type guards
    storage.ts              load / save / migrate, quota-safe, corruption-tolerant
  a11y/
    describe.ts             GameState → human-readable text
  useDungeonRpg.ts          React hook: reducer + persistence + keyboard input
  DungeonRpgApp.tsx         "use client" view — canvas, HUD, battle menu, log
```

Registered the same way every interactive app is (see
[`src/features/interactive/README.md`](../src/features/interactive/README.md)): a slug in
`registry-meta.ts`, a component in `InteractiveAppHost.tsx`, an entry in
`src/data/interactiveProjects.ts`.

---

## Theme

The dungeon is a compromised corporate network; the player is the incident responder walking it
floor by floor. Flavor only — **there is no real tooling, no real technique, and no real payload
anywhere in this feature.** Enemy names and ability verbs are set dressing on ordinary RPG maths, and
they must stay that way. A security portfolio should not ship anything that reads as functional
offensive code, even in a toy.

| RPG concept | Themed as |
|---|---|
| HP | **Integrity** |
| MP | **Cycles** |
| Floor | **Network segment** — Perimeter → DMZ → Workstation VLAN → Server VLAN → Domain Core |
| Attack | **EXPLOIT** |
| Scan / reveal weakness | **ENUMERATE** |
| Defend | **ISOLATE** |
| Heal | **PATCH** |
| Enemy | Cryptominer, Rootkit, Phish-Bot, Default-Creds Wraith, Ransomware Daemon |
| Loot | Tooling — `nmap v2`, `burp-lite`, a leaked credential |
| Currency | **Bounty** |
| Boss | The segment's domain controller |

All copy lives in `content/flavor.ts` so tone can be revised without touching a rule.

---

## Determinism: seeds and sub-streams

A run is defined by a **seed string**. Same seed → same dungeon, forever. This gives us reproducible
tests, shareable runs, and a daily-challenge hook later.

The naive approach — one global PRNG — breaks the moment anything non-gameplay consumes a number
(a particle, a flavor-text pick, a re-render). The stream desyncs and a reloaded save diverges from
the run the player was on.

So randomness is **split into named, independently derived streams**:

```ts
// Derived deterministically from the run seed + a purpose label + an index.
// Pure: no hidden cursor, no shared mutable state.
rngFor(seed, "mapgen", floorNumber)   // regenerating floor 3 always yields floor 3
rngFor(seed, "loot", roomId)          // this chest holds the same thing on reload
rngFor(seed, "flavor", encounterId)   // cosmetic — safe to consume freely
```

Only **combat** uses a stream whose position must persist, because its consumption depends on
player choices and can't be re-derived from position alone. `RunSave.rngCursor` stores exactly that
one cursor. Everything else is recomputed from `(seed, purpose, index)` on load.

**Rule:** rendering, particles, and flavor text may only draw from cosmetic streams. If a visual
effect can change a damage number, it is gameplay and belongs in `engine/`.

---

## State and the reducer

One pure reducer is the only way game state changes:

```ts
function reduce(state: GameState, action: GameAction): GameState;
```

`GameAction` is a discriminated union — `{ type: "move", dir }`, `{ type: "battle:choose", … }`,
`{ type: "item:use", id }`, `{ type: "descend" }` — and the reducer is exhaustively switched so
TypeScript flags any unhandled case.

`GameState` is a discriminated union on `mode`, which keeps illegal states unrepresentable: you
cannot hold a battle cursor while exploring, because `mode: "explore"` has no such field. Every
variant carries `profile`, so death and victory can hand it back to the title screen without the
view holding a second copy of it.

**Storage is I/O, so it stays out of the reducer.** The hook reads `localStorage` and hands the
result in: `{ type: "boot", profile, hasRunSave }` on mount, and `{ type: "run:continue", run }`
with an already-validated `RunState` when the player resumes. The reducer still owns every
transition; it just doesn't own the file handle. Both actions are refused outside `mode: "title"`,
so neither can discard a run in progress.

Illegal actions return the **identical state object**, not a copy — which doubles as the signal for
React to skip a re-render. Walking into a wall costs nothing at all.

```
mode: "title"    →  seed entry / continue / new run
      "explore"  →  walking a floor; camera follows player
      "battle"   →  menu combat; the map is frozen behind the battle UI
      "shop"     →  spend Bounty
      "dead"     →  run over; profile updated, run save cleared
      "victory"  →  cleared the Domain Core
```

Transitions are returned by the reducer, never triggered by the view.

---

## Rendering

`renderer.ts` exports one function: `draw(ctx, state, camera)`. It reads state; it never writes it.

- **Sprites are generated, never downloaded.** `sprites.ts` draws each tile and entity
  programmatically into an `OffscreenCanvas` once at boot. There are no image files, no sprite
  sheets, and no external requests — which also sidesteps the `next.config.ts` remote-image
  allowlist entirely.
- **Colors come from the site theme.** `palette.ts` reads the `--color-accent-1..4`, `--color-bg`,
  `--color-surface`, and `--color-border` custom properties from `globals.css` at mount, so the game
  can never drift from the portfolio's palette.
- **Crisp pixels.** Canvas is sized to `devicePixelRatio` with `imageSmoothingEnabled = false`.
- **Render on change, not on a clock.** No permanent `requestAnimationFrame` loop. A dirty flag
  schedules a single frame when state changes; a rAF loop runs *only* while an animation is in
  flight and stops when it settles. A game sitting on a menu should burn no CPU.
- **Animations are cosmetic.** The reducer resolves a turn instantly and completely. Animation
  replays what already happened — it can be skipped, sped up, or disabled without changing outcomes.

---

## Persistence

Two independent keys, so losing one never corrupts the other:

| Key | Lifetime | Holds |
|---|---|---|
| `dungeon-rpg:run:v1` | current run | `seed`, `floor`, player stats, `xp`, inventory, position, explored tiles, `defeated`, `kills`, `bounty`, `rngCursor` |
| `dungeon-rpg:profile:v1` | forever | deepest floor, total runs, deaths, unlocks, achievements, best bounty |

`defeated` is the list of `EnemyPlacement` ids already beaten. Placements are re-derived from
`rngFor(seed, "encounter", floor)` on load, so without it every enemy you killed would be standing
there again after a refresh.

- **Autosave** on floor change, battle end, and item pickup — not every step (that thrashes
  `localStorage` and can hitch on slower machines) — plus once on unmount, so leaving the page
  resumes where you actually were rather than at the last checkpoint.
- **Explored tiles are a bitset**, not an array of coordinates. Floors are small, but this keeps the
  save well clear of the ~5 MB budget with room to spare.
- **Corruption is expected, not exceptional.** Every read is wrapped: parse failure, schema
  mismatch, quota error, or `localStorage` being unavailable at all (private mode, blocked cookies)
  degrades to a fresh run. **The game must never throw on boot** — a broken save on a portfolio site
  is a broken page.
- **Versioning** follows the shell's `FS_SCHEMA_VERSION` convention. A bumped version either
  migrates or resets, and resetting a *run* must never reset a *profile*.

---

## Accessibility

Canvas is invisible to assistive technology, so a DOM layer carries the same information:

- **The battle menu is DOM, not canvas.** Four real `<button>`s, so focus, hover, `aria-pressed`,
  and pointer input all work without being reimplemented against a bitmap. The canvas draws the
  *scene* — enemy portrait, Integrity bars — and nothing the player has to operate. A menu is not a
  picture.
- **Visually-hidden mirror** — `a11y/describe.ts` turns `GameState` into text: current segment, room
  contents, exits, player stats, and in battle the full menu state. Currently it produces the
  one-line `canvasLabel` (segment, Integrity, coordinates, what you're standing on, hostiles in
  sight); the full mirror is phase 7.
- **`aria-live="polite"` combat log** — real DOM text (it's a scrolling log anyway), so turn results
  are announced.
- **`role="img"` + `aria-label`** on the canvas with a one-line summary of the current view.
- **Fully keyboard-driven.** Arrows/WASD to move, arrows + Enter in menus, Esc to back out. Every
  action reachable without a pointer, with a visible focus ring on the canvas wrapper.
- **`prefers-reduced-motion`** disables screen shake, particles, and camera easing; the game stays
  fully playable because animation was never load-bearing.

Desktop-only: `category: "game"` already triggers `InteractiveMobileWarningModal` in
`src/app/projects/interactive/[slug]/page.tsx`. No touch controls are planned.

---

## Testing

The engine/render split is what makes this tractable. Suites run under `environment: "node"`; only
view tests need `// @vitest-environment jsdom` (same pragma as `render-safety.test.tsx`).

| Area | What's asserted |
|---|---|
| `rng` | same seed → same sequence; sub-streams are independent and order-insensitive |
| `mapgen` | every walkable tile reachable from spawn; stairs always placed; no orphaned corridors; stable across 1000 seeds |
| `fov` | symmetry, wall occlusion, no light spilling sideways through corners |
| `combat` | damage formulas, guard expiry, death, flee odds — exact values via seeded RNG |
| `reducer` | illegal actions are no-ops; every transition; exhaustive `GameAction` coverage |
| `playthrough` | a whole run, driven only through `reduce`, reaches victory *and* reaches death |
| `storage` | round-trip, migration, corrupt JSON, quota exceeded, `localStorage` absent |
| `describe` | a11y text matches state |
| view | mounts, canvas acquires a 2D context, keyboard input dispatches the right action, idle schedules no frames |

**`mapgen`'s invariant is stronger than "every room is reachable":** every *walkable tile* must be
reachable from spawn. That single assertion rules out a sealed staircase and an orphaned corridor
stub at the same time, and generation retries until it holds.

**`combat`'s is that battles end.** A 10k-battle sweep across every enemy, ten player levels, and
five strategies — including pure turtling and pure fleeing — asserts each one resolves within the
turn cap with both combatants' Integrity in range. This is why ISOLATE's patch is budgeted
(`ISOLATE_PATCH_BUDGET`): unlimited healing out-paces a weak enemy's halved chip damage and the
battle simply never ends.

**`mapgen` is the one worth over-testing.** A generator that produces an unreachable staircase one
seed in a thousand is a run-ending bug a visitor will hit and never report. The property test
sweeps 1000 seeds × 5 floors and additionally asserts the hardcoded fallback layout is never
reached on a real seed — the fallback is an emergency floor, not a crutch.

---

## Safety budget

| Concern | Mitigation |
|---|---|
| Server exposure | No route, no `fetch`, no `eval`, no `dangerouslySetInnerHTML` |
| Save tampering | Saves are validated by type guards on read; a hostile save degrades to a fresh run, never a crash |
| Storage exhaustion | Bitset explored-map, capped inventory/log, quota errors caught |
| Runaway CPU | No idle rAF loop; generation is bounded and iteration-capped |
| Memory leak | Every rAF, timer, and listener torn down on unmount |
| Theme drift | Palette read from CSS custom properties, never hardcoded hex |
| "Real hacking" optics | Flavor is fictional; no functional technique, tool behavior, or payload |

---

## Adding things later

- **New enemy / item / skill:** add to `content/*.ts`. No engine change should be required — if one
  is, the content schema is too narrow and that's the actual bug to fix. Enemy sprites are derived
  from a hash of the enemy's id, so a new one gets its own stable silhouette for free.
- **New floor theme:** `content/floors.ts` + a palette entry. Generation params are data.
- **New mechanic:** engine module + tests first, reducer wiring second, rendering last.
- **Never** add a server route, a network call, or user-controlled navigation to this feature.
