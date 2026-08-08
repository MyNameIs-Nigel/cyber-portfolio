import { describe, expect, it } from "vitest";
import {
  CRIT_CHANCE,
  CRIT_MULTIPLIER,
  DAMAGE_VARIANCE_MAX,
  DAMAGE_VARIANCE_MIN,
  ENUMERATE_MULTIPLIER,
  FLEE_BASE_CHANCE,
  FLEE_LEVEL_PENALTY,
  FLEE_MAX_CHANCE,
  FLEE_MIN_CHANCE,
  ISOLATE_PATCH_BUDGET,
  ISOLATE_REGEN_FRACTION,
  MAX_BATTLE_TURNS,
} from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";
import { ENEMIES } from "@/features/interactive/dungeon-rpg/content/enemies";
import { createBattle, fleeChance, resolveEnemyTurn, resolvePlayerTurn } from "@/features/interactive/dungeon-rpg/engine/combat";
import { scaleEnemy } from "@/features/interactive/dungeon-rpg/engine/encounter";
import { createPlayer } from "@/features/interactive/dungeon-rpg/engine/progression";
import { makeRng, type Rng } from "@/features/interactive/dungeon-rpg/engine/rng";
import type { BattleChoice, BattleState, Combatant } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

function combatant(overrides: Partial<Combatant> = {}): Combatant {
  return {
    id: "dummy",
    name: "Dummy",
    level: 1,
    integrity: 100,
    maxIntegrity: 100,
    cycles: 0,
    maxCycles: 0,
    atk: 10,
    def: 4,
    aggression: 1,
    xpReward: 10,
    ...overrides,
  };
}

function battleWith(enemy: Combatant, overrides: Partial<BattleState> = {}): BattleState {
  return { ...createBattle(enemy, "f1e0", "A Dummy appears."), ...overrides };
}

/** Mirrors `computeDamage` so the formula is asserted, not merely re-run. */
function expectedDamage(attacker: Combatant, defender: Combatant, rng: Rng, attackMultiplier = 1, guardMultiplier = 1) {
  const base = Math.max(1, attacker.atk - defender.def);
  const variance = DAMAGE_VARIANCE_MIN + rng.next() * (DAMAGE_VARIANCE_MAX - DAMAGE_VARIANCE_MIN);
  const crit = rng.next() < CRIT_CHANCE;
  const raw = base * variance * attackMultiplier * (crit ? CRIT_MULTIPLIER : 1) * guardMultiplier;
  return { amount: Math.max(1, Math.round(raw)), crit };
}

describe("damage formula", () => {
  it("matches the specified maths exactly at a fixed seed", () => {
    for (const seed of [1, 2, 3, 101, 9999]) {
      const player = combatant({ id: "player", atk: 14, def: 5 });
      const enemy = combatant({ atk: 9, def: 3 });
      const expected = expectedDamage(player, enemy, makeRng(seed));

      const { battle } = resolvePlayerTurn(player, battleWith(enemy), "exploit", makeRng(seed));
      expect(battle.enemy.integrity).toBe(enemy.integrity - expected.amount);
      expect(battle.pending[0]).toEqual({ kind: "damage", target: "enemy", amount: expected.amount, crit: expected.crit });
    }
  });

  it("never deals zero, even against absurd defense", () => {
    const player = combatant({ id: "player", atk: 1, def: 0 });
    const wall = combatant({ def: 10_000, integrity: 500, maxIntegrity: 500 });
    for (let seed = 0; seed < 300; seed++) {
      const { battle } = resolvePlayerTurn(player, battleWith(wall), "exploit", makeRng(seed));
      const dealt = wall.integrity - battle.enemy.integrity;
      expect(dealt).toBeGreaterThanOrEqual(1);
    }
  });

  it("never deals zero after ISOLATE halves it either", () => {
    const player = combatant({ id: "player", atk: 0, def: 10_000, integrity: 500, maxIntegrity: 500 });
    const weakling = combatant({ atk: 1, def: 0 });
    for (let seed = 0; seed < 300; seed++) {
      const guarded = battleWith(weakling, { turn: "enemy", playerGuard: 1 });
      const { player: after } = resolveEnemyTurn(player, guarded, makeRng(seed));
      expect(player.integrity - after.integrity).toBeGreaterThanOrEqual(1);
    }
  });

  it("crits at roughly the configured rate", () => {
    const rng = makeRng(4242);
    const player = combatant({ id: "player", atk: 20, def: 5 });
    let crits = 0;
    const samples = 20_000;
    for (let i = 0; i < samples; i++) {
      const enemy = combatant({ integrity: 10_000, maxIntegrity: 10_000 });
      const { events } = resolvePlayerTurn(player, battleWith(enemy), "exploit", rng);
      const hit = events.find((e) => e.kind === "damage");
      if (hit && hit.kind === "damage" && hit.crit) crits++;
    }
    expect(crits / samples).toBeGreaterThan(CRIT_CHANCE - 0.015);
    expect(crits / samples).toBeLessThan(CRIT_CHANCE + 0.015);
  });
});

describe("ENUMERATE", () => {
  it("sets the analysis flag, reveals the enemy, and costs the turn", () => {
    const player = combatant({ id: "player" });
    const enemy = combatant();
    const { battle } = resolvePlayerTurn(player, battleWith(enemy), "enumerate", makeRng(1));
    expect(battle.analyzed).toBe(1);
    expect(battle.revealed).toBe(true);
    expect(battle.turn).toBe("enemy");
    expect(battle.enemy.integrity).toBe(enemy.integrity);
  });

  it("buffs exactly one subsequent EXPLOIT, then expires", () => {
    const player = combatant({ id: "player", atk: 20, def: 5 });
    const enemy = combatant({ integrity: 10_000, maxIntegrity: 10_000 });

    const plain = resolvePlayerTurn(player, battleWith(enemy), "exploit", makeRng(77));
    const buffed = resolvePlayerTurn(player, battleWith(enemy, { analyzed: 1 }), "exploit", makeRng(77));

    const plainDamage = enemy.integrity - plain.battle.enemy.integrity;
    const buffedDamage = enemy.integrity - buffed.battle.enemy.integrity;
    expect(buffedDamage).toBe(Math.max(1, Math.round(plainDamage * ENUMERATE_MULTIPLIER)));
    expect(buffed.battle.analyzed).toBe(0);

    // The next EXPLOIT is back to plain.
    const followUp = resolvePlayerTurn(player, { ...buffed.battle, turn: "player" }, "exploit", makeRng(77));
    const followUpDamage = buffed.battle.enemy.integrity - followUp.battle.enemy.integrity;
    expect(followUpDamage).toBe(plainDamage);
  });
});

describe("ISOLATE", () => {
  it("halves exactly one incoming attack", () => {
    const player = combatant({ id: "player", integrity: 500, maxIntegrity: 500, def: 2 });
    const enemy = combatant({ atk: 40 });

    const unguarded = resolveEnemyTurn(player, battleWith(enemy, { turn: "enemy" }), makeRng(9));
    const guarded = resolveEnemyTurn(player, battleWith(enemy, { turn: "enemy", playerGuard: 1 }), makeRng(9));

    const full = player.integrity - unguarded.player.integrity;
    const halved = player.integrity - guarded.player.integrity;
    // Mitigation multiplies the raw damage *before* rounding — rounding twice compounds the
    // error — so this is the exact expected value, not `round(full / 2)`.
    expect(full).toBe(expectedDamage(enemy, player, makeRng(9)).amount);
    expect(halved).toBe(expectedDamage(enemy, player, makeRng(9), 1, 0.5).amount);
    expect(halved).toBeLessThan(full);
    expect(guarded.battle.playerGuard).toBe(0);

    // The guard is spent — the following hit lands in full.
    const next = resolveEnemyTurn(guarded.player, { ...guarded.battle, turn: "enemy" }, makeRng(9));
    expect(guarded.player.integrity - next.player.integrity).toBe(full);
  });

  it("patches Integrity and burns a patch from the budget", () => {
    const player = combatant({ id: "player", integrity: 50, maxIntegrity: 100 });
    const { player: after, battle } = resolvePlayerTurn(player, battleWith(combatant()), "isolate", makeRng(1));
    expect(after.integrity).toBe(50 + Math.round(100 * ISOLATE_REGEN_FRACTION));
    expect(battle.patches).toBe(ISOLATE_PATCH_BUDGET - 1);
    expect(battle.playerGuard).toBe(1);
  });

  it("still mitigates once the patch budget is spent", () => {
    const player = combatant({ id: "player", integrity: 50, maxIntegrity: 100 });
    const { player: after, battle } = resolvePlayerTurn(player, battleWith(combatant(), { patches: 0 }), "isolate", makeRng(1));
    expect(after.integrity).toBe(50);
    expect(battle.playerGuard).toBe(1);
    expect(battle.patches).toBe(0);
  });

  it("never patches past maximum Integrity", () => {
    const player = combatant({ id: "player", integrity: 100, maxIntegrity: 100 });
    const { player: after } = resolvePlayerTurn(player, battleWith(combatant()), "isolate", makeRng(1));
    expect(after.integrity).toBe(100);
  });
});

describe("DISENGAGE", () => {
  it("scales with the level gap and clamps at both ends", () => {
    const player = combatant({ id: "player", level: 5 });
    expect(fleeChance(player, combatant({ level: 5 }))).toBeCloseTo(FLEE_BASE_CHANCE, 10);
    expect(fleeChance(player, combatant({ level: 7 }))).toBeCloseTo(FLEE_BASE_CHANCE - 2 * FLEE_LEVEL_PENALTY, 10);
    expect(fleeChance(player, combatant({ level: 99 }))).toBe(FLEE_MIN_CHANCE);
    expect(fleeChance(combatant({ level: 99 }), combatant({ level: 1 }))).toBe(FLEE_MAX_CHANCE);
  });

  it("stays genuinely viable at the worst level gap", () => {
    // A cornered player with no escape and no items is a soft-locked run, so the floor matters.
    expect(FLEE_MIN_CHANCE).toBeGreaterThan(0.1);
  });

  it("ends the battle on success", () => {
    const player = combatant({ id: "player", level: 50 });
    const { battle } = resolvePlayerTurn(player, battleWith(combatant({ level: 1 })), "flee", makeRng(3));
    expect(battle.outcome).toBe("fled");
    expect(battle.turn).toBe("player");
  });

  it("yields the turn to the enemy on failure", () => {
    const player = combatant({ id: "player", level: 1 });
    const enemy = combatant({ level: 99 });
    // Seek a seed where the roll fails; FLEE_MIN_CHANCE makes failures the common case here.
    let failed: ReturnType<typeof resolvePlayerTurn> | null = null;
    for (let seed = 0; seed < 100 && !failed; seed++) {
      const attempt = resolvePlayerTurn(player, battleWith(enemy), "flee", makeRng(seed));
      if (attempt.battle.outcome === "ongoing") failed = attempt;
    }
    expect(failed).not.toBeNull();
    expect(failed!.battle.turn).toBe("enemy");
    expect(failed!.events).toContainEqual({ kind: "flee", success: false });
  });

  it("succeeds at roughly the specified rate", () => {
    const rng = makeRng(808);
    const player = combatant({ id: "player", level: 3 });
    const enemy = combatant({ level: 3 });
    let escapes = 0;
    for (let i = 0; i < 20_000; i++) {
      if (resolvePlayerTurn(player, battleWith(enemy), "flee", rng).battle.outcome === "fled") escapes++;
    }
    expect(escapes / 20_000).toBeGreaterThan(FLEE_BASE_CHANCE - 0.02);
    expect(escapes / 20_000).toBeLessThan(FLEE_BASE_CHANCE + 0.02);
  });
});

describe("outcomes", () => {
  it("declares a win when the enemy's Integrity hits zero", () => {
    const player = combatant({ id: "player", atk: 500 });
    const { battle } = resolvePlayerTurn(player, battleWith(combatant({ integrity: 3, maxIntegrity: 30 })), "exploit", makeRng(1));
    expect(battle.outcome).toBe("won");
    expect(battle.enemy.integrity).toBe(0);
    expect(battle.pending).toContainEqual({ kind: "defeat", target: "enemy" });
  });

  it("declares a loss when the player's Integrity hits zero", () => {
    const player = combatant({ id: "player", integrity: 2, maxIntegrity: 40, def: 0 });
    const { battle, player: after } = resolveEnemyTurn(player, battleWith(combatant({ atk: 99 }), { turn: "enemy" }), makeRng(1));
    expect(battle.outcome).toBe("lost");
    expect(after.integrity).toBe(0);
    expect(battle.pending).toContainEqual({ kind: "defeat", target: "player" });
  });

  it("ignores actions once the battle is over", () => {
    const finished = battleWith(combatant(), { outcome: "won" });
    const player = combatant({ id: "player" });
    expect(resolvePlayerTurn(player, finished, "exploit", makeRng(1)).battle).toBe(finished);
    expect(resolveEnemyTurn(player, { ...finished, turn: "enemy" }, makeRng(1)).battle.outcome).toBe("won");
  });

  it("ignores a player action when it is not the player's turn", () => {
    const waiting = battleWith(combatant(), { turn: "enemy" });
    const player = combatant({ id: "player" });
    expect(resolvePlayerTurn(player, waiting, "exploit", makeRng(1)).battle).toBe(waiting);
  });
});

/**
 * Balance and safety sweep. An unwinnable or unloseable pairing is the kind of bug that only
 * shows up on someone else's machine, three floors in.
 */
describe("10k-battle termination sweep", () => {
  const policies: Record<string, (turn: number) => BattleChoice> = {
    aggressive: () => "exploit",
    turtle: () => "isolate",
    analyst: (turn) => (turn % 2 === 0 ? "enumerate" : "exploit"),
    coward: () => "flee",
    mixed: (turn) => (["exploit", "isolate", "enumerate", "exploit"] as BattleChoice[])[turn % 4]!,
  };

  it("always terminates, and never leaves Integrity out of bounds", () => {
    let battles = 0;
    const outcomes = { won: 0, lost: 0, fled: 0 };

    for (const [, choose] of Object.entries(policies)) {
      for (const def of ENEMIES) {
        for (let playerLevel = 1; playerLevel <= 10; playerLevel++) {
          for (let seed = 0; seed < 25; seed++) {
            const rng = makeRng(seed * 31 + playerLevel * 7 + def.integrity);
            let player: Combatant = { ...createPlayer(), level: playerLevel, atk: 8 + playerLevel * 2, def: 3 + playerLevel };
            player = { ...player, maxIntegrity: 40 + playerLevel * 8, integrity: 40 + playerLevel * 8 };
            let battle = battleWith(scaleEnemy(def, Math.max(1, playerLevel + (seed % 3) - 1)));

            let turn = 0;
            while (battle.outcome === "ongoing" && turn < MAX_BATTLE_TURNS) {
              const afterPlayer = resolvePlayerTurn(player, battle, choose(turn), rng);
              player = afterPlayer.player;
              battle = afterPlayer.battle;
              if (battle.outcome === "ongoing") {
                const afterEnemy = resolveEnemyTurn(player, battle, rng);
                player = afterEnemy.player;
                battle = afterEnemy.battle;
              }

              expect(player.integrity).toBeGreaterThanOrEqual(0);
              expect(player.integrity).toBeLessThanOrEqual(player.maxIntegrity);
              expect(battle.enemy.integrity).toBeGreaterThanOrEqual(0);
              expect(battle.enemy.integrity).toBeLessThanOrEqual(battle.enemy.maxIntegrity);
              turn++;
            }

            expect(`${def.id}/${playerLevel}/${seed}:${battle.outcome}`).not.toBe(
              `${def.id}/${playerLevel}/${seed}:ongoing`,
            );
            outcomes[battle.outcome as "won" | "lost" | "fled"]++;
            battles++;
          }
        }
      }
    }

    expect(battles).toBeGreaterThanOrEqual(10_000);
    // A run has to be losable and winnable, or neither number means anything.
    expect(outcomes.won).toBeGreaterThan(0);
    expect(outcomes.lost).toBeGreaterThan(0);
    expect(outcomes.fled).toBeGreaterThan(0);
  });
});
