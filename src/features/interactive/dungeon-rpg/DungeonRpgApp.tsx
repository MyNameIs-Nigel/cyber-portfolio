"use client";

import { useEffect, useRef } from "react";
import { VIEW_H, VIEW_W } from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";
import { CHOICE_HINT, CHOICE_LABEL, DEATH, HELP_LINES, STAT_LABEL, TITLE, VICTORY } from "@/features/interactive/dungeon-rpg/content/flavor";
import { floorConfig } from "@/features/interactive/dungeon-rpg/content/floors";
import { enemyById } from "@/features/interactive/dungeon-rpg/content/enemies";
import { useDungeonRpg } from "@/features/interactive/dungeon-rpg/useDungeonRpg";
import type { BattleState, RunState } from "@/features/interactive/dungeon-rpg/dungeon-rpg.types";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-1 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

function Meter({ label, value, max, tone }: { label: string; value: number; max: number; tone: "ok" | "danger" }) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <div className="min-w-32 flex-1">
      <div className="mb-1 flex items-baseline justify-between font-mono text-xs">
        <span className="text-muted">{label}</span>
        <span className={tone === "danger" ? "text-red-400" : "text-fg"}>
          {value}
          <span className="text-muted">/{max}</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${tone === "danger" ? "bg-red-500" : "bg-accent-1"}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}

function BattleLog({ lines }: { lines: readonly string[] }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  return (
    <div
      ref={ref}
      // Real DOM text, not canvas: it needs to be selectable and scrollable, and it gets
      // screen-reader announcements for free.
      role="log"
      aria-live="polite"
      aria-label="Session log"
      className="terminal-scroll h-32 overflow-y-auto rounded-lg border border-border bg-bg p-3 font-mono text-xs leading-relaxed text-muted"
    >
      {lines.length === 0 ? <p className="text-border">No activity yet.</p> : null}
      {lines.map((line, index) => (
        <p key={`${index}-${line}`} className={index === lines.length - 1 ? "text-fg" : undefined}>
          <span className="text-accent-1">·</span> {line}
        </p>
      ))}
    </div>
  );
}

function EnemyPanel({ battle }: { battle: BattleState }) {
  const def = enemyById(battle.enemy.id);
  return (
    <div className="rounded-lg border border-border bg-bg p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-sm">
        <span className="text-fg">{battle.enemy.name}</span>
        <span className="text-xs text-muted">
          {STAT_LABEL.level} {battle.enemy.level}
        </span>
      </div>
      {battle.revealed ? (
        <>
          <div className="mt-2">
            <Meter
              label={STAT_LABEL.integrity}
              value={battle.enemy.integrity}
              max={battle.enemy.maxIntegrity}
              tone="ok"
            />
          </div>
          <p className="mt-2 font-mono text-xs text-muted">
            {STAT_LABEL.atk} {battle.enemy.atk} · {STAT_LABEL.def} {battle.enemy.def}
          </p>
          {def ? <p className="mt-1 font-mono text-xs text-accent-4">{def.flavor.tell}</p> : null}
        </>
      ) : (
        <p className="mt-2 font-mono text-xs text-muted">
          Behaviour unread. <span className="text-accent-2">{CHOICE_LABEL.enumerate}</span> to expose its stats.
        </p>
      )}
    </div>
  );
}

function RunSummary({ run }: { run: RunState }) {
  const player = run.player;
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-xs sm:grid-cols-4">
      {[
        ["Segment reached", `${run.floor}/5`],
        ["Threats cleared", String(run.kills)],
        [STAT_LABEL.bounty, String(run.bounty)],
        [STAT_LABEL.level, String(player.level)],
        ["Seed", run.seed],
      ].map(([term, value]) => (
        <div key={term}>
          <dt className="text-muted">{term}</dt>
          <dd className="text-fg">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DungeonRpgApp() {
  const {
    state,
    seedInput,
    setSeedInput,
    saveStatus,
    canvasRef,
    containerRef,
    canvasLabel,
    battleOrder,
    onKeyDown,
    startNewRun,
    continueRun,
    abandonRun,
    chooseBattleAction,
    advanceBattle,
    dismiss,
    descend,
  } = useDungeonRpg();

  const config = state.mode === "title" ? null : floorConfig(state.run.floor);

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border py-3 text-center font-mono text-sm text-muted">
        <span className="text-accent-1">&gt;</span> cold-boot.exe
      </div>

      <div className="flex flex-col gap-4 p-5">
        {saveStatus !== "ok" ? (
          <p className="rounded-lg border border-accent-2/40 bg-accent-2/10 px-3 py-2 font-mono text-xs text-accent-2" role="status">
            Storage unavailable — this run will not be saved.
          </p>
        ) : null}

        {state.mode === "title" ? (
          <div className="flex flex-col items-center gap-5 py-6 text-center">
            <div>
              <h2 className="font-mono text-2xl text-accent-1">{TITLE.heading}</h2>
              <p className="mt-1 font-mono text-sm text-muted">{TITLE.subheading}</p>
            </div>
            <div className="max-w-xl space-y-2">
              {TITLE.body.map((line) => (
                <p key={line} className="text-sm text-muted">
                  {line}
                </p>
              ))}
            </div>

            <div className="flex w-full max-w-sm flex-col gap-3">
              <label className="text-left font-mono text-xs text-muted" htmlFor="dungeon-seed">
                Seed (optional)
              </label>
              <input
                id="dungeon-seed"
                value={seedInput}
                onChange={(event) => setSeedInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") startNewRun(seedInput);
                }}
                placeholder="leave blank for a random network"
                spellCheck={false}
                autoComplete="off"
                className={`w-full rounded-lg border border-border bg-bg px-3 py-2 font-mono text-sm text-fg placeholder:text-border ${focusRing}`}
              />
              <button
                type="button"
                onClick={() => startNewRun(seedInput)}
                className={`w-full rounded-xl border border-accent-1/50 bg-accent-1/10 py-2.5 font-mono text-sm text-accent-1 transition-colors duration-200 hover:border-accent-1 hover:bg-accent-1/20 ${focusRing}`}
              >
                New run
              </button>
              {state.hasRunSave ? (
                <button
                  type="button"
                  onClick={continueRun}
                  className={`w-full rounded-xl border border-border py-2.5 font-mono text-sm text-fg transition-colors duration-200 hover:border-accent-1/50 hover:text-accent-1 ${focusRing}`}
                >
                  Continue saved run
                </button>
              ) : null}
            </div>

            <ul className="space-y-1 font-mono text-xs text-muted">
              {HELP_LINES.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {state.mode !== "title" ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-sm">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
                <span>
                  <span className="text-fg">
                    {state.run.floor}/5
                  </span>
                  <span className="mx-1.5 text-border">|</span>
                  <span className="text-accent-1">{config?.segment}</span>
                </span>
                <span>
                  {STAT_LABEL.level} <span className="text-fg">{state.run.player.level}</span>
                </span>
                <span>
                  {STAT_LABEL.bounty} <span className="text-accent-2">{state.run.bounty}</span>
                </span>
                <span className="text-border">seed {state.run.seed}</span>
              </div>
              <button
                type="button"
                onClick={abandonRun}
                className={`rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors duration-200 hover:border-accent-1/50 hover:text-fg ${focusRing}`}
              >
                Abandon run
              </button>
            </div>

            <div className="flex flex-wrap gap-4">
              <Meter
                label={STAT_LABEL.integrity}
                value={state.run.player.integrity}
                max={state.run.player.maxIntegrity}
                tone={state.run.player.integrity / state.run.player.maxIntegrity < 0.3 ? "danger" : "ok"}
              />
              <Meter label={STAT_LABEL.cycles} value={state.run.player.cycles} max={state.run.player.maxCycles} tone="ok" />
            </div>

            <div
              ref={containerRef}
              tabIndex={0}
              onKeyDown={onKeyDown}
              aria-label="Dungeon view. Arrow keys or WASD to move, Enter to act."
              className={`rounded-lg border border-border bg-bg p-2 ${focusRing} focus-visible:border-accent-1/50`}
            >
              <canvas
                ref={canvasRef}
                role="img"
                aria-label={canvasLabel}
                style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}`, imageRendering: "pixelated" }}
                className="block w-full rounded"
              />
            </div>
          </>
        ) : null}

        {state.mode === "explore" ? (
          <>
            <p className="font-mono text-xs text-muted">
              Click the view to focus it, then move with arrows or WASD. Walk into a hostile to engage.
            </p>
            <button
              type="button"
              onClick={descend}
              className={`self-start rounded-lg border border-accent-1/40 px-3 py-1.5 font-mono text-xs text-accent-1 transition-colors duration-200 hover:bg-accent-1/10 ${focusRing}`}
            >
              Descend (Enter, on a pivot point)
            </button>
          </>
        ) : null}

        {state.mode === "battle" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <EnemyPanel battle={state.battle} />
            <div className="flex flex-col gap-2">
              {state.battle.outcome === "ongoing" ? (
                battleOrder.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => chooseBattleAction(choice)}
                    aria-pressed={state.battle.cursor === choice}
                    className={`rounded-lg border px-3 py-2 text-left font-mono text-sm transition-colors duration-200 ${focusRing} ${
                      state.battle.cursor === choice
                        ? "border-accent-1 bg-accent-1/15 text-accent-1"
                        : "border-border text-fg hover:border-accent-1/50"
                    }`}
                  >
                    {CHOICE_LABEL[choice]}
                    <span className="ml-2 text-xs text-muted">{CHOICE_HINT[choice]}</span>
                  </button>
                ))
              ) : (
                <button
                  type="button"
                  onClick={advanceBattle}
                  className={`rounded-xl border border-accent-1/50 bg-accent-1/10 py-2.5 font-mono text-sm text-accent-1 transition-colors duration-200 hover:bg-accent-1/20 ${focusRing}`}
                >
                  {state.battle.outcome === "won" ? "Continue" : state.battle.outcome === "fled" ? "Back out" : "…"}
                </button>
              )}
            </div>
          </div>
        ) : null}

        {state.mode === "dead" || state.mode === "victory" ? (
          <div className="rounded-lg border border-border bg-bg p-4">
            <h3 className={`font-mono text-lg ${state.mode === "victory" ? "text-accent-1" : "text-red-400"}`} role="status">
              {state.mode === "victory" ? VICTORY.heading : DEATH.heading}
            </h3>
            <p className="mt-1 text-sm text-muted">{state.mode === "victory" ? VICTORY.body : DEATH.body}</p>
            {state.mode === "dead" ? (
              <p className="mt-1 font-mono text-xs text-muted">Stopped by {state.cause}.</p>
            ) : null}
            <div className="mt-4">
              <RunSummary run={state.run} />
            </div>
            <button
              type="button"
              onClick={dismiss}
              className={`mt-4 rounded-xl border border-accent-1/50 bg-accent-1/10 px-4 py-2 font-mono text-sm text-accent-1 transition-colors duration-200 hover:bg-accent-1/20 ${focusRing}`}
            >
              Back to title
            </button>
          </div>
        ) : null}

        {state.mode !== "title" ? <BattleLog lines={state.mode === "battle" ? state.battle.log : state.run.log} /> : null}
      </div>
    </div>
  );
}
