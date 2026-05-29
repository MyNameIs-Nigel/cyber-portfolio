import { mkdirPath } from "@/features/terminal/filesystem";
import type { CommandDef } from "@/features/terminal/shell.types";

export const mkdirCommand: CommandDef = {
  name: "mkdir",
  summary: "Create directories",
  usage: "mkdir [-p] dir…",
  run: ({ args, cwd, state }) => {
    const recursive = args[0] === "-p";
    const paths = recursive ? args.slice(1) : args;
    if (!paths.length) {
      return { stdout: "", stderr: "mkdir: missing operand\n", code: 1 };
    }
    let code = 0;
    const errors: string[] = [];
    for (const p of paths) {
      const err = mkdirPath(state.fs, cwd, p, recursive);
      if (err) {
        errors.push(`mkdir: cannot create directory '${p}': ${err.message}`);
        code = 1;
      }
    }
    return { stdout: "", stderr: errors.length ? `${errors.join("\n")}\n` : "", code };
  },
};
