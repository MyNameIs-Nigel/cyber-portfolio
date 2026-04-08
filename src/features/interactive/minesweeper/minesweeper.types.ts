export type MinesweeperDifficulty = "easy" | "medium" | "hard";

export type GamePhase = "pick-difficulty" | "playing" | "won" | "lost";

export interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  /** -1 until mines are placed */
  adjacent: number;
}

export interface BoardConfig {
  rows: number;
  cols: number;
  mines: number;
}
