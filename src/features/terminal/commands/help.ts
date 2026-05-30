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
      const lines = allCommandsIncludingHelp()
        .filter((c) => !c.hidden)
        .map((c) => `  ${c.name.padEnd(8)} ${c.summary}`);
      const body = ["Available commands:", ...lines, "", "Type 'help <command>' for details."].join("\n");
      return { stdout: `${body}\n`, stderr: "", code: 0 };
    }
    const name = args[0]!;
    const cmd = findCommand(name);
    if (!cmd) {
      return { stdout: "", stderr: `help: no help topics match '${name}'\n`, code: 1 };
    }
    return { stdout: `${cmd.usage}\n\n${cmd.summary}\n`, stderr: "", code: 0 };
  },
};
