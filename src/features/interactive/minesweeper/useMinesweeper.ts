"use client";

import type { MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DIFFICULTY_PRESETS } from "@/features/interactive/minesweeper/minesweeper.constants";
import type { BoardConfig, Cell, GamePhase, MinesweeperDifficulty } from "@/features/interactive/minesweeper/minesweeper.types";

function key(r: number, c: number) {
  return `${r},${c}`;
}

function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function createEmptyBoard(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacent: -1,
    })),
  );
}

function inBounds(r: number, c: number, rows: number, cols: number) {
  return r >= 0 && r < rows && c >= 0 && c < cols;
}

function neighbors8(r: number, c: number, rows: number, cols: number): [number, number][] {
  const out: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc, rows, cols)) out.push([nr, nc]);
    }
  }
  return out;
}

function placeMinesAndComputeAdjacency(board: Cell[][], mineCount: number, safeR: number, safeC: number) {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const forbidden = new Set<string>();
  forbidden.add(key(safeR, safeC));
  for (const [nr, nc] of neighbors8(safeR, safeC, rows, cols)) {
    forbidden.add(key(nr, nc));
  }

  const positions: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!forbidden.has(key(r, c))) positions.push([r, c]);
    }
  }

  const maxMines = positions.length;
  const n = Math.min(mineCount, maxMines);
  shuffleInPlace(positions);
  const chosen = positions.slice(0, n);

  for (const [r, c] of chosen) {
    board[r][c].isMine = true;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isMine) {
        board[r][c].adjacent = 0;
        continue;
      }
      let count = 0;
      for (const [nr, nc] of neighbors8(r, c, rows, cols)) {
        if (board[nr][nc].isMine) count++;
      }
      board[r][c].adjacent = count;
    }
  }
}

function countFlags(board: Cell[][]) {
  let n = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.isFlagged) n++;
    }
  }
  return n;
}

function countRevealed(board: Cell[][]) {
  let n = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.isRevealed) n++;
    }
  }
  return n;
}

function countMines(board: Cell[][]) {
  let n = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.isMine) n++;
    }
  }
  return n;
}

/** Before first placement all cells have `adjacent === -1`; after placement every cell has a computed count. */
function minesArePlaced(board: Cell[][]) {
  return board.some((row) => row.some((c) => c.adjacent >= 0));
}

function revealAllMines(board: Cell[][]) {
  for (const row of board) {
    for (const cell of row) {
      if (cell.isMine) cell.isRevealed = true;
    }
  }
}

export function useMinesweeper() {
  const [phase, setPhase] = useState<GamePhase>("pick-difficulty");
  const [difficulty, setDifficulty] = useState<MinesweeperDifficulty | null>(null);
  const [board, setBoard] = useState<Cell[][] | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  const config: BoardConfig | null = useMemo(
    () => (difficulty ? DIFFICULTY_PRESETS[difficulty] : null),
    [difficulty],
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const startTimer = useCallback(() => {
    clearTimer();
    setTimerSeconds(0);
    timerRef.current = setInterval(() => {
      setTimerSeconds((s) => s + 1);
    }, 1000);
  }, [clearTimer]);

  const stopTimer = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const pickDifficulty = useCallback(
    (d: MinesweeperDifficulty) => {
      const { rows, cols } = DIFFICULTY_PRESETS[d];
      setDifficulty(d);
      setBoard(createEmptyBoard(rows, cols));
      setPhase("playing");
      setTimerSeconds(0);
      clearTimer();
    },
    [clearTimer],
  );

  const restartSameDifficulty = useCallback(() => {
    if (!difficulty) return;
    const { rows, cols } = DIFFICULTY_PRESETS[difficulty];
    setBoard(createEmptyBoard(rows, cols));
    setPhase("playing");
    setTimerSeconds(0);
    clearTimer();
  }, [difficulty, clearTimer]);

  const backToDifficultyPicker = useCallback(() => {
    setDifficulty(null);
    setBoard(null);
    setPhase("pick-difficulty");
    setTimerSeconds(0);
    clearTimer();
  }, [clearTimer]);

  const revealCell = useCallback(
    (r: number, c: number) => {
      if (phase !== "playing" || !board || !config) return;

      const cell = board[r][c];
      if (cell.isFlagged || cell.isRevealed) return;

      const next = board.map((row) => row.map((x) => ({ ...x })));

      if (!minesArePlaced(board)) {
        placeMinesAndComputeAdjacency(next, config.mines, r, c);
        startTimer();
      }

      const target = next[r][c];
      if (target.isMine) {
        revealAllMines(next);
        setBoard(next);
        setPhase("lost");
        stopTimer();
        return;
      }

      const stack: [number, number][] = [[r, c]];
      while (stack.length) {
        const [cr, cc] = stack.pop()!;
        const cur = next[cr][cc];
        if (cur.isRevealed || cur.isFlagged) continue;
        if (cur.isMine) continue;
        cur.isRevealed = true;
        if (cur.adjacent === 0) {
          for (const [nr, nc] of neighbors8(cr, cc, next.length, next[0].length)) {
            const neighbor = next[nr][nc];
            if (!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isMine) {
              stack.push([nr, nc]);
            }
          }
        }
      }

      const revealed = countRevealed(next);
      const mineTotal = countMines(next);
      const safeCells = config.rows * config.cols - mineTotal;
      if (revealed >= safeCells) {
        setPhase("won");
        stopTimer();
        for (const row of next) {
          for (const x of row) {
            if (x.isMine && !x.isFlagged) x.isFlagged = true;
          }
        }
      }

      setBoard(next);
    },
    [board, config, phase, startTimer, stopTimer],
  );

  const toggleFlag = useCallback(
    (r: number, c: number) => {
      if (phase !== "playing" || !board || !config) return;
      const cell = board[r][c];
      if (cell.isRevealed) return;

      const maxFlags = minesArePlaced(board) ? countMines(board) : config.mines;
      const flags = countFlags(board);
      const next = board.map((row) => row.map((x) => ({ ...x })));
      const t = next[r][c];
      if (!t.isFlagged && flags >= maxFlags) return;
      t.isFlagged = !t.isFlagged;
      setBoard(next);
    },
    [board, config, phase],
  );

  const onCellContextMenu = useCallback(
    (e: MouseEvent, r: number, c: number) => {
      e.preventDefault();
      toggleFlag(r, c);
    },
    [toggleFlag],
  );

  const flagCount =
    board && config
      ? Math.max(0, (minesArePlaced(board) ? countMines(board) : config.mines) - countFlags(board))
      : 0;

  return {
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
    toggleFlag,
    onCellContextMenu,
  };
}
