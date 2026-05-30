import type { CommandCtx, CommandResult } from "@/features/terminal/shell.types";

const RESUME_SH_PATH = "/home/guest/resume.sh";

const RESUME_SH_STDOUT = `Fetching résumé from https://nigelsmith.dev/resume.pdf ...
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  248k  100  248k    0     0   612k      0 --:--:-- --:--:-- --:--:--  611k
Saved to /home/guest/Downloads/nigel-smith-resume.pdf
Opening https://nigelsmith.dev ↗
`;

function runResumeSh(): CommandResult {
  return {
    stdout: `${RESUME_SH_STDOUT}\n`,
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
