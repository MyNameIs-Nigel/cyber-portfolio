import { getCommand } from "@/features/terminal/commandRegistry";
import { writeFileContent } from "@/features/terminal/filesystem";
import { applyAssignment, parseLine } from "@/features/terminal/parser";
import { saveShellFs } from "@/features/terminal/storage";
import type { CommandResult, ParsedLine, ShellState } from "@/features/terminal/shell.types";

export type ExecuteOutcome = {
  results: CommandResult[];
  persistError: string | null;
  parseError?: string;
};

const MUTATING = new Set(["mkdir", "touch", "rm", "cd", "echo"]);

function runSegment(state: ShellState, argv: string[], stdin: string): CommandResult {
  if (!argv.length) return { stdout: "", stderr: "", code: 0 };
  const cmd = argv[0]!;
  if (cmd === "sudo") {
    return { stdout: "", stderr: "Nice try. This incident will be reported. 🙂\n", code: 1 };
  }
  const def = getCommand(cmd);
  if (!def) {
    return { stdout: "", stderr: `bash: ${cmd}: command not found\n`, code: 127 };
  }
  return def.run({ args: argv.slice(1), stdin, cwd: state.cwd, state });
}

function segmentMutates(argv: string[], hasRedirect: boolean): boolean {
  const cmd = argv[0];
  if (!cmd) return false;
  if (hasRedirect) return true;
  return MUTATING.has(cmd);
}

export function executeParsedLine(state: ShellState, parsed: ParsedLine): ExecuteOutcome {
  if (parsed.kind === "assignment") {
    const err = applyAssignment(state.vars, parsed);
    if (err) {
      return { results: [{ stdout: "", stderr: `${err.message}\n`, code: 1 }], persistError: null };
    }
    return { results: [], persistError: null };
  }

  const results: CommandResult[] = [];
  let stdin = "";
  let mutated = false;
  let exitCode = 0;

  for (let i = 0; i < parsed.segments.length; i++) {
    const segment = parsed.segments[i]!;
    const isLast = i === parsed.segments.length - 1;
    let result = runSegment(state, segment.argv, stdin);

    if (result.clearScrollback) {
      state.scrollback = [];
    }

    if (segment.redirect && result.stdout.length > 0) {
      const err = writeFileContent(
        state.fs,
        state.cwd,
        segment.redirect.target,
        result.stdout,
        segment.redirect.mode === ">>",
      );
      if (err) {
        result = { stdout: "", stderr: `${segment.redirect.target}: ${err.message}\n`, code: 1 };
      } else {
        mutated = true;
        result = { stdout: "", stderr: result.stderr, code: result.code };
      }
    }

    if (result.stderr) {
      results.push({ stdout: "", stderr: result.stderr, code: result.code });
    }

    exitCode = result.code;
    stdin = segment.redirect ? "" : result.stdout;

    if (isLast && !segment.redirect && result.stdout) {
      results.push({ stdout: result.stdout, stderr: "", code: result.code });
    }

    if (segmentMutates(segment.argv, Boolean(segment.redirect))) {
      mutated = true;
    }
  }

  const persistError = mutated ? saveShellFs(state) : null;
  if (persistError) {
    results.push({ stdout: "", stderr: `${persistError}\n`, code: 1 });
  }

  void exitCode;
  return { results, persistError };
}

export function runShellLine(state: ShellState, raw: string): ExecuteOutcome {
  const parsed = parseLine(raw, state.vars);
  if ("message" in parsed) {
    return {
      results: [{ stdout: "", stderr: `${parsed.message}\n`, code: 2 }],
      persistError: null,
      parseError: parsed.message,
    };
  }
  return executeParsedLine(state, parsed);
}
