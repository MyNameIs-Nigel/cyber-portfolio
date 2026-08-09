import { BUILTIN_COMMANDS } from "@/features/terminal/commands/builtins";
import type { CommandDef } from "@/features/terminal/shell.types";

function allCommandsIncludingHelp(): CommandDef[] {
  return [...BUILTIN_COMMANDS, helpCommand];
}

function findCommand(name: string): CommandDef | undefined {
  return allCommandsIncludingHelp().find((c) => c.name === name);
}

export const helpCommand: CommandDef = {
  name: "help",
  summary: "Show available commands",
  usage: "help [command]",
  run: ({ args }) => {
    if (args.length === 0) {
      const names = allCommandsIncludingHelp()
        .filter((c) => !c.hidden)
        .map((c) => c.name);
      const body = ["Commands:", `  ${names.join("  ")}`, "", "help COMMAND"].join("\n");
      return { stdout: `${body}\n`, stderr: "", code: 0 };
    }
    const name = args[0]!;
    const cmd = findCommand(name);
    if (!cmd) {
      return { stdout: "", stderr: `help: no help topics match '${name}'\n`, code: 1 };
    }
    return { stdout: `${cmd.usage}\n`, stderr: "", code: 0 };
  },
};
