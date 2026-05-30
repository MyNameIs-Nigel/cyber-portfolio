import type { CommandDef } from "@/features/terminal/shell.types";

export const sudoCommand: CommandDef = {
  name: "sudo",
  hidden: true,
  summary: "Execute a command as another user",
  usage: "sudo COMMAND [ARGS...]",
  run: () => ({
    stdout: "",
    stderr: "Nice try. This incident will be reported. 🙂\n",
    code: 1,
  }),
};
