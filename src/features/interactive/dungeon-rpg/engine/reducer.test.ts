import { describe, expect, it } from "vitest";
import { FLOOR_COUNT, MAX_LOG_LINES, TILE_COUNT } from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";
import { ENEMIES, enemyById } from "@/features/interactive/dungeon-rpg/content/enemies";
import { scaleEnemy } from "@/features/interactive/dungeon-rpg/engine/encounter";
import { tileIndex } from "@/features/interactive/dungeon-rpg/engine/grid";
import { DIRECTION_DELTAS, withPosition } from "@/features/interactive/dungeon-rpg/engine/movement";
import { exploreState, reduce, titleState } from "@/features/interactive/dungeon-rpg/engine/reducer";
import { rngFor } from "@/features/interactive/dungeon-rpg/engine/rng";
import { enterFloor, fromRunSave, startRun, toRunSave } from "@/features/interactive/dungeon-rpg/engine/run";
import { emptyProfile } from "@/features/interactive/dungeon-rpg/save/schema";
import { decodeBitset } from "@/features/interactive/dungeon-rpg/save/bitset";
import { FOV_RADIUS } from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";
import type { Direction, GameAction, GameState, RunState } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

const profile = emptyProfile();

function explore(seed: string): Extract<GameState, { mode: "explore" }> {
  const state = reduce(titleState(profile, false), { type: "run:new", seed });
  if (state.mode !== "explore") throw new Error("expected explore");
  return state;
}

function at(state: Extract<GameState, { mode: "explore" }>, pos: { x: number; y: number }) {
  return exploreState(state.profile, withPosition(state.run, pos, FOV_RADIUS));
}

/** Walks the four directions until one of them actually moves the player. */
function stepAnywhere(state: Extract<GameState, { mode: "explore" }>): GameState {
  for (const dir of Object.keys(DIRECTION_DELTAS) as Direction[]) {
    const next = reduce(state, { type: "move", dir });
    if (next !== state) return next;
  }
  throw new Error("player is walled in");
}

describe("run:new", () => {
  it("starts an explore state on floor 1 at the map's spawn", () => {
    const state = explore("start");
    expect(state.run.floor).toBe(1);
    expect(state.run.pos).toEqual(state.run.map.spawn);
    expect(state.run.player.integrity).toBe(state.run.player.maxIntegrity);
    expect(state.run.kills).toBe(0);
    expect(state.run.bounty).toBe(0);
  });

  it("rejects an empty seed rather than starting an unreproducible run", () => {
    const title = titleState(profile, false);
    expect(reduce(title, { type: "run:new", seed: "   " })).toBe(title);
  });

  it("is reproducible from the seed alone", () => {
    const a = explore("repro");
    const b = explore("repro");
    expect(a.run.map.tiles).toEqual(b.run.map.tiles);
    expect(a.run.enemies).toEqual(b.run.enemies);
    expect(a.run.pos).toEqual(b.run.pos);
  });
});

describe("illegal actions are no-ops", () => {
  const actions: GameAction[] = [
    { type: "run:continue", run: startRun("no-op-run") },
    { type: "move", dir: "up" },
    { type: "descend" },
    { type: "battle:choose", choice: "exploit" },
    { type: "battle:cursor", choice: "flee" },
    { type: "battle:advance" },
    { type: "item:use", itemId: "nothing" },
    { type: "shop:buy", itemId: "nothing" },
    { type: "dismiss" },
  ];

  it("returns the identical state object from the title screen", () => {
    const title = titleState(profile, true);
    // `run:continue` is the one action the title screen legitimately accepts.
    for (const action of actions.filter((a) => a.type !== "run:continue")) {
      expect(`${action.type}:${reduce(title, action) === title}`).toBe(`${action.type}:true`);
    }
  });

  it("accepts run:continue only from the title screen", () => {
    const run = startRun("continue-guard");
    const title = titleState(profile, true);
    const resumed = reduce(title, { type: "run:continue", run });
    expect(resumed.mode).toBe("explore");
    if (resumed.mode !== "explore") throw new Error("unreachable");
    expect(resumed.run).toBe(run);
    // Mid-run it would silently discard the run in progress, so it is refused.
    expect(reduce(resumed, { type: "run:continue", run: startRun("other") })).toBe(resumed);
  });

  it("accepts boot only before a run exists", () => {
    const title = titleState(profile, false);
    const booted = reduce(title, { type: "boot", profile, hasRunSave: true });
    expect(booted.mode === "title" && booted.hasRunSave).toBe(true);
    const state = explore("boot-guard");
    expect(reduce(state, { type: "boot", profile, hasRunSave: true })).toBe(state);
  });

  it("ignores battle actions while exploring", () => {
    const state = explore("no-battle");
    for (const action of actions.filter((a) => a.type.startsWith("battle:"))) {
      expect(reduce(state, action)).toBe(state);
    }
  });

  it("ignores movement while in a battle", () => {
    const battle = walkIntoFirstEnemy("no-move");
    expect(reduce(battle, { type: "move", dir: "up" })).toBe(battle);
    expect(reduce(battle, { type: "descend" })).toBe(battle);
  });
});

describe("movement", () => {
  it("moves the player and does not touch the map", () => {
    const state = explore("walk");
    const next = stepAnywhere(state);
    expect(next.mode).toBe("explore");
    if (next.mode !== "explore") throw new Error("unreachable");
    expect(next.run.pos).not.toEqual(state.run.pos);
    expect(next.run.map.tiles).toBe(state.run.map.tiles);
  });

  it("returns the identical state when blocked, so React can skip the render", () => {
    const state = at(explore("blocked"), { x: 1, y: 1 });
    expect(reduce(state, { type: "move", dir: "up" })).toBe(state);
    expect(reduce(state, { type: "move", dir: "left" })).toBe(state);
  });

  it("grows the explored set as the player walks", () => {
    let state = explore("fog");
    const before = state.run.explored.reduce((n, byte) => n + byte.toString(2).replace(/0/g, "").length, 0);
    for (let i = 0; i < 12; i++) {
      const next = stepAnywhere(state);
      if (next.mode !== "explore") break;
      state = next;
    }
    const after = state.run.explored.reduce((n, byte) => n + byte.toString(2).replace(/0/g, "").length, 0);
    expect(after).toBeGreaterThanOrEqual(before);
  });
});

describe("descend", () => {
  it("does nothing when the player is not on a pivot point", () => {
    const state = explore("no-stairs");
    expect(reduce(state, { type: "descend" })).toBe(state);
  });

  it("advances a floor from the stairs and regenerates everything derived", () => {
    const state = explore("descend");
    const onStairs = at(state, state.run.map.stairs);
    const next = reduce(onStairs, { type: "descend" });
    expect(next.mode).toBe("explore");
    if (next.mode !== "explore") throw new Error("unreachable");
    expect(next.run.floor).toBe(2);
    expect(next.run.pos).toEqual(next.run.map.spawn);
    expect(next.run.map.tiles).not.toEqual(state.run.map.tiles);
    // Fog resets per floor; the player does not.
    expect(next.run.player).toEqual(state.run.player);
  });

  it("reaches victory from the final floor's stairs", () => {
    const run: RunState = enterFloor(explore("victory").run, FLOOR_COUNT);
    const onStairs = exploreState(profile, withPosition(run, run.map.stairs, FOV_RADIUS));
    expect(reduce(onStairs, { type: "descend" }).mode).toBe("victory");
  });

  it("returns to the title from victory", () => {
    const run: RunState = enterFloor(explore("victory-dismiss").run, FLOOR_COUNT);
    const onStairs = exploreState(profile, withPosition(run, run.map.stairs, FOV_RADIUS));
    const won = reduce(onStairs, { type: "descend" });
    expect(reduce(won, { type: "dismiss" }).mode).toBe("title");
  });
});

/** Puts the player beside the first enemy and walks into it. */
function walkIntoFirstEnemy(seed: string): Extract<GameState, { mode: "battle" }> {
  const state = explore(seed);
  const placement = state.run.enemies[0]!;
  const beside = at(state, { x: placement.pos.x - 1, y: placement.pos.y });
  const next = reduce(beside, { type: "move", dir: "right" });
  if (next.mode !== "battle") throw new Error("expected a battle");
  return next;
}

describe("battles", () => {
  it("starts when the player walks into an enemy", () => {
    const battle = walkIntoFirstEnemy("battle-start");
    expect(battle.battle.outcome).toBe("ongoing");
    expect(battle.battle.turn).toBe("player");
    expect(battle.run.pos).not.toEqual(battle.run.enemies[0]!.pos);
  });

  it("freezes the map underneath, untouched", () => {
    const before = explore("battle-freeze");
    const placement = before.run.enemies[0]!;
    const beside = at(before, { x: placement.pos.x - 1, y: placement.pos.y });
    const battle = reduce(beside, { type: "move", dir: "right" });
    if (battle.mode !== "battle") throw new Error("expected a battle");
    expect(battle.run.map).toBe(beside.run.map);
    expect(battle.run.pos).toEqual(beside.run.pos);
  });

  it("moves the cursor without resolving anything", () => {
    const battle = walkIntoFirstEnemy("battle-cursor");
    const moved = reduce(battle, { type: "battle:cursor", choice: "isolate" });
    if (moved.mode !== "battle") throw new Error("expected a battle");
    expect(moved.battle.cursor).toBe("isolate");
    expect(moved.battle.enemy.integrity).toBe(battle.battle.enemy.integrity);
    // Re-selecting the same entry is a genuine no-op.
    expect(reduce(moved, { type: "battle:cursor", choice: "isolate" })).toBe(moved);
  });

  it("resolves both halves of a round in one dispatch", () => {
    const battle = walkIntoFirstEnemy("battle-round");
    const next = reduce(battle, { type: "battle:choose", choice: "exploit" });
    if (next.mode !== "battle") throw new Error("expected a battle");
    expect(next.battle.enemy.integrity).toBeLessThan(battle.battle.enemy.integrity);
    if (next.battle.outcome === "ongoing") {
      expect(next.battle.turn).toBe("player");
      expect(next.battle.turns).toBe(1);
    }
  });

  it("advances the persisted combat cursor as the battle runs", () => {
    const battle = walkIntoFirstEnemy("battle-cursor-persist");
    expect(battle.run.rngCursor).toBe(0);
    const next = reduce(battle, { type: "battle:choose", choice: "exploit" });
    if (next.mode !== "battle") throw new Error("expected a battle");
    expect(next.run.rngCursor).toBeGreaterThan(0);
  });

  it("banks XP, bounty, and the kill when the enemy falls", () => {
    let state: GameState = walkIntoFirstEnemy("battle-win");
    if (state.mode !== "battle") throw new Error("expected a battle");
    const placement = state.battle.placementId;
    // Overwhelming force, so the win is guaranteed rather than lucky.
    state = { ...state, run: { ...state.run, player: { ...state.run.player, atk: 10_000 } } };

    const resolved = reduce(state, { type: "battle:choose", choice: "exploit" });
    if (resolved.mode !== "battle") throw new Error("expected a battle");
    expect(resolved.battle.outcome).toBe("won");

    const settled = reduce(resolved, { type: "battle:advance" });
    if (settled.mode !== "explore") throw new Error("expected explore");
    expect(settled.run.kills).toBe(1);
    expect(settled.run.bounty).toBeGreaterThan(0);
    expect(settled.run.xp).toBeGreaterThan(0);
    expect(settled.run.defeated).toContain(placement);
    expect(settled.run.enemies.find((e) => e.id === placement)).toBeUndefined();
  });

  it("steps onto the tile the defeated enemy was holding", () => {
    const battle = walkIntoFirstEnemy("battle-step");
    const placement = battle.run.enemies.find((e) => e.id === battle.battle.placementId)!;
    const state: GameState = { ...battle, run: { ...battle.run, player: { ...battle.run.player, atk: 10_000 } } };
    const settled = reduce(reduce(state, { type: "battle:choose", choice: "exploit" }), { type: "battle:advance" });
    if (settled.mode !== "explore") throw new Error("expected explore");
    expect(settled.run.pos).toEqual(placement.pos);
  });

  it("returns to exploring on a successful disengage, leaving the enemy in place", () => {
    let state: GameState = walkIntoFirstEnemy("battle-flee");
    if (state.mode !== "battle") throw new Error("expected a battle");
    const enemiesBefore = state.run.enemies.length;
    // Outclass the enemy so the escape roll is capped at its maximum.
    state = { ...state, run: { ...state.run, player: { ...state.run.player, level: 99 } } };

    let guard = 0;
    while (state.mode === "battle" && state.battle.outcome === "ongoing" && guard++ < 50) {
      state = reduce(state, { type: "battle:choose", choice: "flee" });
    }
    if (state.mode !== "battle") throw new Error("expected a battle");
    expect(state.battle.outcome).toBe("fled");

    const settled = reduce(state, { type: "battle:advance" });
    if (settled.mode !== "explore") throw new Error("expected explore");
    expect(settled.run.enemies).toHaveLength(enemiesBefore);
    expect(settled.run.defeated).toHaveLength(0);
  });

  it("ends the run when the player's Integrity hits zero", () => {
    let state: GameState = walkIntoFirstEnemy("battle-death");
    if (state.mode !== "battle") throw new Error("expected a battle");
    state = { ...state, run: { ...state.run, player: { ...state.run.player, integrity: 1, atk: 1, def: 0 } } };

    let guard = 0;
    while (state.mode === "battle" && state.battle.outcome === "ongoing" && guard++ < 100) {
      state = reduce(state, { type: "battle:choose", choice: "enumerate" });
    }
    if (state.mode !== "battle") throw new Error("expected a battle");
    expect(state.battle.outcome).toBe("lost");

    const dead = reduce(state, { type: "battle:advance" });
    expect(dead.mode).toBe("dead");
    if (dead.mode !== "dead") throw new Error("unreachable");
    expect(dead.cause).toBe(state.battle.enemy.name);
    // Phase 6 owns the profile; nothing here may write to it.
    expect(dead.profile).toBe(profile);
  });

  it("returns to the title from the death screen", () => {
    const dead: GameState = { mode: "dead", profile, run: explore("dismiss-death").run, cause: "Test" };
    const title = reduce(dead, { type: "dismiss" });
    expect(title.mode).toBe("title");
    expect(title.profile).toBe(profile);
  });

  it("treats an enemy whose content was removed as already cleared, instead of crashing", () => {
    const state = explore("orphan-enemy");
    const placement = state.run.enemies[0]!;
    const broken = exploreState(state.profile, {
      ...withPosition(state.run, { x: placement.pos.x - 1, y: placement.pos.y }, FOV_RADIUS),
      enemies: state.run.enemies.map((e) => (e.id === placement.id ? { ...e, defId: "no-such-enemy" } : e)),
    }) as Extract<GameState, { mode: "explore" }>;

    const next = reduce(broken, { type: "move", dir: "right" });
    expect(next.mode).toBe("explore");
    if (next.mode !== "explore") throw new Error("unreachable");
    expect(next.run.enemies.find((e) => e.id === placement.id)).toBeUndefined();
  });
});

describe("save round-trip", () => {
  it("restores a run to the same position, floor, and map", () => {
    let state = explore("save-trip");
    for (let i = 0; i < 8; i++) {
      const next = stepAnywhere(state);
      if (next.mode !== "explore") break;
      state = next;
    }

    const restored = fromRunSave(toRunSave(state.run));
    expect(restored).not.toBeNull();
    expect(restored!.pos).toEqual(state.run.pos);
    expect(restored!.floor).toBe(state.run.floor);
    expect(restored!.map.tiles).toEqual(state.run.map.tiles);
    expect(restored!.explored).toEqual(state.run.explored);
    expect(restored!.enemies).toEqual(state.run.enemies);
  });

  it("keeps defeated enemies defeated across a reload", () => {
    let state: GameState = walkIntoFirstEnemy("save-defeated");
    if (state.mode !== "battle") throw new Error("expected a battle");
    const placement = state.battle.placementId;
    state = { ...state, run: { ...state.run, player: { ...state.run.player, atk: 10_000 } } };
    const settled = reduce(reduce(state, { type: "battle:choose", choice: "exploit" }), { type: "battle:advance" });
    if (settled.mode !== "explore") throw new Error("expected explore");

    const restored = fromRunSave(toRunSave(settled.run))!;
    expect(restored.defeated).toContain(placement);
    expect(restored.enemies.find((e) => e.id === placement)).toBeUndefined();
  });

  it("resumes the combat stream exactly where it left off", () => {
    let state: GameState = walkIntoFirstEnemy("save-rng");
    if (state.mode !== "battle") throw new Error("expected a battle");
    state = reduce(state, { type: "battle:choose", choice: "exploit" });
    if (state.mode !== "battle") throw new Error("expected a battle");

    const cursor = state.run.rngCursor;
    expect(cursor).toBeGreaterThan(0);
    const restored = fromRunSave(toRunSave(state.run))!;
    expect(restored.rngCursor).toBe(cursor);

    // The stream resumed at that cursor matches the uninterrupted one.
    const uninterrupted = rngFor(state.run.seed, "combat", 0);
    for (let i = 0; i < cursor; i++) uninterrupted.next();
    expect(rngFor(restored.seed, "combat", 0, restored.rngCursor).next()).toBe(uninterrupted.next());
  });

  it("refuses a save whose position is off the map rather than patching around it", () => {
    const run = explore("save-bad-pos").run;
    expect(fromRunSave({ ...toRunSave(run), pos: { x: 9999, y: 0 } })).toBeNull();
    expect(fromRunSave({ ...toRunSave(run), pos: { x: 1.5, y: 2 } })).toBeNull();
  });

  it("refuses a save whose explored bitset will not decode", () => {
    const run = explore("save-bad-bits").run;
    expect(fromRunSave({ ...toRunSave(run), explored: "!!!!" })).toBeNull();
    expect(fromRunSave({ ...toRunSave(run), explored: "AAAA" })).toBeNull();
  });

  it("encodes the explored set to a bitset that decodes back byte-identically", () => {
    const state = explore("save-bits");
    const save = toRunSave(state.run);
    expect(decodeBitset(save.explored, TILE_COUNT)).toEqual(state.run.explored);
  });
});

describe("bounded state", () => {
  it("caps the run log so a long session cannot grow it without limit", () => {
    let state: GameState = walkIntoFirstEnemy("log-cap");
    if (state.mode !== "battle") throw new Error("expected a battle");
    // A tough enemy and a weak player produce a long battle full of log lines.
    state = {
      ...state,
      run: { ...state.run, player: { ...state.run.player, atk: 1, integrity: 100_000, maxIntegrity: 100_000 } },
      battle: { ...state.battle, enemy: { ...state.battle.enemy, integrity: 4000, maxIntegrity: 4000, atk: 1 } },
    };
    for (let i = 0; i < 600 && state.mode === "battle" && state.battle.outcome === "ongoing"; i++) {
      state = reduce(state, { type: "battle:choose", choice: "exploit" });
    }
    if (state.mode !== "battle") throw new Error("expected a battle");
    expect(state.battle.log.length).toBeLessThanOrEqual(MAX_LOG_LINES);
  });
});

describe("content integrity", () => {
  it("gives every floor at least one resident enemy", () => {
    for (let floor = 1; floor <= FLOOR_COUNT; floor++) {
      expect(ENEMIES.some((e) => e.floors.includes(floor))).toBe(true);
    }
  });

  it("scales every enemy without producing a zero-stat combatant", () => {
    for (const def of ENEMIES) {
      expect(enemyById(def.id)).toBe(def);
      for (const level of [1, 5, 12]) {
        const scaled = scaleEnemy(def, level);
        expect(scaled.maxIntegrity).toBeGreaterThan(0);
        expect(scaled.integrity).toBe(scaled.maxIntegrity);
        expect(scaled.atk).toBeGreaterThan(0);
        expect(scaled.xpReward).toBeGreaterThan(0);
      }
    }
  });

  it("keeps every enemy off the spawn tile", () => {
    for (const seed of ["place-a", "place-b", "place-c"]) {
      const run = startRun(seed);
      for (const enemy of run.enemies) {
        expect(tileIndex(enemy.pos.x, enemy.pos.y, run.map.w)).not.toBe(
          tileIndex(run.map.spawn.x, run.map.spawn.y, run.map.w),
        );
      }
    }
  });
});
