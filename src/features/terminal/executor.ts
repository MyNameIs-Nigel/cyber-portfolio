import { getCommand } from "@/features/terminal/commandRegistry";
import { writeFileContent, resolvePath } from "@/features/terminal/filesystem";
import { applyAssignment, parseLine } from "@/features/terminal/parser";
import { getScriptHandler } from "@/features/terminal/scripts";
import { saveShellFs } from "@/features/terminal/storage";
import type { CommandResult, ParsedLine, ShellState } from "@/features/terminal/shell.types";

export type ExecuteOutcome = {
  results: CommandResult[];
  persistError: string | null;
  parseError?: string;
  navigate?: { href: string; delayMs: number };
};

const MUTATING = new Set(["mkdir", "touch", "rm", "cd", "echo"]);

function runPathExecution(state: ShellState, cmd: string, argv: string[], stdin: string): CommandResult {
  const resolved = resolvePath(state.fs, state.cwd, cmd);
  if (!resolved.ok) {
    return { stdout: "", stderr: `bash: ${cmd}: No such file or directory\n`, code: 127 };
  }
  if (resolved.node.kind === "dir") {
    return { stdout: "", stderr: `bash: ${cmd}: Is a directory\n`, code: 126 };
  }
  if (!resolved.node.executable) {
    return { stdout: "", stderr: `bash: ${cmd}: Permission denied\n`, code: 126 };
  }

  const script = getScriptHandler(resolved.path);
  if (script) {
    return script({ args: argv.slice(1), stdin, cwd: state.cwd, state });
  }

  const basename = resolved.name;
  const def = getCommand(basename);
  if (def) {
    return def.run({ args: argv.slice(1), stdin, cwd: state.cwd, state });
  }

  return {
    stdout: "",
    stderr: `bash: ${cmd}: cannot execute binary file: Exec format error\n`,
    code: 126,
  };
}

function runSegment(state: ShellState, argv: string[], stdin: string): CommandResult {
  if (!argv.length) return { stdout: "", stderr: "", code: 0 };
  const cmd = argv[0]!;

  if (cmd.includes("/")) {
    return runPathExecution(state, cmd, argv, stdin);
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
  if (cmd.includes("/")) return false;
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
  let navigate: ExecuteOutcome["navigate"];

  for (let i = 0; i < parsed.segments.length; i++) {
    const segment = parsed.segments[i]!;
    const isLast = i === parsed.segments.length - 1;
    let result = runSegment(state, segment.argv, stdin);

    if (result.navigate) {
      navigate = result.navigate;
    }

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
  return { results, persistError, navigate };
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
