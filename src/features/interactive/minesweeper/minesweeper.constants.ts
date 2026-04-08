import type { BoardConfig, MinesweeperDifficulty } from "@/features/interactive/minesweeper/minesweeper.types";

export const DIFFICULTY_PRESETS: Record<MinesweeperDifficulty, BoardConfig> = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
};

export const DIFFICULTY_LABELS: Record<MinesweeperDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

/** Matches the largest (hard) board + chrome so difficulty pick and play share the same frame. */
export const PLAY_SHELL_MIN_HEIGHT_PX = 600;
