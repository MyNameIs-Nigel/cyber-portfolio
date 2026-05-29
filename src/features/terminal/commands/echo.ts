import { MAX_LINE_RENDER_LEN } from "@/features/terminal/shell.constants";
import { truncateForDisplay } from "@/features/terminal/sanitize";
import type { CommandDef } from "@/features/terminal/shell.types";

export const echoCommand: CommandDef = {
  name: "echo",
  summary: "Print arguments",
  usage: "echo [-n] [args…]",
  run: ({ args }) => {
    const noNewline = args[0] === "-n";
    const rest = noNewline ? args.slice(1) : args;
    const text = rest.join(" ");
    const out = truncateForDisplay(text, MAX_LINE_RENDER_LEN);
    return { stdout: noNewline ? out : `${out}\n`, stderr: "", code: 0 };
  },
};
