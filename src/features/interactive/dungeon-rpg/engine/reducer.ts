/**
 * The single entry point for state change: `reduce(state, action) → state`.
 *
 * `GameAction` is exhaustively switched, so TypeScript flags an unhandled case rather than
 * letting it fall through to a silent no-op. Transitions are *returned* by the reducer and
 * never triggered by the view — the view dispatches intent and renders whatever comes back.
 *
 * Illegal actions are no-ops that return the identical state object, which also means React
 * can skip the re-render.
 */
import { FLOOR_COUNT } from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";
import { enemyById } from "@/features/interactive/dungeon-rpg/content/enemies";
import { floorConfig, isFinalFloor } from "@/features/interactive/dungeon-rpg/content/floors";
import { LOG } from "@/features/interactive/dungeon-rpg/content/flavor";
import { createBattle, resolveEnemyTurn, resolvePlayerTurn } from "@/features/interactive/dungeon-rpg/engine/combat";
import { scaleEnemy } from "@/features/interactive/dungeon-rpg/engine/encounter";
import { appendLog } from "@/features/interactive/dungeon-rpg/engine/log";
import { isOnStairs, tryMove, withPosition } from "@/features/interactive/dungeon-rpg/engine/movement";
import { applyXp } from "@/features/interactive/dungeon-rpg/engine/progression";
import { rngFor } from "@/features/interactive/dungeon-rpg/engine/rng";
import { enterFloor, startRun } from "@/features/interactive/dungeon-rpg/engine/run";
import type { GameAction, GameState, Profile, RunState } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

export function titleState(profile: Profile, hasRunSave: boolean): Extract<GameState, { mode: "title" }> {
  return { mode: "title", profile, hasRunSave };
}

export function exploreState(profile: Profile, run: RunState): Extract<GameState, { mode: "explore" }> {
  return { mode: "explore", profile, run };
}

/** The combat stream, resumed at the run's persisted cursor. Every other stream is derivable. */
function combatRng(run: RunState) {
  return rngFor(run.seed, "combat", 0, run.rngCursor);
}

function walk(state: Extract<GameState, { mode: "explore" }>, action: Extract<GameAction, { type: "move" }>): GameState {
  const { run } = state;
  const result = tryMove(run, action.dir);

  switch (result.kind) {
    case "blocked":
      // A wall costs nothing — not a turn, not a log line, not a re-render.
      return state;

    case "moved": {
      const config = floorConfig(run.floor);
      let next = withPosition(run, result.pos, config.sightRadius);
      if (result.tile === "stairs") {
        next = { ...next, log: appendLog(next.log, LOG.stairsFound) };
      }
      return exploreState(state.profile, next);
    }

    case "encounter": {
      const def = enemyById(result.placement.defId);
      if (!def) {
        // Content and save disagree; treat the placement as already cleared rather than crash.
        const cleaned = { ...run, enemies: run.enemies.filter((e) => e.id !== result.placement.id) };
        return exploreState(state.profile, cleaned);
      }
      const enemy = scaleEnemy(def, result.placement.level);
      const battle = createBattle(enemy, result.placement.id, def.flavor.encounter);
      return {
        mode: "battle",
        profile: state.profile,
        run: { ...run, log: appendLog(run.log, LOG.encounter(enemy.name)) },
        battle,
      };
    }
  }
}

function descend(state: Extract<GameState, { mode: "explore" }>): GameState {
  const { run } = state;
  if (!isOnStairs(run)) return state;

  if (isFinalFloor(run.floor)) {
    return {
      mode: "victory",
      profile: state.profile,
      run: { ...run, log: appendLog(run.log, LOG.victory) },
    };
  }

  const nextFloor = Math.min(run.floor + 1, FLOOR_COUNT);
  const config = floorConfig(nextFloor);
  const advanced = enterFloor({ ...run, log: appendLog(run.log, LOG.descend(config.segment)) }, nextFloor);
  return exploreState(state.profile, advanced);
}

function chooseInBattle(
  state: Extract<GameState, { mode: "battle" }>,
  action: Extract<GameAction, { type: "battle:choose" }>,
): GameState {
  const { run, battle } = state;
  if (battle.outcome !== "ongoing" || battle.turn !== "player") return state;

  const rng = combatRng(run);

  // Both halves of the round resolve now, completely. Animation replays them afterwards.
  const afterPlayer = resolvePlayerTurn(run.player, { ...battle, cursor: action.choice }, action.choice, rng);
  const afterEnemy =
    afterPlayer.battle.outcome === "ongoing"
      ? resolveEnemyTurn(afterPlayer.player, afterPlayer.battle, rng)
      : afterPlayer;

  const nextRun: RunState = { ...run, player: afterEnemy.player, rngCursor: rng.cursor() };
  return { mode: "battle", profile: state.profile, run: nextRun, battle: afterEnemy.battle };
}

/** Drains a finished battle back into whatever comes next. */
function settleBattle(state: Extract<GameState, { mode: "battle" }>): GameState {
  const { run, battle } = state;

  switch (battle.outcome) {
    case "ongoing":
      return state;

    case "won": {
      const def = enemyById(battle.enemy.id);
      const bounty = def?.bounty ?? 0;
      const { player, xp, levelsGained } = applyXp(run.player, run.xp, battle.enemy.xpReward);

      let log = appendLog(run.log, ...battle.log.slice(1));
      if (bounty > 0) log = appendLog(log, LOG.bounty(bounty));
      if (levelsGained > 0) log = appendLog(log, LOG.levelUp(player.level));

      const cleared = run.enemies.find((e) => e.id === battle.placementId);
      const config = floorConfig(run.floor);
      const settled: RunState = {
        ...run,
        player,
        xp,
        bounty: run.bounty + bounty,
        kills: run.kills + 1,
        defeated: [...run.defeated, battle.placementId],
        enemies: run.enemies.filter((e) => e.id !== battle.placementId),
        log,
      };
      // Step onto the tile it was holding, so a cleared path reads as cleared.
      const moved = cleared ? withPosition(settled, cleared.pos, config.sightRadius) : settled;
      return exploreState(state.profile, moved);
    }

    case "fled":
      return exploreState(state.profile, { ...run, log: appendLog(run.log, ...battle.log.slice(1)) });

    case "lost":
      return {
        mode: "dead",
        profile: state.profile,
        run: { ...run, log: appendLog(run.log, ...battle.log.slice(1)) },
        cause: battle.enemy.name,
      };
  }
}

export function reduce(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "boot":
      // Only meaningful before a run exists; a boot mid-run would discard it.
      return state.mode === "title" ? titleState(action.profile, action.hasRunSave) : state;

    case "run:new": {
      const seed = action.seed.trim();
      if (!seed) return state;
      return exploreState(state.profile, startRun(seed));
    }

    case "run:continue":
      // The hook did the reading and the validating; the reducer only does the transition.
      return state.mode === "title" ? exploreState(state.profile, action.run) : state;

    case "run:abandon":
      return titleState(state.profile, false);

    case "move":
      return state.mode === "explore" ? walk(state, action) : state;

    case "descend":
      return state.mode === "explore" ? descend(state) : state;

    case "battle:cursor":
      if (state.mode !== "battle" || state.battle.outcome !== "ongoing") return state;
      if (state.battle.cursor === action.choice) return state;
      return { ...state, battle: { ...state.battle, cursor: action.choice } };

    case "battle:choose":
      return state.mode === "battle" ? chooseInBattle(state, action) : state;

    case "battle:advance":
      return state.mode === "battle" ? settleBattle(state) : state;

    // Phases 4–5 own these. The union carries them now so `GameState` never needs reshaping.
    case "item:use":
    case "shop:buy":
      return state;

    case "dismiss":
      if (state.mode === "dead" || state.mode === "victory") return titleState(state.profile, false);
      return state;
  }
}
