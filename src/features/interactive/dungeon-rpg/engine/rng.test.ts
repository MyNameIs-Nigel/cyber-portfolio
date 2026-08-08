import { describe, expect, it } from "vitest";
import { hashString, makeRng, normalizeSeed, randomSeed, rngFor } from "@/features/interactive/dungeon-rpg/engine/rng";

function draw(rng: { next(): number }, n: number): number[] {
  return Array.from({ length: n }, () => rng.next());
}

describe("makeRng", () => {
  it("produces the same sequence for the same seed", () => {
    expect(draw(makeRng(1234), 20)).toEqual(draw(makeRng(1234), 20));
  });

  it("produces a different sequence for a different seed", () => {
    expect(draw(makeRng(1234), 20)).not.toEqual(draw(makeRng(1235), 20));
  });

  it("stays inside [0, 1)", () => {
    const rng = makeRng(7);
    for (const v of draw(rng, 5000)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("counts draws in the cursor", () => {
    const rng = makeRng(99);
    expect(rng.cursor()).toBe(0);
    draw(rng, 13);
    expect(rng.cursor()).toBe(13);
  });

  it("resumes from a cursor and matches the uninterrupted sequence", () => {
    const uninterrupted = draw(makeRng(4242), 40);

    const first = makeRng(4242);
    const head = draw(first, 17);
    const resumed = makeRng(4242, first.cursor());
    const tail = draw(resumed, 23);

    expect([...head, ...tail]).toEqual(uninterrupted);
    expect(resumed.cursor()).toBe(40);
  });

  it("resumes correctly past the point where the internal state wraps", () => {
    // The state is a 32-bit additive counter; a large cursor must jump, not drift.
    const rng = makeRng(11, 100_000);
    const replayed = makeRng(11);
    draw(replayed, 100_000);
    expect(draw(rng, 5)).toEqual(draw(replayed, 5));
  });
});

describe("rng helpers", () => {
  it("int is inclusive at both ends and never leaves range", () => {
    const rng = makeRng(5);
    const seen = new Set<number>();
    for (let i = 0; i < 4000; i++) {
      const v = rng.int(3, 7);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
      seen.add(v);
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6, 7]);
  });

  it("int collapses to min when the range is empty", () => {
    expect(makeRng(1).int(4, 4)).toBe(4);
    expect(makeRng(1).int(9, 2)).toBe(9);
  });

  it("pick returns members of the array and throws on an empty one", () => {
    const rng = makeRng(8);
    const items = ["a", "b", "c"] as const;
    for (let i = 0; i < 200; i++) {
      expect(items).toContain(rng.pick(items));
    }
    expect(() => rng.pick([])).toThrow();
  });

  it("weighted respects weights across a large sample", () => {
    const rng = makeRng(31337);
    const counts = { heavy: 0, light: 0 };
    const entries = [
      { value: "heavy" as const, weight: 9 },
      { value: "light" as const, weight: 1 },
    ];
    for (let i = 0; i < 20_000; i++) counts[rng.weighted(entries)]++;
    const heavyShare = counts.heavy / 20_000;
    expect(heavyShare).toBeGreaterThan(0.87);
    expect(heavyShare).toBeLessThan(0.93);
  });

  it("weighted never returns a zero- or negative-weight entry", () => {
    const rng = makeRng(64);
    const entries = [
      { value: "never", weight: 0 },
      { value: "nope", weight: -5 },
      { value: "always", weight: 2 },
    ];
    for (let i = 0; i < 3000; i++) expect(rng.weighted(entries)).toBe("always");
  });

  it("weighted throws when nothing is selectable", () => {
    expect(() => makeRng(1).weighted([{ value: "x", weight: 0 }])).toThrow();
    expect(() => makeRng(1).weighted([])).toThrow();
  });

  it("shuffle permutes without mutating the input", () => {
    const source = [1, 2, 3, 4, 5, 6, 7, 8];
    const rng = makeRng(2024);
    const shuffled = rng.shuffle(source);
    expect(source).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(source);
  });

  it("shuffle is deterministic for a seed", () => {
    const source = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(makeRng(77).shuffle(source)).toEqual(makeRng(77).shuffle(source));
  });

  it("chance short-circuits at the bounds without consuming a draw", () => {
    const rng = makeRng(3);
    expect(rng.chance(0)).toBe(false);
    expect(rng.chance(1)).toBe(true);
    expect(rng.cursor()).toBe(0);
  });

  it("chance approximates its probability", () => {
    const rng = makeRng(505);
    let hits = 0;
    for (let i = 0; i < 20_000; i++) if (rng.chance(0.25)) hits++;
    expect(hits / 20_000).toBeGreaterThan(0.23);
    expect(hits / 20_000).toBeLessThan(0.27);
  });
});

describe("hashString", () => {
  it("is stable and unsigned", () => {
    expect(hashString("dungeon")).toBe(hashString("dungeon"));
    expect(hashString("dungeon")).toBeGreaterThanOrEqual(0);
    expect(hashString("dungeon")).not.toBe(hashString("dungeom"));
  });

  it("handles the empty string", () => {
    expect(hashString("")).toBe(0x811c9dc5);
  });
});

describe("rngFor sub-streams", () => {
  it("is deterministic per (seed, purpose, index)", () => {
    expect(draw(rngFor("SEED", "mapgen", 3), 10)).toEqual(draw(rngFor("SEED", "mapgen", 3), 10));
  });

  it("separates purposes and indexes", () => {
    const mapgen3 = draw(rngFor("SEED", "mapgen", 3), 10);
    expect(draw(rngFor("SEED", "loot", 3), 10)).not.toEqual(mapgen3);
    expect(draw(rngFor("SEED", "mapgen", 4), 10)).not.toEqual(mapgen3);
    expect(draw(rngFor("OTHER", "mapgen", 3), 10)).not.toEqual(mapgen3);
  });

  it("keeps streams independent — exhausting flavor does not shift mapgen", () => {
    const baseline = draw(rngFor("SEED", "mapgen", 1), 10);

    const flavor = rngFor("SEED", "flavor", 1);
    draw(flavor, 10_000);
    expect(draw(rngFor("SEED", "mapgen", 1), 10)).toEqual(baseline);
  });

  it("is order-insensitive — deriving loot first does not change mapgen", () => {
    const mapgenFirst = (() => {
      const m = draw(rngFor("S", "mapgen", 2), 8);
      const l = draw(rngFor("S", "loot", 2), 8);
      return { m, l };
    })();
    const lootFirst = (() => {
      const l = draw(rngFor("S", "loot", 2), 8);
      const m = draw(rngFor("S", "mapgen", 2), 8);
      return { m, l };
    })();
    expect(lootFirst).toEqual(mapgenFirst);
  });

  it("round-trips a combat cursor across a simulated reload", () => {
    const live = rngFor("RUN-1", "combat", 0);
    const before = draw(live, 9);
    const persistedCursor = live.cursor();

    // …page reloads; only the cursor survived.
    const restored = rngFor("RUN-1", "combat", 0, persistedCursor);
    const after = draw(restored, 9);

    expect([...before, ...after]).toEqual(draw(rngFor("RUN-1", "combat", 0), 18));
  });
});

describe("seed strings", () => {
  it("randomSeed uses only the unambiguous alphabet", () => {
    for (let i = 0; i < 200; i++) {
      expect(randomSeed()).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
    }
  });

  it("randomSeed is deterministic given a deterministic source", () => {
    const source = () => makeRng(1).next();
    expect(randomSeed(makeRng(1).next)).toBe(randomSeed(makeRng(1).next));
    expect(source()).toBe(makeRng(1).next());
  });

  it("normalizeSeed strips junk, upper-cases, and caps length", () => {
    expect(normalizeSeed("  abc-123 ")).toBe("ABC123");
    expect(normalizeSeed("!!!")).toBe("");
    expect(normalizeSeed("a".repeat(40))).toHaveLength(16);
  });
});
