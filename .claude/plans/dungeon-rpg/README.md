# Plan: Dungeon RPG

**Status:** Phases 0–2 shipped. Phase 3 (the publish gate) is next.
**Date:** 2026-08-02 (planned), phases 0–2 landed 2026-08-02
**Target stack:** Next.js 16.2 · React 19 · Tailwind v4 · Vitest 3 · Vercel (static route)
**Architecture doc:** [`docs/dungeon-rpg.md`](../../../docs/dungeon-rpg.md) — read it first
**Slug:** `dungeon-rpg` (already exists in `src/data/interactiveProjects.ts` as
`published: false`, `status: "coming-soon"`)

> ⚠️ Per `CLAUDE.md` / `AGENTS.md`: this is **not** the Next.js you know. This feature is almost
> entirely framework-agnostic client code, so the exposure is small — but before touching the route
> or anything under `src/app/`, read the relevant guide in `node_modules/next/dist/docs/`.

> ℹ️ `CLAUDE.md` claimed "There is no test runner configured in this project." That was stale;
> phase 0 corrected it. `vitest` 3.2 is wired (`npm run test`, `vitest.config.ts`,
> `environment: "node"`, `src/**/*.test.ts{,x}`), with a `// @vitest-environment jsdom` pragma
> per-file for view suites.

---

## Where phases 0–2 landed

The whole loop exists behind a shut publish gate: title → walk a seeded floor with fog of war →
walk into a visible enemy → turn-based battle → win, lose, or disengage → descend → victory or
death. 200 tests across the repo, 158 of them this feature's.

Deviations from the plan as written, all recorded in `docs/dungeon-rpg.md`:

| Change | Why |
|---|---|
| `GameState` carries `profile` in every mode | Death and victory need to hand it back to the title screen |
| `GameAction` gained `boot` and `run:continue` carries a loaded `RunState` | Storage is I/O; the hook reads it and the reducer stays pure. Both refused outside `mode: "title"` |
| `RunSave` gained `xp`, `defeated`, `kills` | Placements are re-derived per floor, so without `defeated` every enemy you killed respawns on reload |
| Battle **menu** is DOM buttons, not canvas | Focus, `aria-pressed`, hover, and pointer input for free instead of reimplemented against a bitmap. The canvas still draws the scene |
| ISOLATE has a per-battle patch budget | Unlimited healing out-paces a weak enemy's halved chip damage and the battle never terminates. Mitigation stays unlimited; only the healing is capped |
| FOV is *symmetric* shadowcasting | Plain recursive shadowcasting is asymmetric — it lets an enemy see you from a tile you can't see. The exact diagonal ray through a corner join stays lit (geometrically correct); nothing beside it does |
| `mapgen` validates full connectivity, not just "every room" | One assertion rules out both a sealed staircase and an orphan corridor stub |
| Extra engine modules: `grid.ts`, `log.ts`, `run.ts`, `encounter.ts`, `save/bitset.ts` | Shared helpers that the original tree folded into other files |

**Known for phase 3:** a player who walks the shortest path to the stairs can currently finish a
run with zero kills — enemies are avoidable and there is no reason yet to engage. Loot, bounty
pressure, or guarded stairs is the fix, and it belongs with the vertical slice.

---

## Decisions locked before planning

These were chosen up front and are not open questions. Later phases assume them.

| Axis | Decision | Consequence |
|---|---|---|
| Combat | **Turn-based menu battles** | Pure resolution functions; no real-time loop; exactly testable |
| Dungeon | **Procedural, seeded** | Small content footprint, infinite replay, reproducible tests |
| Rendering | **Canvas 2D**, procedurally generated sprites | Costs a11y + pixel testability → bought back by the engine/render split and a DOM mirror |
| Persistence | **Run save + permanent profile** | Two `localStorage` keys, versioned independently |
| Theme | **Cyber/infosec** — fictional flavor only | Doubles as a portfolio signal; no real technique or payload, ever |
| Mobile | **Desktop-only**, existing modal | `category: "game"` already triggers it; no touch work |

---

## Roadmap

| Phase | Title | Ships | Gate |
|---|---|---|---|
| [0](./phase-0-foundations.md) ✅ | Foundations | Types, constants, seeded RNG, save schema — no gameplay | RNG + storage suites green |
| [1](./phase-1-map-and-movement.md) ✅ | Map & movement | Generation, FOV, canvas renderer, walking a floor | Reachability property test over 1000 seeds |
| [2](./phase-2-combat.md) ✅ | Combat | Turn-based battles, enemies, death | Combat suite green; a run can be lost |
| [3](./phase-3-vertical-slice.md) | **Vertical slice ✦** | Full loop, autosave, 5 floors, one boss → **publish** | Playable start→win/lose; `published: true` |
| [4](./phase-4-items-and-economy.md) | Items & economy | Inventory, loot, shops, Bounty | Loot tables deterministic per seed |
| [5](./phase-5-skills-and-bosses.md) | Skills & bosses | Cycles, status effects, skills, per-segment bosses | Status stacking/expiry suite green |
| [6](./phase-6-meta-progression.md) | Meta-progression | Profile, unlocks, achievements, run history | Profile survives death and run reset |
| [7](./phase-7-polish.md) | Polish | Particles, audio, a11y mirror, reduced-motion, perf | a11y pass; no idle CPU; Lighthouse clean |

**Phase 3 is the milestone that matters.** Everything before it is unshippable scaffolding;
everything after it is depth on a game that already works. If the project stalls, stalling *after*
phase 3 leaves a finished thing on the site instead of a dead branch.

---

## Sequencing rules

1. **The publish gate stays shut until phase 3 passes.** `published: false` means the tile is hidden
   from the grid and sitemap and `/projects/interactive/dungeon-rpg` 404s. Every phase 0–2 is
   mergeable to `preview/projects` without a visitor ever seeing an unfinished game.
2. **Engine before renderer, renderer before polish.** A phase never depends on visual work from a
   later phase.
3. **Tests land in the same phase as the code they cover.** Not a cleanup phase later.
4. **Each phase is independently revertable.** No phase leaves the build red or the route broken.
5. **Content is data.** If shipping a new enemy requires an engine change, the content schema is
   wrong — fix the schema, don't special-case the enemy.

---

## Definition of done (every phase)

```bash
rtk npm run lint      # clean
rtk npx tsc --noEmit  # clean
rtk npm run test      # green
rtk npm run build     # succeeds
```

Plus: no `fetch`/`eval`/server route added, no new dependency without a note in the phase doc, and
`docs/dungeon-rpg.md` updated if the phase changed the architecture.

---

## Risk register

| Risk | Phase | Mitigation |
|---|---|---|
| Unreachable stairs on rare seeds — a silent run-ender | 1 | Property test over a large seed sweep; generator retries on failed reachability |
| RNG desync makes a reloaded save diverge | 0 | Named sub-streams derived from `(seed, purpose, index)`; only combat persists a cursor |
| Canvas work is invisible to tests, so bugs hide in the renderer | 1 | Renderer holds zero logic; anything worth testing lives in the engine |
| Scope creep turns this into an unshippable forever-project | 3 | Hard publish gate at phase 3; phases 4–7 are optional depth |
| Combat balance is unfun and only discovered late | 5 | Seeded simulation harness — run 10k battles headlessly and read win rates |
| `localStorage` unavailable or corrupt breaks the page | 0 | Every read wrapped; degrade to fresh run; never throw on boot |
| Theme reads as real offensive tooling | all | Flavor-only rule stated in the architecture doc and enforced in review |

---

## Out of scope

Multiplayer or any server state · leaderboards requiring a backend · touch/mobile controls ·
downloadable sprite assets · save export/import · procedural audio beyond simple synthesized
blips · anything that performs a real network request.
