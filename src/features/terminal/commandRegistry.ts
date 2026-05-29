import { catCommand } from "@/features/terminal/commands/cat";
import { cdCommand } from "@/features/terminal/commands/cd";
import { clearCommand } from "@/features/terminal/commands/clear";
import { echoCommand } from "@/features/terminal/commands/echo";
import { helpCommand } from "@/features/terminal/commands/help";
import { lsCommand } from "@/features/terminal/commands/ls";
import { mkdirCommand } from "@/features/terminal/commands/mkdir";
import { pwdCommand } from "@/features/terminal/commands/pwd";
import { rmCommand } from "@/features/terminal/commands/rm";
import { touchCommand } from "@/features/terminal/commands/touch";
import type { CommandDef } from "@/features/terminal/shell.types";

const COMMANDS: CommandDef[] = [
  pwdCommand,
  echoCommand,
  clearCommand,
  helpCommand,
  lsCommand,
  cdCommand,
  mkdirCommand,
  touchCommand,
  catCommand,
  rmCommand,
];

const byName = new Map(COMMANDS.map((c) => [c.name, c]));

export function listCommands(): CommandDef[] {
  return [...COMMANDS];
}

export function getCommand(name: string): CommandDef | undefined {
  return byName.get(name);
}

export function commandNames(): string[] {
  return COMMANDS.map((c) => c.name);
}
