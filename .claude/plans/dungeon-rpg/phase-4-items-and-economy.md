# Phase 4 — Items, inventory, and economy

**Ships:** loot, a usable inventory, chests, shops, Bounty.
**Gate:** loot is deterministic per seed; inventory has no dupe or overflow bugs.

The game works now. This phase gives the player decisions *between* battles — which is where a
crawler stops being a stat check and starts being a game.

---

## 1. Item model (`content/items.ts`, `engine/items.ts`)

```ts
export type Item = {
  id: string;
  name: string;
  kind: "consumable" | "passive" | "key";
  tier: 1 | 2 | 3;
  value: number;              // Bounty cost; sell price derives from this
  effect: ItemEffect;         // data, not a function — see below
  flavor: string;
};

export type ItemEffect =
  | { type: "heal"; amount: number }
  | { type: "buff"; stat: "atk" | "def"; amount: number; turns: number }
  | { type: "cure" }
  | { type: "reveal-floor" }
  | { type: "escape" };
```

**`effect` is data, never a function.** A closure can't be serialized, can't round-trip through
`localStorage`, and can't be asserted on in a test. `engine/items.ts` interprets the union. This is
the constraint that keeps items addable without engine changes.

Starting set (~12 items): Integrity patch (small/large), Cycle restore, attack and defense buffs, a
status cure, a floor-reveal, and an escape token.

---

## 2. Inventory (`engine/inventory.ts`)

Stack-based, capped at `MAX_INVENTORY`.

```ts
export function addItem(inv: ItemStack[], itemId: string, qty: number): AddResult;
export function useItem(run: RunState, itemId: string): UseResult;
```

The boring edge cases are the ones that actually bite:

- Adding to a full inventory → refused with a message, **item is not silently destroyed**.
- Stacking respects a per-stack cap; overflow creates a new stack, or is refused if that would
  exceed the slot cap.
- Using the last of a stack removes the stack entirely — no zero-quantity ghosts.
- Using an item in battle **consumes the turn**. That's the cost that makes items a decision.
- Using a heal at full Integrity is refused rather than wasted.

### Tests
- Add/remove/stack/split round-trips.
- Full-inventory add is refused and lossless.
- Last-of-stack removal leaves no empty entry.
- Every `ItemEffect` variant applies correctly (exhaustive over the union — a new variant without a
  test should fail to compile).
- Heal cannot exceed max Integrity.
- Inventory survives save/load with quantities intact.

---

## 3. Loot (`engine/loot.ts`)

Chests placed at generation; contents from `rngFor(seed, "loot", roomId)`. Enemies drop from a
weighted table on defeat, seeded from the encounter index.

Deterministic by construction: opening the same chest on the same seed always yields the same item,
so reloading can't be used to reroll loot. Worth stating because "save-scumming" is otherwise an
emergent exploit that trivializes the economy.

Drop tables scale by floor tier. Boss drops are guaranteed and authored, not rolled.

### Tests
- Same seed + same room → same contents, across separate generations.
- Weighted tables respect weights over a large sample.
- Floor tier gates tier-3 items out of floor 1.
- An emptied chest stays empty across a reload (chest state is in the run save).

---

## 4. Bounty and shops

Bounty is earned from defeats and sold loot. Shop rooms appear from floor 2 on, offering a seeded
stock of 3–5 items.

- `mode: "shop"` with its own menu state — buy, sell, leave.
- Stock is fixed per floor per seed; leaving and re-entering does not reroll it.
- Sell price is a fraction of buy price (the standard sink; prevents buy/sell arbitrage).

### Tests
- Cannot buy without sufficient Bounty; Bounty never goes negative.
- Buying decrements stock; sold-out items can't be repurchased.
- Selling adds the expected Bounty and removes the item.
- Buy → sell → buy cannot net positive Bounty (the arbitrage check).
- Shop stock is stable across re-entry and reload.

---

## 5. UI

- Inventory panel — DOM, not canvas. It's a list with text, and the DOM is simply better at lists.
- Battle menu gains an ITEM submenu (the `BattleChoice` union already anticipates it).
- Shop screen, matching site chrome.
- Bounty in the HUD.

---

## Exit criteria

- [ ] Loot, chests, and shops all deterministic per seed
- [ ] Inventory edge cases tested and clean
- [ ] Items usable in and out of battle
- [ ] Economy has no arbitrage loop
- [ ] Save schema extended without breaking existing runs (bump `RUN_SCHEMA_VERSION` if the shape
      changed incompatibly — an orphaned old run is fine, a misread one is not)
- [ ] Lint, types, tests, build all clean
