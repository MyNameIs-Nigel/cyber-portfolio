import type { CommandCtx, CommandResult } from "@/features/terminal/shell.types";
import { renderCareerSummary } from "@/data/careerText";

const RESUME_SH_PATH = "/home/guest/resume.sh";

function runResumeSh(): CommandResult {
  return {
    stdout: `${renderCareerSummary()}\nOpening the portfolio homepage…\n`,
    stderr: "",
    code: 0,
    navigate: { href: "/", delayMs: 1200 },
  };
}

export const SCRIPT_HANDLERS = new Map<string, (ctx: CommandCtx) => CommandResult>([
  [RESUME_SH_PATH, () => runResumeSh()],
]);

export function getScriptHandler(absolutePath: string): ((ctx: CommandCtx) => CommandResult) | undefined {
  return SCRIPT_HANDLERS.get(absolutePath);
}
