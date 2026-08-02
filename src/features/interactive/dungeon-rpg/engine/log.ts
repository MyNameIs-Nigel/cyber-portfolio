import { MAX_LOG_LINES } from "@/features/interactive/dungeon-rpg/dungeon-rpg.constants";

/**
 * Appends to a log, oldest-first, keeping only the last `MAX_LOG_LINES`. Bounded so a long
 * run can't grow state without limit. Returns a new array; the input is untouched.
 */
export function appendLog(log: readonly string[], ...lines: string[]): string[] {
  const next = [...log, ...lines];
  return next.length > MAX_LOG_LINES ? next.slice(next.length - MAX_LOG_LINES) : next;
}
