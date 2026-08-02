# Phase 2 — Turn-based combat

**Ships:** encounters, the battle screen, enemies that can kill you.
**Gate:** combat suite green; a run can actually be lost.

Menu combat resolved by pure functions. The battle screen is a rendering of a state machine that
would work identically printed to a terminal — which is exactly why it's testable despite the canvas.

---

## 1. Encounters (`engine/encounter.ts`)

Enemies are placed at generation time from `rngFor(seed, "encounter", floor)` — visible on the map,
not random-stepped ambushes. Visible enemies mean the player makes decisions with information, and
it avoids the "walked three tiles and got jumped" feel that ages badly.

Walking into an enemy tile transitions `mode: "explore"` → `mode: "battle"`. The map state freezes
untouched underneath; on battle end it resumes exactly as it was.

Enemy count and level scale with floor depth from `content/floors.ts`.

---

## 2. Battle state

```ts
export type BattleState = {
  enemy: Combatant;
  turn: "player" | "enemy";
  cursor: BattleChoice;          // which menu item is highlighted
  log: string[];                 // bounded by MAX_LOG_LINES
  pending: BattleEvent[];        // resolved outcomes awaiting animation
  outcome: "ongoing" | "won" | "lost" | "fled";
};

export type BattleChoice = "exploit" | "enumerate" | "isolate" | "flee";
```

**`pending` is the key design decision.** The reducer resolves a turn *completely and instantly* —
damage applied, death determined, log written. The animation layer then drains `pending` to show
what already happened. Consequences:

- Tests assert final state with no timers and no fake clocks.
- Animation can be skipped, sped up, or disabled (`prefers-reduced-motion`) without touching
  outcomes.
- A mid-animation reload can't desync, because state was never mid-anything.

Phase 5 adds `skill` to `BattleChoice`; the union is written to accept it now.

---

## 3. Combat maths (`engine/combat.ts`)

All pure, all seeded from the persisted combat cursor.

```ts
export function resolvePlayerTurn(battle, choice, rng): BattleResolution;
export function resolveEnemyTurn(battle, rng): BattleResolution;
```

| Choice | Effect |
|---|---|
| **EXPLOIT** | `damage = max(1, atk - def) * variance(0.85–1.15)`; crit chance on top |
| **ENUMERATE** | Reveals enemy stats and weaknesses; buffs next EXPLOIT. Costs a turn — the risk/reward pivot of the whole system |
| **ISOLATE** | Halves incoming damage this turn; small Integrity regen |
| **FLEE** | Success odds scale on relative level; failure costs the turn and the enemy acts |

Design notes worth keeping honest:

- **`max(1, …)`** — an attack must never deal zero. Zero-damage stalemates against a high-defense
  enemy are unwinnable and read as a bug.
- **Flee must be genuinely viable**, not a trap option. A player cornered at low Integrity with no
  escape and no items has a soft-locked run.
- Enemy AI stays simple and *legible*: attack, or defend when badly hurt, weighted by an
  `aggression` stat. A player should be able to form a correct mental model within three battles.

### Tests
- Damage formula exact at fixed seeds, including the `max(1, …)` floor against absurd defense.
- Crits fire at the configured rate over a large sample.
- ENUMERATE buffs exactly one subsequent EXPLOIT, then expires.
- ISOLATE reduces exactly one incoming attack.
- Flee odds match spec; failed flee still yields the turn to the enemy.
- Integrity ≤ 0 → `outcome: "lost"`; enemy Integrity ≤ 0 → `"won"`.
- Neither combatant's Integrity can exceed max or drop below zero.
- **No infinite battles:** simulate 10k seeded battles across level pairs; assert every one
  terminates within a turn cap.

---

## 4. Enemy content (`content/enemies.ts`)

Data only. Five to eight enemies for phase 2, keyed by the floors they appear on.

```ts
{ id: "cryptominer", name: "Cryptominer", integrity: 18, atk: 5, def: 2,
  aggression: 0.7, xp: 12, floors: [1, 2],
  flavor: { encounter: "…", defeat: "…" } }
```

Fictional flavor only — names and copy are set dressing on ordinary RPG maths. No real technique, no
real tool behavior, nothing that reads as functional offensive code. This is a security portfolio;
the line matters.

---

## 5. Rendering the battle

`renderer.ts` gains a battle branch: enemy sprite (procedurally drawn, same as phase 1), Integrity
bars, the four-option menu, and the scrolling log.

The **log is DOM text, not canvas** — deliberately. It's the single most information-dense element,
it needs to be selectable and scrollable, and putting it in the DOM gives `aria-live` announcements
free ahead of phase 7's a11y work.

Animation drains `pending`: damage numbers float, hit flash, a short shake on crits. All optional,
all skippable, none load-bearing.

---

## 6. Death

Integrity ≤ 0 → `mode: "dead"`. Show the run summary (floor reached, enemies defeated, seed).
Clear the run save. **Do not touch the profile** — phase 6 owns it, and the phase 0 test that guards
this separation should already be green.

---

## Exit criteria

- [ ] Battles start, resolve, and end in win / loss / flee
- [ ] 10k-battle termination sweep passes
- [ ] Death clears the run save and leaves the profile untouched
- [ ] Combat RNG cursor persists — reload mid-run continues the same sequence
- [ ] Battle log is DOM text and scrolls
- [ ] Lint, types, tests, build all clean
