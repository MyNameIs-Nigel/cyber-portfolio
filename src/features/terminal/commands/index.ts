import { BUILTIN_COMMANDS } from "@/features/terminal/commands/builtins";
import { helpCommand } from "@/features/terminal/commands/help";
import type { CommandDef } from "@/features/terminal/shell.types";

export const ALL_COMMANDS: CommandDef[] = [...BUILTIN_COMMANDS, helpCommand];
