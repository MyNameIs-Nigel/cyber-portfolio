"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { FLOOR_COUNT } from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";
import { canvasLabel } from "@/features/interactive/dungeon-rpg/a11y/describe";
import { reduce, titleState } from "@/features/interactive/dungeon-rpg/engine/reducer";
import { normalizeSeed, randomSeed } from "@/features/interactive/dungeon-rpg/engine/rng";
import { fromRunSave, toRunSave } from "@/features/interactive/dungeon-rpg/engine/run";
import { emptyProfile } from "@/features/interactive/dungeon-rpg/save/schema";
import { clearRun, hasRunSave, loadProfile, loadRun, saveRun } from "@/features/interactive/dungeon-rpg/save/storage";
import { cameraFor, draw, resizeCanvas } from "@/features/interactive/dungeon-rpg/render/renderer";
import { readPalette, type Palette } from "@/features/interactive/dungeon-rpg/render/palette";
import { createSprites, type SpriteSheet } from "@/features/interactive/dungeon-rpg/render/sprites";
import type { BattleChoice, Direction, GameState, SaveStatus } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

const MOVE_KEYS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  W: "up",
  S: "down",
  A: "left",
  D: "right",
};

const BATTLE_ORDER: BattleChoice[] = ["exploit", "enumerate", "isolate", "flee"];

/**
 * Only the parts of a run worth writing to storage for. Autosaving every step thrashes
 * `localStorage` and can hitch on slower machines, so this deliberately excludes position:
 * saves land on floor changes, battle results, and unmount.
 */
function saveKeyFor(state: GameState): string {
  if (state.mode === "title") return "title";
  const { run } = state;
  return `${state.mode}:${run.floor}:${run.kills}:${run.bounty}:${run.defeated.length}:${run.player.level}`;
}

export function useDungeonRpg() {
  // Starts deliberately empty: reading storage during the first render would diverge from the
  // server-rendered markup and blow up hydration. The `boot` dispatch below fills it in.
  const [state, dispatch] = useReducer(reduce, null, () => titleState(emptyProfile(), false));

  const [seedInput, setSeedInput] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("ok");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const paletteRef = useRef<Palette | null>(null);
  const spritesRef = useRef<SpriteSheet | null>(null);
  const frameRef = useRef<number | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Boot ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch({ type: "boot", profile: loadProfile(), hasRunSave: hasRunSave() });
  }, []);

  // ── Rendering ───────────────────────────────────────────────────────────────

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const palette = (paletteRef.current ??= readPalette());
    if (!spritesRef.current) spritesRef.current = createSprites(palette);

    // jsdom and any browser that refuses a context land here; the DOM HUD still works.
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
    const scale = resizeCanvas(canvas, dpr);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    const current = stateRef.current;
    const camera = current.mode === "title" ? { x: 0, y: 0 } : cameraFor(current.run);
    draw(ctx, current, camera, palette, spritesRef.current);
  }, []);

  /**
   * A dirty flag, not a permanent rAF loop. An idle game on a portfolio page that someone
   * left open in a tab must burn no CPU at all.
   */
  const scheduleFrame = useCallback(() => {
    if (frameRef.current !== null) return;
    if (typeof requestAnimationFrame !== "function") {
      paint();
      return;
    }
    // The handle is cleared here rather than inside `paint`, so a paint that bails early
    // (no canvas yet on the title screen) still leaves the next frame schedulable.
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      paint();
    });
  }, [paint]);

  useEffect(() => {
    scheduleFrame();
  }, [state, scheduleFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver !== "function") return;
    const observer = new ResizeObserver(() => scheduleFrame());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [scheduleFrame]);

  // Every pending frame is cancelled on unmount, so nothing paints into a dead canvas.
  useEffect(() => {
    return () => {
      if (frameRef.current !== null && typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = null;
    };
  }, []);

  // ── Persistence ─────────────────────────────────────────────────────────────

  const saveKey = saveKeyFor(state);
  useEffect(() => {
    const current = stateRef.current;
    if (current.mode === "title") return;
    if (current.mode === "dead" || current.mode === "victory") {
      // The run is over. Clearing it must never touch the profile.
      clearRun();
      return;
    }
    setSaveStatus(saveRun(toRunSave(current.run)));
  }, [saveKey]);

  useEffect(() => {
    return () => {
      const current = stateRef.current;
      if (current.mode === "explore" || current.mode === "battle" || current.mode === "shop") {
        saveRun(toRunSave(current.run));
      }
    };
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const startNewRun = useCallback((seed: string) => {
    const normalized = normalizeSeed(seed) || randomSeed();
    clearRun();
    dispatch({ type: "run:new", seed: normalized });
  }, []);

  const continueRun = useCallback(() => {
    const save = loadRun();
    const run = save ? fromRunSave(save) : null;
    if (!run) {
      // A save that won't rebuild is swept rather than nursed along.
      clearRun();
      dispatch({ type: "boot", profile: loadProfile(), hasRunSave: false });
      return;
    }
    dispatch({ type: "run:continue", run });
  }, []);

  const abandonRun = useCallback(() => {
    clearRun();
    dispatch({ type: "run:abandon" });
    dispatch({ type: "boot", profile: loadProfile(), hasRunSave: false });
  }, []);

  const moveBattleCursor = useCallback((delta: number) => {
    const current = stateRef.current;
    if (current.mode !== "battle") return;
    const index = BATTLE_ORDER.indexOf(current.battle.cursor);
    const next = BATTLE_ORDER[(index + delta + BATTLE_ORDER.length) % BATTLE_ORDER.length]!;
    dispatch({ type: "battle:cursor", choice: next });
  }, []);

  /**
   * Bound to the container rather than `window`, so arrow keys only ever get swallowed while
   * the game actually has focus — someone scrolling past the page keeps their scroll.
   */
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const current = stateRef.current;
      const key = event.key;

      if (current.mode === "battle") {
        if (current.battle.outcome !== "ongoing") {
          if (key === "Enter" || key === " ") {
            event.preventDefault();
            dispatch({ type: "battle:advance" });
          }
          return;
        }
        if (key === "ArrowUp" || key === "w" || key === "W") {
          event.preventDefault();
          moveBattleCursor(-1);
        } else if (key === "ArrowDown" || key === "s" || key === "S") {
          event.preventDefault();
          moveBattleCursor(1);
        } else if (key === "Enter" || key === " ") {
          event.preventDefault();
          dispatch({ type: "battle:choose", choice: current.battle.cursor });
        }
        return;
      }

      if (current.mode === "explore") {
        const dir = MOVE_KEYS[key];
        if (dir) {
          event.preventDefault();
          dispatch({ type: "move", dir });
          return;
        }
        if (key === "Enter" || key === " ") {
          event.preventDefault();
          dispatch({ type: "descend" });
        }
        return;
      }

      if ((current.mode === "dead" || current.mode === "victory") && (key === "Enter" || key === " ")) {
        event.preventDefault();
        dispatch({ type: "dismiss" });
      }
    },
    [moveBattleCursor],
  );

  const chooseBattleAction = useCallback((choice: BattleChoice) => {
    const current = stateRef.current;
    if (current.mode !== "battle") return;
    if (current.battle.outcome !== "ongoing") {
      dispatch({ type: "battle:advance" });
      return;
    }
    dispatch({ type: "battle:choose", choice });
  }, []);

  const advanceBattle = useCallback(() => dispatch({ type: "battle:advance" }), []);
  const dismiss = useCallback(() => dispatch({ type: "dismiss" }), []);
  const descend = useCallback(() => dispatch({ type: "descend" }), []);

  const label = useMemo(() => canvasLabel(state), [state]);

  return {
    state,
    seedInput,
    setSeedInput,
    saveStatus,
    canvasRef,
    containerRef,
    canvasLabel: label,
    battleOrder: BATTLE_ORDER,
    floorCount: FLOOR_COUNT,
    onKeyDown,
    startNewRun,
    continueRun,
    abandonRun,
    chooseBattleAction,
    advanceBattle,
    dismiss,
    descend,
  };
}
