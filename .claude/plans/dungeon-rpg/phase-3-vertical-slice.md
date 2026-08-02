# Phase 3 — Vertical slice ✦ (the publish gate)

**Ships:** a complete, winnable, losable game. Five floors, one boss, autosave, title screen.
**Gate:** `published: true`. Visitors can play it.

**This is the phase that matters.** Phases 0–2 produce parts; this one produces a *game*. Phases 4–7
are depth on something that already works.

The bar is not "impressive". The bar is **finished**: a visitor starts, plays, wins or dies, and
never sees a broken state. A small complete game beats a large unfinished one on a portfolio, every
time.

---

## 1. Close the loop

Everything needed for start → finish, and nothing else.

- **Title screen** — New Run · Continue (only when a valid run save exists) · seed entry
  (optional field; blank generates a random pronounceable seed like `a7f2-kestrel`).
- **Descend** — stairs advance the floor, regenerate from `rngFor(seed, "mapgen", floor)`, carry
  player stats forward, autosave.
- **Boss on floor 5** — one authored enemy with inflated stats. Mechanically an ordinary enemy; the
  presentation makes it feel otherwise.
- **Victory** — beating the boss → `mode: "victory"`, run summary, clear run save.
- **Defeat** — already shipped in phase 2; confirm the loop returns cleanly to the title.
- **Levelling** — a minimal XP curve so floor 5 is survivable. Kills grant XP; a level raises max
  Integrity, attack, and defense. Real progression is phase 5's problem; this just has to not be
  brutal.

---

## 2. Autosave

Save on: floor change, battle end, level up, and unmount. **Not on every step** — that thrashes
`localStorage` and can hitch on slower machines.

Continue restores: seed, floor, position, stats, explored bitset, RNG cursor. The map itself is
regenerated, never stored.

### Tests
- Save → reload → identical run state.
- Continue mid-floor restores position and explored tiles exactly.
- A run saved during a battle restores to the pre-battle explore state — battles are not resumable,
  and pretending otherwise is a whole class of bugs for no player benefit. Fleeing the tab is not a
  free escape: the encounter is still standing there.
- Death and victory both clear the run save.

---

## 3. Onboarding

A visitor with no context must understand this in about ten seconds.

- A short "how to play" panel below the canvas: arrows/WASD to move, walk into an enemy to engage,
  find the stairs, reach the Domain Core.
- First-battle hint line explaining ENUMERATE — it's the one non-obvious verb.
- Legend for tile glyphs and colors.

Copy lives in `content/flavor.ts`, not JSX.

---

## 4. Publish

Only after every box below is ticked:

1. `src/data/interactiveProjects.ts` — `published: true`, `status: "live"`, final description.
2. Confirm `dungeon-rpg` is in `LIVE_INTERACTIVE_SLUGS` (phase 1) and mapped in
   `InteractiveAppHost.tsx`.
3. Verify the tile appears on `/projects`, the route renders, and the slug is in `sitemap.ts`.
4. Confirm `InteractiveMobileWarningModal` shows on mobile — automatic via `category: "game"`, but
   verify rather than assume.
5. Check the OG image path `/projects/interactive/dungeon-rpg.svg` resolves (the asset already
   exists in `public/`).

---

## 5. Pre-publish QA

Manual, on the built site, not the dev server:

- [ ] Full run start → floor 5 → boss → victory
- [ ] Full run ending in death
- [ ] Close the tab mid-run, reopen, Continue — lands exactly where it left off
- [ ] Same seed twice → identical dungeon
- [ ] Hand-corrupt `dungeon-rpg:run:v1` in devtools → game boots to title, does not white-screen
- [ ] Clear `localStorage` entirely → boots clean
- [ ] Private/incognito window (storage may throw) → playable, no crash
- [ ] Rapid input spam during animations → no desync, no stuck state
- [ ] Idle on the title screen → no CPU burn
- [ ] Mobile viewport → warning modal, page still renders
- [ ] Tab away mid-battle and back → no runaway timers
- [ ] `npm run build` output shows the route as static

---

## Exit criteria

- [ ] The game is winnable and losable, end to end
- [ ] Every QA box above ticked on a production build
- [ ] `published: true` and live at `/projects/interactive/dungeon-rpg`
- [ ] `docs/dungeon-rpg.md` updated to describe what actually shipped
- [ ] Lint, types, tests, build all clean

**If the project stops here, it stops having shipped something complete.** That's the point of the
gate.
