import { getCommand, listCommands } from "@/features/terminal/commandRegistry";
import type { CommandDef } from "@/features/terminal/shell.types";

export const helpCommand: CommandDef = {
  name: "help",
  summary: "Show available commands",
  usage: "help [command]",
  run: ({ args }) => {
    if (args.length === 0) {
      const lines = listCommands().map((c) => `  ${c.name.padEnd(8)} ${c.summary}`);
      const body = [
        "Available commands:",
        ...lines,
        "",
        "Operators: > >> |",
        "",
        "Simulated shell — nothing here is real or executed.",
      ].join("\n");
      return { stdout: `${body}\n`, stderr: "", code: 0 };
    }
    const name = args[0]!;
    const cmd = getCommand(name);
    if (!cmd) {
      return { stdout: "", stderr: `help: no help topics match '${name}'\n`, code: 1 };
    }
    return { stdout: `${cmd.usage}\n\n${cmd.summary}\n`, stderr: "", code: 0 };
  },
};
