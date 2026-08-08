# Phase 5 — Skills, status effects, and bosses

**Ships:** Cycles (MP), a skill system, status effects, a boss per segment.
**Gate:** status stacking and expiry suite green; simulated win rates land in a sane band.

Combat has been "pick EXPLOIT most turns" since phase 2. This phase makes turns interesting and
gives each segment a memorable ending.

---

## 1. Cycles (MP)

`Combatant` gains `cycles` / `maxCycles`. Skills cost Cycles; a small amount regenerates per floor,
and consumable items restore more. Scarcity is the point — Cycles are the resource that makes skill
use a *choice* rather than a rotation.

---

## 2. Skills (`content/skills.ts`, `engine/skills.ts`)

Data-driven, exactly like items — `effect` is a serializable union, never a closure.

```ts
export type Skill = {
  id: string;
  name: string;
  cost: number;
  target: "enemy" | "self";
  effect: SkillEffect;
  unlockLevel: number;
  flavor: string;
};

export type SkillEffect =
  | { type: "damage"; power: number; element?: Element }
  | { type: "inflict"; status: StatusId; turns: number; chance: number }
  | { type: "heal"; amount: number }
  | { type: "cleanse" }
  | { type: "shield"; amount: number; turns: number };
```

Six to eight skills unlocking by level. `BattleChoice` gains `"skill"`, opening a submenu — the
union was written to accept this in phase 2.

**Elements** (optional, only if it earns its place): enemies carry a weakness; ENUMERATE reveals it;
hitting it multiplies damage. This is what finally makes ENUMERATE compelling rather than a
tax — worth doing for that reason alone.

---

## 3. Status effects (`engine/status.ts`)

The subsystem most likely to produce subtle bugs, so it gets the strictest rules.

| Status | Effect |
|---|---|
| `corrupted` | Damage over time each turn |
| `throttled` | Reduced attack |
| `exposed` | Increased damage taken |
| `shielded` | Flat damage absorption |
| `patched` | Regen over time |

Rules, stated because ambiguity here is how you get infinite loops:

- **Duration is in turns and always decrements**, including the turn it was applied. Nothing can be
  permanent.
- **Reapplying refreshes duration; it does not stack intensity.** One decision, applied everywhere.
- **A hard cap on simultaneous statuses** per combatant.
- **Expiry is checked at a single defined point** in the turn cycle, not scattered across handlers.
- Death from DoT resolves identically to death from a hit — same code path, no special case.

### Tests
- Applies, ticks, expires on schedule; never outlives its duration.
- Reapplication refreshes rather than stacks.
- Multiple statuses coexist correctly and independently.
- DoT can kill; the resulting outcome is `"lost"` / `"won"` as normal.
- Cleanse removes all; cure removes one.
- Statuses round-trip through save/load with correct remaining turns.
- **No infinite loop:** a combatant under every status simultaneously still terminates the battle
  within the turn cap.

---

## 4. Bosses

One per segment (five total), replacing phase 3's single boss.

- Authored stats and an authored skill rotation — not just a scaled-up regular enemy.
- Each has one **telegraphed** mechanic: a wind-up turn announced in the log before a heavy hit, so
  ISOLATE and defensive items have a purpose. Telegraphing is what turns a damage race into a
  puzzle.
- Guaranteed authored drop.
- A distinct procedurally-drawn sprite and an intro flourish.

Boss rooms are placed by `mapgen` at the floor's furthest reachable room — the reachability property
test from phase 1 already guarantees the player can get there.

---

## 5. Balance harness (`engine/simulate.ts`)

Not shipped to the browser — a test-only utility, and the highest-value thing in this phase.

```ts
export function simulateBattle(player: Combatant, enemy: Combatant, seed: string): SimResult;
```

Runs thousands of headless battles across level and floor pairings and reports win rate, average
turns, and how often the player is left below 25% Integrity.

Assert on **bands, not exact numbers** — "floor 1 win rate is between 85% and 98%", "no matchup is
under 20% or over 99%", "median battle length is 3–8 turns". Exact assertions break on every tuning
change and get deleted; band assertions survive and keep catching real regressions.

This is only possible because combat is pure. It's the concrete payoff of the engine/render split.

---

## Exit criteria

- [ ] Skills usable, gated by Cycles and level
- [ ] Status effects apply, tick, expire, and persist correctly
- [ ] Five bosses with telegraphed mechanics
- [ ] Simulation harness reports win rates inside the target bands
- [ ] No battle can loop forever under any status combination
- [ ] Lint, types, tests, build all clean
