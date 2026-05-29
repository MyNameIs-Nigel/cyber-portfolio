import { MAX_LINE_RENDER_LEN } from "@/features/terminal/shell.constants";
import { resolvePath } from "@/features/terminal/filesystem";
import { truncateForDisplay } from "@/features/terminal/sanitize";
import type { CommandDef } from "@/features/terminal/shell.types";

export const catCommand: CommandDef = {
  name: "cat",
  summary: "Concatenate and print files",
  usage: "cat [file…]",
  run: ({ args, stdin, cwd, state }) => {
    if (!args.length) {
      return { stdout: stdin, stderr: "", code: 0 };
    }
    const parts: string[] = [];
    const errors: string[] = [];
    let code = 0;
    for (const p of args) {
      if (p === "-") {
        parts.push(stdin);
        continue;
      }
      const res = resolvePath(state.fs, cwd, p);
      if (!res.ok) {
        errors.push(`cat: ${p}: No such file or directory`);
        code = 1;
        continue;
      }
      if (res.node.kind === "dir") {
        errors.push(`cat: ${p}: Is a directory`);
        code = 1;
        continue;
      }
      parts.push(truncateForDisplay(res.node.content, MAX_LINE_RENDER_LEN));
    }
    const stdout = parts.join("");
    const stderr = errors.length ? `${errors.join("\n")}\n` : "";
    return { stdout, stderr, code };
  },
};
