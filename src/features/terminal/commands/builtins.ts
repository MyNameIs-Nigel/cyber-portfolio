import { catCommand } from "@/features/terminal/commands/cat";
import { cdCommand } from "@/features/terminal/commands/cd";
import { clearCommand } from "@/features/terminal/commands/clear";
import { echoCommand } from "@/features/terminal/commands/echo";
import { lsCommand } from "@/features/terminal/commands/ls";
import { mkdirCommand } from "@/features/terminal/commands/mkdir";
import { pwdCommand } from "@/features/terminal/commands/pwd";
import { rmCommand } from "@/features/terminal/commands/rm";
import { sudoCommand } from "@/features/terminal/commands/sudo";
import { touchCommand } from "@/features/terminal/commands/touch";
import { whoamiCommand } from "@/features/terminal/commands/whoami";
import type { CommandDef } from "@/features/terminal/shell.types";

/** All commands except `help` (avoids circular imports with commandRegistry). */
export const BUILTIN_COMMANDS: CommandDef[] = [
  pwdCommand,
  echoCommand,
  clearCommand,
  lsCommand,
  cdCommand,
  mkdirCommand,
  touchCommand,
  catCommand,
  rmCommand,
  sudoCommand,
  whoamiCommand,
];
