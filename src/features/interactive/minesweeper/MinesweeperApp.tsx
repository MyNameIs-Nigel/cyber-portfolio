"use client";

import type { CSSProperties } from "react";
import { DIFFICULTY_LABELS, PLAY_SHELL_MIN_HEIGHT_PX } from "@/features/interactive/minesweeper/minesweeper.constants";
import type { MinesweeperDifficulty } from "@/features/interactive/minesweeper/minesweeper.types";
import { useMinesweeper } from "@/features/interactive/minesweeper/useMinesweeper";

const difficulties: MinesweeperDifficulty[] = ["easy", "medium", "hard"];

function adjacentTextClass(n: number) {
  switch (n) {
    case 1:
      return "text-accent-4";
    case 2:
      return "text-accent-1";
    case 3:
      return "text-accent-2";
    case 4:
      return "text-accent-3";
    case 5:
      return "text-red-400";
    case 6:
      return "text-sky-300";
    case 7:
      return "text-fg";
    case 8:
      return "text-muted";
    default:
      return "text-fg";
  }
}

export function MinesweeperApp() {
  const {
    phase,
    difficulty,
    board,
    config,
    timerSeconds,
    flagCount,
    pickDifficulty,
    restartSameDifficulty,
    backToDifficultyPicker,
    revealCell,
    onCellContextMenu,
  } = useMinesweeper();

  const cols = config?.cols ?? 0;

  const playAreaSurfaceClass =
    phase === "lost"
      ? "bg-red-500/25 border-red-500/40"
      : phase === "won"
        ? "bg-accent-1/20 border-accent-1/35"
        : "bg-bg border-border";

  const shellStyle = { minHeight: PLAY_SHELL_MIN_HEIGHT_PX } as const;

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border py-3 text-center font-mono text-sm text-muted">
        <span className="text-accent-1">&gt;</span> minesweeper.exe
      </div>

      <div className="flex flex-col p-5" style={shellStyle}>
        {phase === "pick-difficulty" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-2">
            <p className="text-center font-mono text-sm text-muted">Select difficulty to start.</p>
            <div className="flex w-full max-w-xs flex-col items-stretch gap-3">
              {difficulties.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => pickDifficulty(d)}
                  className="w-full rounded-xl border border-accent-1/50 bg-accent-1/10 py-2.5 text-center font-mono text-sm text-accent-1 transition-colors duration-200 hover:border-accent-1 hover:bg-accent-1/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-1 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  {DIFFICULTY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {phase !== "pick-difficulty" && board && config ? (
          <div className="flex flex-1 flex-col space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-sm">
              <div className="flex flex-wrap items-center gap-3 text-muted">
                <span>
                  <span className="text-fg">{DIFFICULTY_LABELS[difficulty!]}</span>
                  <span className="mx-1.5 text-border">|</span>
                  {config.rows}×{config.cols}
                  <span className="mx-1.5 text-border">|</span>
                  {config.mines} mines
                </span>
                <span>
                  flags: <span className="text-accent-1">{flagCount}</span>
                </span>
                <span>
                  time: <span className="text-fg">{timerSeconds}s</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={restartSameDifficulty}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-fg transition-colors duration-200 hover:border-accent-1/50 hover:text-accent-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-1 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  Restart
                </button>
                <button
                  type="button"
                  onClick={backToDifficultyPicker}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors duration-200 hover:border-accent-1/50 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-1 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  Difficulty
                </button>
              </div>
            </div>

            {(phase === "won" || phase === "lost") && (
              <p
                className={`font-mono text-sm ${phase === "won" ? "text-accent-1" : "text-red-500"}`}
                role="status"
                aria-live="polite"
              >
                {phase === "won" ? "[ OK ] Cleared — all safe cells revealed." : "[ FAIL ] Mine detonated — board exposed."}
              </p>
            )}

            <p className="font-mono text-xs text-muted">Left-click: reveal · Right-click: flag · First reveal is always safe.</p>

            <div
              className={`w-full min-w-0 overflow-x-auto rounded-lg border p-2 transition-colors duration-300 ${playAreaSurfaceClass}`}
            >
              <div
                className="grid w-full gap-px bg-border"
                style={
                  {
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  } as CSSProperties
                }
              >
                {board.map((row, r) =>
                  row.map((cell, c) => {
                    const isInteractive = phase === "playing";
                    const showMine = cell.isMine && (cell.isRevealed || phase === "lost");
                    const showNumber = cell.isRevealed && !cell.isMine && cell.adjacent > 0;

                    let label: string | null = null;
                    if (cell.isFlagged && !cell.isRevealed) label = "⚑";
                    else if (showMine) label = "●";
                    else if (cell.isRevealed && !cell.isMine && cell.adjacent === 0) label = "";
                    else if (showNumber) label = String(cell.adjacent);

                    const revealedStyle = cell.isRevealed && !cell.isMine ? "bg-surface" : "bg-bg";
                    const mineHit = phase === "lost" && cell.isMine && cell.isRevealed;

                    return (
                      <button
                        key={`${r}-${c}`}
                        type="button"
                        disabled={!isInteractive}
                        aria-label={
                          cell.isRevealed
                            ? cell.isMine
                              ? "Mine"
                              : cell.adjacent
                                ? `${cell.adjacent} adjacent mines`
                                : "Empty"
                            : cell.isFlagged
                              ? "Flagged"
                              : "Hidden"
                        }
                        onClick={() => revealCell(r, c)}
                        onContextMenu={(e) => onCellContextMenu(e, r, c)}
                        className={[
                          "flex aspect-square min-h-0 min-w-0 w-full max-w-full items-center justify-center border border-transparent font-mono text-[clamp(0.65rem,2.8vmin,0.875rem)] font-semibold tabular-nums transition-colors duration-150 sm:text-sm",
                          revealedStyle,
                          mineHit ? "bg-red-500/20 text-red-500" : "",
                          !cell.isRevealed && !cell.isMine ? "hover:border-accent-1/40" : "",
                          !isInteractive ? "cursor-default opacity-90" : "cursor-pointer",
                          showNumber ? adjacentTextClass(cell.adjacent) : "",
                          cell.isFlagged && !cell.isRevealed ? "text-accent-2" : "",
                          showMine && !mineHit ? "text-red-500" : "",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-1 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {label}
                      </button>
                    );
                  }),
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
