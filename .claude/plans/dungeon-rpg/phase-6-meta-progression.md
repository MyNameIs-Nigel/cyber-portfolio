# Phase 6 — Meta-progression

**Ships:** the permanent profile, unlocks, achievements, run history.
**Gate:** the profile survives death, run reset, and schema changes.

Until now, death erases everything. This phase gives a second run a reason to exist — the payoff for
choosing "run save **and** profile" back at the start.

---

## 1. The profile

The `Profile` shape was defined in phase 0; this phase makes it live.

```ts
{
  v: 1,
  deepestFloor: number,
  totalRuns: number,
  deaths: number,
  victories: number,
  bestBounty: number,
  totalKills: number,
  unlocks: string[],
  achievements: string[],
  history: RunRecord[],   // capped — most recent N
}
```

Updated at the moment a run ends (death or victory), in one place. Scattering profile writes across
the codebase is how they drift out of sync.

**The one rule that must not break:** clearing a run never touches the profile. There is already a
test for this from phase 0 — confirm it is still green after this phase's changes, because this is
exactly when it would silently start failing.

---

## 2. Unlocks

Persistent rewards that change how the *next* run starts.

| Unlock | Trigger |
|---|---|
| Extra starting item | Reach floor 3 |
| Higher starting Integrity | 5 total runs |
| A second starting skill | First victory |
| Seed entry on the title screen | Reach floor 2 |
| Alternate loadout | Win without fleeing |

Unlock evaluation lives in `engine/progression.ts` as a pure function
`evaluateUnlocks(profile): string[]` — given a profile, which unlocks are earned? Pure means the set
is recomputed from the profile rather than accumulated by side effect, so a missed write can't
permanently lose an unlock.

Keep the power curve gentle. Unlocks that make later runs trivially easy remove the reason to play
them.

### Tests
- Each unlock fires on its exact trigger and not before.
- Unlocks are idempotent — re-evaluating never duplicates.
- A new run applies every earned unlock.
- Unlocks survive profile save/load.

---

## 3. Achievements

Cosmetic recognition, no mechanical effect: first blood, clear a floor without taking damage, defeat
every boss, win under a turn threshold, find every item tier, die on floor 1 (name it something kind).

Evaluated the same way — pure function over the profile plus the finished run record. Achievements
must never be awarded from inside combat: that path runs thousands of times in the simulation
harness.

---

## 4. Run history

The last N runs: seed, floor reached, outcome, bounty, duration. Capped, because an unbounded array
in `localStorage` is a slow leak that only shows up for the most engaged visitor.

Shown on the title screen. Displaying the seed lets someone replay a run that went well — a free
feature that falls out of determinism.

---

## 5. Title screen rework

Becomes the meta hub: stats summary, unlock list (locked ones shown with their trigger, which is
itself a goal list), achievements, recent runs, and a **reset profile** button behind a confirm.

The reset must be explicit and hard to hit by accident — it destroys everything the visitor has.

### Tests
- Death → profile updated, run cleared, profile intact.
- Victory → same, plus victory counters.
- Profile schema mismatch → resets the profile only, never the in-progress run.
- History respects its cap and evicts oldest first.
- Reset clears the profile and leaves storage in a valid, bootable state.

---

## Exit criteria

- [ ] Profile persists across deaths, victories, and browser restarts
- [ ] Unlocks apply to new runs and are idempotent
- [ ] Achievements award correctly and never from the simulation path
- [ ] Run history capped and displayed
- [ ] Reset works and is confirm-gated
- [ ] The phase 0 run/profile independence test is still green
- [ ] Lint, types, tests, build all clean
