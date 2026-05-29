import { touchFile } from "@/features/terminal/filesystem";
import type { CommandDef } from "@/features/terminal/shell.types";

export const touchCommand: CommandDef = {
  name: "touch",
  summary: "Create empty files or update timestamps",
  usage: "touch file…",
  run: ({ args, cwd, state }) => {
    if (!args.length) {
      return { stdout: "", stderr: "touch: missing file operand\n", code: 1 };
    }
    let code = 0;
    const errors: string[] = [];
    for (const p of args) {
      const err = touchFile(state.fs, cwd, p);
      if (err) {
        const reason =
          err.message === "Permission denied"
            ? "Permission denied"
            : err.message === "No such file or directory"
              ? "No such file or directory"
              : err.message;
        errors.push(`touch: cannot touch '${p}': ${reason}`);
        code = 1;
      }
    }
    return { stdout: "", stderr: errors.length ? `${errors.join("\n")}\n` : "", code };
  },
};
