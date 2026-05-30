import type { CommandDef } from "@/features/terminal/shell.types";

export const whoamiCommand: CommandDef = {
  name: "whoami",
  hidden: true,
  summary: "Print effective user name",
  usage: "whoami",
  run: () => ({ stdout: "guest\n", stderr: "", code: 0 }),
};
