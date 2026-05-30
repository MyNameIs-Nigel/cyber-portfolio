import { ALL_COMMANDS } from "@/features/terminal/commands/index";
import type { CommandDef } from "@/features/terminal/shell.types";

const byName = new Map(ALL_COMMANDS.map((c) => [c.name, c]));

export function allCommands(): CommandDef[] {
  return [...ALL_COMMANDS];
}

export function listCommands(): CommandDef[] {
  return ALL_COMMANDS.filter((c) => !c.hidden);
}

export function getCommand(name: string): CommandDef | undefined {
  return byName.get(name);
}

export function commandNames(): string[] {
  return listCommands().map((c) => c.name);
}
