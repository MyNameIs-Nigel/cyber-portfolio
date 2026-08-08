/**
 * Turn resolution. Pure functions over plain data — this file would work unchanged printed to
 * a terminal, which is exactly why it stays testable despite the game rendering to a canvas.
 *
 * **A turn resolves completely and instantly.** Damage is applied, death is determined, and the
 * log is written before anything is drawn; `battle.pending` then carries the facts to the
 * animation layer to *replay*. Three things fall out of that:
 *
 * - tests assert final state with no timers and no fake clocks,
 * - animation can be skipped, sped up, or disabled without changing an outcome,
 * - a reload mid-animation can't desync, because state was never mid-anything.
 *
 * RNG draw order is part of the contract: variance, then crit. Changing it changes every
 * seeded battle.
 */
import {
  CRIT_CHANCE,
  CRIT_MULTIPLIER,
  DAMAGE_VARIANCE_MAX,
  DAMAGE_VARIANCE_MIN,
  ENEMY_DEFEND_THRESHOLD,
  ENUMERATE_MULTIPLIER,
  FLEE_BASE_CHANCE,
  FLEE_LEVEL_PENALTY,
  FLEE_MAX_CHANCE,
  FLEE_MIN_CHANCE,
  ISOLATE_DAMAGE_MULTIPLIER,
  ISOLATE_PATCH_BUDGET,
  ISOLATE_REGEN_FRACTION,
} from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";
import { LOG } from "@/features/interactive/dungeon-rpg/content/flavor";
import { appendLog } from "@/features/interactive/dungeon-rpg/engine/log";
import type { Rng } from "@/features/interactive/dungeon-rpg/engine/rng";
import type {
  BattleChoice,
  BattleEvent,
  BattleOutcome,
  BattleState,
  Combatant,
} from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

export type BattleResolution = {
  player: Combatant;
  battle: BattleState;
  /** Only this turn's events. They are also appended to `battle.pending`. */
  events: BattleEvent[];
};

export function createBattle(enemy: Combatant, placementId: string, encounterLine: string): BattleState {
  return {
    enemy,
    placementId,
    turn: "player",
    cursor: "exploit",
    log: [encounterLine],
    pending: [],
    outcome: "ongoing",
    analyzed: 0,
    playerGuard: 0,
    enemyGuard: 0,
    patches: ISOLATE_PATCH_BUDGET,
    revealed: false,
    turns: 0,
  };
}

type Hit = { amount: number; crit: boolean };

/**
 * `max(1, …)` twice, deliberately: once before mitigation and once after. An attack that deals
 * zero produces an unwinnable stalemate against a high-defense enemy, and it reads as a bug
 * rather than as difficulty.
 */
function computeDamage(attacker: Combatant, defender: Combatant, rng: Rng, attackMultiplier: number, guardMultiplier: number): Hit {
  const base = Math.max(1, attacker.atk - defender.def);
  const variance = DAMAGE_VARIANCE_MIN + rng.next() * (DAMAGE_VARIANCE_MAX - DAMAGE_VARIANCE_MIN);
  const crit = rng.chance(CRIT_CHANCE);
  const raw = base * variance * attackMultiplier * (crit ? CRIT_MULTIPLIER : 1) * guardMultiplier;
  return { amount: Math.max(1, Math.round(raw)), crit };
}

function damaged(target: Combatant, amount: number): Combatant {
  return { ...target, integrity: Math.max(0, target.integrity - amount) };
}

function healed(target: Combatant, amount: number): Combatant {
  return { ...target, integrity: Math.min(target.maxIntegrity, target.integrity + amount) };
}

export function fleeChance(player: Combatant, enemy: Combatant): number {
  const raw = FLEE_BASE_CHANCE - (enemy.level - player.level) * FLEE_LEVEL_PENALTY;
  return Math.min(FLEE_MAX_CHANCE, Math.max(FLEE_MIN_CHANCE, raw));
}

export function resolvePlayerTurn(player: Combatant, battle: BattleState, choice: BattleChoice, rng: Rng): BattleResolution {
  if (battle.outcome !== "ongoing" || battle.turn !== "player") {
    return { player, battle, events: [] };
  }

  const events: BattleEvent[] = [];
  let log = battle.log;
  let nextPlayer = player;
  let enemy = battle.enemy;
  let { analyzed, playerGuard, enemyGuard, patches, revealed } = battle;
  let outcome: BattleOutcome = battle.outcome;
  let turn: BattleState["turn"] = "enemy";

  switch (choice) {
    case "exploit": {
      const attackMultiplier = analyzed > 0 ? ENUMERATE_MULTIPLIER : 1;
      const guardMultiplier = enemyGuard > 0 ? ISOLATE_DAMAGE_MULTIPLIER : 1;
      const hit = computeDamage(nextPlayer, enemy, rng, attackMultiplier, guardMultiplier);
      enemy = damaged(enemy, hit.amount);
      if (analyzed > 0) analyzed -= 1;
      enemyGuard = 0;

      events.push({ kind: "damage", target: "enemy", amount: hit.amount, crit: hit.crit });
      log = appendLog(log, hit.crit ? LOG.playerCrit(enemy.name, hit.amount) : LOG.playerExploit(enemy.name, hit.amount));

      if (enemy.integrity <= 0) {
        outcome = "won";
        turn = "player";
        events.push({ kind: "defeat", target: "enemy" });
        log = appendLog(log, LOG.enemyDefeated(enemy.name, enemy.xpReward));
      }
      break;
    }

    case "enumerate": {
      // Costs a turn and buys exactly one hard hit. This trade is the pivot of the system.
      analyzed = 1;
      revealed = true;
      events.push({ kind: "status", target: "enemy", label: "analyzed" });
      log = appendLog(log, LOG.playerEnumerate(enemy.name));
      break;
    }

    case "isolate": {
      playerGuard = 1;
      const patch = patches > 0 ? Math.max(1, Math.round(nextPlayer.maxIntegrity * ISOLATE_REGEN_FRACTION)) : 0;
      const before = nextPlayer.integrity;
      if (patch > 0) {
        nextPlayer = healed(nextPlayer, patch);
        patches -= 1;
      }
      const applied = nextPlayer.integrity - before;
      if (applied > 0) events.push({ kind: "heal", target: "player", amount: applied });
      events.push({ kind: "status", target: "player", label: "isolated" });
      log = appendLog(log, LOG.playerIsolate(patch > 0 ? applied : 0));
      break;
    }

    case "flee": {
      const success = rng.chance(fleeChance(nextPlayer, enemy));
      events.push({ kind: "flee", success });
      if (success) {
        outcome = "fled";
        turn = "player";
        log = appendLog(log, LOG.fleeSuccess);
      } else {
        // A failed escape still costs the turn — that's what makes it a gamble.
        log = appendLog(log, LOG.fleeFail);
      }
      break;
    }
  }

  const nextBattle: BattleState = {
    ...battle,
    enemy,
    turn,
    log,
    pending: [...battle.pending, ...events],
    outcome,
    analyzed,
    playerGuard,
    enemyGuard,
    patches,
    revealed,
  };

  return { player: nextPlayer, battle: nextBattle, events };
}

/**
 * Enemy AI, kept simple and *legible*: attack, or harden when badly hurt, weighted by
 * `aggression`. A player should be able to build a correct mental model within three battles.
 */
export function resolveEnemyTurn(player: Combatant, battle: BattleState, rng: Rng): BattleResolution {
  if (battle.outcome !== "ongoing" || battle.turn !== "enemy") {
    return { player, battle, events: [] };
  }

  const events: BattleEvent[] = [];
  let log = battle.log;
  let nextPlayer = player;
  let { playerGuard, enemyGuard } = battle;
  let outcome: BattleOutcome = battle.outcome;

  const hurt = battle.enemy.integrity / battle.enemy.maxIntegrity < ENEMY_DEFEND_THRESHOLD;
  const presses = !hurt || rng.chance(battle.enemy.aggression);

  if (presses) {
    const guardMultiplier = playerGuard > 0 ? ISOLATE_DAMAGE_MULTIPLIER : 1;
    const hit = computeDamage(battle.enemy, nextPlayer, rng, 1, guardMultiplier);
    nextPlayer = damaged(nextPlayer, hit.amount);
    playerGuard = 0;

    events.push({ kind: "damage", target: "player", amount: hit.amount, crit: hit.crit });
    log = appendLog(log, hit.crit ? LOG.enemyCrit(battle.enemy.name, hit.amount) : LOG.enemyAttack(battle.enemy.name, hit.amount));

    if (nextPlayer.integrity <= 0) {
      outcome = "lost";
      events.push({ kind: "defeat", target: "player" });
      log = appendLog(log, LOG.playerDown);
    }
  } else {
    enemyGuard = 1;
    events.push({ kind: "status", target: "enemy", label: "hardened" });
    log = appendLog(log, LOG.enemyDefend(battle.enemy.name));
  }

  const nextBattle: BattleState = {
    ...battle,
    turn: "player",
    log,
    pending: [...battle.pending, ...events],
    outcome,
    playerGuard,
    enemyGuard,
    turns: battle.turns + 1,
  };

  return { player: nextPlayer, battle: nextBattle, events };
}
