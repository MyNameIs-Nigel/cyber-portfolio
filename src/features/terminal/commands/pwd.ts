import type { CommandDef } from "@/features/terminal/shell.types";

export const pwdCommand: CommandDef = {
  name: "pwd",
  summary: "Print working directory",
  usage: "pwd",
  run: ({ cwd }) => ({ stdout: `${cwd}\n`, stderr: "", code: 0 }),
};
