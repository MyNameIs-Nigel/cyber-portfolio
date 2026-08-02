/**
 * Seeded randomness, split into named sub-streams.
 *
 * A single global stream can't satisfy both of the rules this game needs: a reloaded save
 * must reproduce the run exactly, *and* cosmetic randomness (flavor text, particles) must be
 * free to draw numbers without shifting gameplay. So randomness is derived from
 * `(seed, purpose, index)` instead — `rngFor(seed, "mapgen", 3)` is floor 3's layout forever,
 * no matter what else consumed numbers first.
 *
 * Combat is the one exception: its consumption depends on player choices and can't be
 * re-derived from an index, so `RunState.rngCursor` persists that stream's position.
 */

/** mulberry32's state increment. State after `n` draws is `seed + n * STEP` (mod 2^32). */
const MULBERRY_STEP = 0x6d2b79f5;

export type RngPurpose = "mapgen" | "loot" | "encounter" | "flavor" | "combat";

export type WeightedEntry<T> = { value: T; weight: number };

export type Rng = {
  /** Uniform in `[0, 1)`. */
  next(): number;
  /** Uniform integer in `[min, max]`, inclusive at both ends. */
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  weighted<T>(entries: readonly WeightedEntry<T>[]): T;
  /** Fisher–Yates into a new array; the input is untouched. */
  shuffle<T>(items: readonly T[]): T[];
  chance(probability: number): boolean;
  /** Draws taken so far, including any the stream was resumed at. */
  cursor(): number;
};

/**
 * mulberry32 — small, fast, statistically fine for a toy, and trivially reimplementable,
 * which is why it's inline rather than a dependency.
 *
 * `cursor` resumes a stream mid-sequence. Because mulberry32's state is a plain additive
 * counter, resuming is a jump rather than a replay: no loop, no drift.
 */
export function makeRng(seed: number, cursor = 0): Rng {
  let state = (seed + Math.imul(cursor, MULBERRY_STEP)) | 0;
  let draws = cursor;

  const next = (): number => {
    state = (state + MULBERRY_STEP) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    draws += 1;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number): number => {
    if (max <= min) return min;
    return min + Math.floor(next() * (max - min + 1));
  };

  return {
    next,
    int,
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) {
        throw new Error("rng.pick: empty array");
      }
      return items[int(0, items.length - 1)]!;
    },
    weighted<T>(entries: readonly WeightedEntry<T>[]): T {
      if (entries.length === 0) {
        throw new Error("rng.weighted: no entries");
      }
      let total = 0;
      for (const e of entries) {
        if (e.weight > 0) total += e.weight;
      }
      // Every weight is zero or negative: nothing is selectable, so don't pretend.
      if (total <= 0) {
        throw new Error("rng.weighted: total weight must be positive");
      }
      let roll = next() * total;
      for (const e of entries) {
        if (e.weight <= 0) continue;
        roll -= e.weight;
        if (roll < 0) return e.value;
      }
      // Only reachable through float drift on the very last entry.
      for (let i = entries.length - 1; i >= 0; i--) {
        if (entries[i]!.weight > 0) return entries[i]!.value;
      }
      throw new Error("rng.weighted: unreachable");
    },
    shuffle<T>(items: readonly T[]): T[] {
      const out = items.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(0, i);
        const tmp = out[i]!;
        out[i] = out[j]!;
        out[j] = tmp;
      }
      return out;
    },
    chance(probability: number): boolean {
      if (probability <= 0) return false;
      if (probability >= 1) return true;
      return next() < probability;
    },
    cursor: () => draws,
  };
}

/** FNV-1a. Stable across engines, which matters because saves outlive browser versions. */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * A deterministic sub-stream. Same `(seed, purpose, index)` always yields the same sequence,
 * independent of every other stream and of the order they were created in.
 */
export function rngFor(seed: string, purpose: RngPurpose, index: number, cursor = 0): Rng {
  return makeRng(hashString(`${seed}:${purpose}:${index}`) | 0, cursor);
}

const SEED_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** A short, readable, unambiguous seed. Not seeded itself — this is where a run begins. */
export function randomSeed(random: () => number = Math.random): string {
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += SEED_ALPHABET[Math.floor(random() * SEED_ALPHABET.length)] ?? "A";
  }
  return out;
}

/** Trim, upper-case, and strip anything outside the seed alphabet. Empty input stays empty. */
export function normalizeSeed(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 16);
}
