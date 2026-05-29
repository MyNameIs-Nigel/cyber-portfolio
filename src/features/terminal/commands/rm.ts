import { removePath } from "@/features/terminal/filesystem";
import type { CommandDef } from "@/features/terminal/shell.types";

export const rmCommand: CommandDef = {
  name: "rm",
  summary: "Remove files or directories",
  usage: "rm [-rf] target…",
  run: ({ args, cwd, state }) => {
    let recursive = false;
    let force = false;
    const paths: string[] = [];
    for (const arg of args) {
      if (arg.startsWith("-")) {
        if (arg.includes("r") || arg.includes("R")) recursive = true;
        if (arg.includes("f")) force = true;
      } else {
        paths.push(arg);
      }
    }
    if (!paths.length) {
      return { stdout: "", stderr: "rm: missing operand\n", code: 1 };
    }
    let code = 0;
    const errors: string[] = [];
    let cheeky = false;
    for (const p of paths) {
      if (p === "/" || p === "/*") cheeky = recursive && force;
      const err = removePath(state.fs, cwd, p, recursive, force);
      if (err) {
        const reason =
          err.message === "Is a directory"
            ? "Is a directory"
            : err.message === "Permission denied"
              ? "Permission denied"
              : "No such file or directory";
        errors.push(`rm: cannot remove '${p}': ${reason}`);
        code = 1;
      }
    }
    const extra = cheeky ? "Nice try. The base image survives.\n" : "";
    return {
      stdout: extra,
      stderr: errors.length ? `${errors.join("\n")}\n` : "",
      code,
    };
  },
};
