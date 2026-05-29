import { commandNames } from "@/features/terminal/commandRegistry";
import { listDirEntries, resolvePath } from "@/features/terminal/filesystem";
import type { FsDir, ShellState } from "@/features/terminal/shell.types";

export type CompletionResult = {
  value: string;
  options?: string[];
};

function commonPrefix(options: string[]): string {
  if (!options.length) return "";
  let prefix = options[0]!;
  for (const opt of options.slice(1)) {
    let i = 0;
    while (i < prefix.length && i < opt.length && prefix[i] === opt[i]) i++;
    prefix = prefix.slice(0, i);
    if (!prefix) break;
  }
  return prefix;
}

export function completeLine(state: ShellState, line: string, cursor: number): CompletionResult {
  const before = line.slice(0, cursor);
  const tokens = before.split(/\s+/);
  const endsWithSpace = /\s$/.test(before);
  const tokenIndex = endsWithSpace ? tokens.length : Math.max(0, tokens.length - 1);
  const fragment = endsWithSpace ? "" : (tokens[tokenIndex] ?? "");

  if (tokenIndex === 0) {
    const matches = commandNames().filter((n) => n.startsWith(fragment));
    if (!matches.length) return { value: line };
    const prefix = commonPrefix(matches);
    if (prefix.length > fragment.length) {
      const next = `${line.slice(0, cursor - fragment.length)}${prefix}${line.slice(cursor)}`;
      return { value: next, options: matches.length > 1 ? matches : undefined };
    }
    return { value: line, options: matches };
  }

  const showHidden = fragment.startsWith(".");
  let dir: FsDir;
  let partial = fragment;
  if (fragment.includes("/")) {
    const idx = fragment.lastIndexOf("/");
    const dirPart = fragment.slice(0, idx + 1);
    partial = fragment.slice(idx + 1);
    const dirPath = dirPart.endsWith("/") ? dirPart.slice(0, -1) || "." : dirPart;
    const res = resolvePath(state.fs, state.cwd, dirPath || ".");
    if (!res.ok || res.node.kind !== "dir") return { value: line };
    dir = res.node;
  } else {
    const res = resolvePath(state.fs, state.cwd, ".");
    if (!res.ok || res.node.kind !== "dir") return { value: line };
    dir = res.node;
  }

  const entries = listDirEntries(dir, showHidden).map((n) => (n.kind === "dir" ? `${n.name}/` : n.name));
  const matches = entries.filter((n) => n.startsWith(partial));
  if (!matches.length) return { value: line };
  const prefix = commonPrefix(matches);
  if (prefix.length > partial.length) {
    const start = cursor - partial.length;
    const next = `${line.slice(0, start)}${prefix}${line.slice(cursor)}`;
    return { value: next, options: matches.length > 1 ? matches : undefined };
  }
  return { value: line, options: matches };
}
