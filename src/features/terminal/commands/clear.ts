import type { CommandDef } from "@/features/terminal/shell.types";

export const clearCommand: CommandDef = {
  name: "clear",
  summary: "Clear the terminal scrollback",
  usage: "clear",
  run: () => ({ stdout: "", stderr: "", code: 0, clearScrollback: true }),
};
