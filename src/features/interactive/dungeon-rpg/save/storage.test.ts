import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAP_H,
  MAP_W,
  PROFILE_STORAGE_KEY,
  RUN_STORAGE_KEY,
  TILE_COUNT,
} from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";
import {
  byteLengthForBits,
  createBitset,
  decodeBitset,
  encodeBitset,
  getBit,
  setBit,
} from "@/features/interactive/dungeon-rpg/save/bitset";
import { emptyProfile, isProfile, isRunSave } from "@/features/interactive/dungeon-rpg/save/schema";
import {
  clearRun,
  hasRunSave,
  loadProfile,
  loadRun,
  saveProfile,
  saveRun,
  storageAvailable,
} from "@/features/interactive/dungeon-rpg/save/storage";
import type { Combatant, Profile, RunSave } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

function samplePlayer(): Combatant {
  return {
    id: "player",
    name: "Responder",
    level: 3,
    integrity: 31,
    maxIntegrity: 56,
    cycles: 9,
    maxCycles: 18,
    atk: 12,
    def: 5,
    aggression: 0,
    xpReward: 0,
  };
}

function sampleRun(): RunSave {
  const explored = createBitset(TILE_COUNT);
  setBit(explored, 0);
  setBit(explored, 811);
  setBit(explored, TILE_COUNT - 1);
  return {
    v: 1,
    seed: "TESTSEED",
    floor: 2,
    player: samplePlayer(),
    xp: 64,
    pos: { x: 12, y: 7 },
    explored: encodeBitset(explored),
    defeated: ["f1e0", "f2e3"],
    inventory: [{ itemId: "patch-kit", count: 2 }],
    bounty: 140,
    kills: 5,
    rngCursor: 37,
    updatedAt: 1_700_000_000_000,
  };
}

// ── Bitset ──────────────────────────────────────────────────────────────────

describe("bitset", () => {
  it("sizes itself to the bit count", () => {
    expect(byteLengthForBits(0)).toBe(0);
    expect(byteLengthForBits(1)).toBe(1);
    expect(byteLengthForBits(8)).toBe(1);
    expect(byteLengthForBits(9)).toBe(2);
    expect(createBitset(TILE_COUNT)).toHaveLength(MAP_W * MAP_H / 8);
  });

  it("starts empty", () => {
    const set = createBitset(TILE_COUNT);
    for (let i = 0; i < TILE_COUNT; i++) expect(getBit(set, i)).toBe(false);
  });

  it("round-trips every single bit position, including the last", () => {
    for (let i = 0; i < TILE_COUNT; i++) {
      const set = createBitset(TILE_COUNT);
      setBit(set, i);
      expect(getBit(set, i)).toBe(true);
      const restored = decodeBitset(encodeBitset(set), TILE_COUNT)!;
      expect(restored).not.toBeNull();
      expect(getBit(restored, i)).toBe(true);
      // …and nothing else came along for the ride.
      let extra = 0;
      for (let j = 0; j < TILE_COUNT; j++) if (j !== i && getBit(restored, j)) extra++;
      expect(extra).toBe(0);
    }
  });

  it("round-trips a fully set map", () => {
    const set = createBitset(TILE_COUNT);
    for (let i = 0; i < TILE_COUNT; i++) setBit(set, i);
    const restored = decodeBitset(encodeBitset(set), TILE_COUNT)!;
    for (let i = 0; i < TILE_COUNT; i++) expect(getBit(restored, i)).toBe(true);
  });

  it("ignores out-of-range reads and writes instead of throwing", () => {
    const set = createBitset(64);
    expect(() => setBit(set, -1)).not.toThrow();
    expect(() => setBit(set, 10_000)).not.toThrow();
    expect(getBit(set, -1)).toBe(false);
    expect(getBit(set, 10_000)).toBe(false);
  });

  it("stays well inside the storage budget", () => {
    const set = createBitset(TILE_COUNT);
    for (let i = 0; i < TILE_COUNT; i++) setBit(set, i);
    expect(encodeBitset(set).length).toBeLessThan(300);
  });

  it("rejects malformed or wrong-sized input", () => {
    expect(decodeBitset("not base64 !!", TILE_COUNT)).toBeNull();
    expect(decodeBitset("AAAA", TILE_COUNT)).toBeNull();
    expect(decodeBitset("", TILE_COUNT)).toBeNull();
    expect(decodeBitset("A", 8)).toBeNull();
  });
});

// ── Schema guards ───────────────────────────────────────────────────────────

describe("schema guards", () => {
  it("accepts well-formed data", () => {
    expect(isRunSave(sampleRun())).toBe(true);
    expect(isProfile(emptyProfile())).toBe(true);
  });

  it("rejects a wrong schema version", () => {
    expect(isRunSave({ ...sampleRun(), v: 2 })).toBe(false);
    expect(isProfile({ ...emptyProfile(), v: 99 })).toBe(false);
  });

  it("rejects missing, mistyped, and non-finite fields", () => {
    const base = sampleRun();
    expect(isRunSave({ ...base, seed: 42 })).toBe(false);
    expect(isRunSave({ ...base, seed: "" })).toBe(false);
    expect(isRunSave({ ...base, floor: Number.NaN })).toBe(false);
    expect(isRunSave({ ...base, pos: { x: 1 } })).toBe(false);
    expect(isRunSave({ ...base, player: { ...samplePlayer(), atk: "lots" } })).toBe(false);
    expect(isRunSave({ ...base, defeated: [1, 2] })).toBe(false);
    expect(isRunSave({ ...base, inventory: [{ itemId: "x" }] })).toBe(false);
    expect(isRunSave({ ...base, explored: null })).toBe(false);
  });

  it("rejects non-objects outright", () => {
    for (const junk of [null, undefined, 7, "run", [], true]) {
      expect(isRunSave(junk)).toBe(false);
      expect(isProfile(junk)).toBe(false);
    }
  });
});

// ── Storage ─────────────────────────────────────────────────────────────────

describe("storage", () => {
  let backing: Record<string, string>;

  function stubStorage(overrides: Partial<Storage> = {}) {
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => backing[key] ?? null,
      setItem: (key: string, value: string) => {
        backing[key] = value;
      },
      removeItem: (key: string) => {
        delete backing[key];
      },
      ...overrides,
    });
  }

  beforeEach(() => {
    backing = {};
    stubStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("round-trips a run", () => {
    const run = sampleRun();
    expect(saveRun(run)).toBe("ok");
    expect(loadRun()).toEqual(run);
    expect(hasRunSave()).toBe(true);
  });

  it("round-trips a profile", () => {
    const profile: Profile = { ...emptyProfile(), deepestFloor: 4, totalRuns: 9, bestBounty: 700 };
    expect(saveProfile(profile)).toBe("ok");
    expect(loadProfile()).toEqual(profile);
  });

  it("returns null for a missing run and a fresh profile for a missing one", () => {
    expect(loadRun()).toBeNull();
    expect(hasRunSave()).toBe(false);
    expect(loadProfile()).toEqual(emptyProfile());
  });

  it("degrades to null on corrupt JSON without throwing", () => {
    backing[RUN_STORAGE_KEY] = "{not json";
    backing[PROFILE_STORAGE_KEY] = "]]]";
    expect(() => loadRun()).not.toThrow();
    expect(loadRun()).toBeNull();
    expect(loadProfile()).toEqual(emptyProfile());
  });

  it("degrades to null on valid JSON with the wrong shape", () => {
    backing[RUN_STORAGE_KEY] = JSON.stringify({ v: 1, seed: "X" });
    expect(loadRun()).toBeNull();
  });

  it("degrades to null on a hostile hand-edited save", () => {
    backing[RUN_STORAGE_KEY] = JSON.stringify({
      ...sampleRun(),
      player: { ...samplePlayer(), maxIntegrity: "9e999" },
    });
    expect(loadRun()).toBeNull();
  });

  it("degrades on a bumped schema version", () => {
    backing[RUN_STORAGE_KEY] = JSON.stringify({ ...sampleRun(), v: 2 });
    backing[PROFILE_STORAGE_KEY] = JSON.stringify({ ...emptyProfile(), v: 2 });
    expect(loadRun()).toBeNull();
    expect(loadProfile()).toEqual(emptyProfile());
  });

  it("clears a junk run slot so it cannot resurface on the next boot", () => {
    backing[RUN_STORAGE_KEY] = "{not json";
    loadRun();
    expect(backing[RUN_STORAGE_KEY]).toBeUndefined();
  });

  it("reports quota errors instead of throwing", () => {
    stubStorage({
      setItem: () => {
        throw new DOMException("quota", "QuotaExceededError");
      },
    });
    expect(() => saveRun(sampleRun())).not.toThrow();
    expect(saveRun(sampleRun())).toBe("quota");
    expect(saveProfile(emptyProfile())).toBe("quota");
  });

  it("degrades silently when localStorage is absent entirely", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(storageAvailable()).toBe(false);
    expect(loadRun()).toBeNull();
    expect(hasRunSave()).toBe(false);
    expect(loadProfile()).toEqual(emptyProfile());
    expect(saveRun(sampleRun())).toBe("unavailable");
    expect(saveProfile(emptyProfile())).toBe("unavailable");
    expect(() => clearRun()).not.toThrow();
  });

  it("degrades silently when reading localStorage throws (blocked storage)", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    });
    expect(loadRun()).toBeNull();
    expect(loadProfile()).toEqual(emptyProfile());
    expect(saveRun(sampleRun())).toBe("quota");
    expect(() => clearRun()).not.toThrow();
  });

  it("leaves the profile byte-identical when the run is cleared", () => {
    const profile: Profile = { ...emptyProfile(), deepestFloor: 5, deaths: 3, unlocks: ["a"] };
    saveProfile(profile);
    saveRun(sampleRun());
    const before = backing[PROFILE_STORAGE_KEY];

    clearRun();

    expect(backing[RUN_STORAGE_KEY]).toBeUndefined();
    expect(backing[PROFILE_STORAGE_KEY]).toBe(before);
    expect(loadProfile()).toEqual(profile);
  });

  it("keeps the profile when the run slot is corrupt", () => {
    const profile: Profile = { ...emptyProfile(), totalRuns: 12 };
    saveProfile(profile);
    backing[RUN_STORAGE_KEY] = "garbage";
    expect(loadRun()).toBeNull();
    expect(loadProfile()).toEqual(profile);
  });
});
