import { HOME } from "@/features/terminal/shell.constants";
import { normalizePath, resolvePath } from "@/features/terminal/filesystem";
import type { CommandDef } from "@/features/terminal/shell.types";

export const cdCommand: CommandDef = {
  name: "cd",
  summary: "Change directory",
  usage: "cd [dir]",
  run: ({ args, cwd, state }) => {
    let target = args[0] ?? HOME;
    if (target === "-") {
      const prev = state.oldpwd;
      state.cwd = prev;
      state.vars.set("PWD", prev);
      state.vars.set("OLDPWD", cwd);
      return { stdout: `${prev}\n`, stderr: "", code: 0 };
    }
    if (!args.length || target === "~") target = HOME;
    const path = normalizePath(cwd, target);
    const res = resolvePath(state.fs, "/", path);
    if (!res.ok) {
      return { stdout: "", stderr: `cd: ${args[0] ?? target}: No such file or directory\n`, code: 1 };
    }
    if (res.node.kind !== "dir") {
      return { stdout: "", stderr: `cd: ${args[0]}: Not a directory\n`, code: 1 };
    }
    state.oldpwd = cwd;
    state.cwd = path;
    state.vars.set("PWD", path);
    state.vars.set("OLDPWD", cwd);
    return { stdout: "", stderr: "", code: 0 };
  },
};
