import { tokenize, type ParseError } from "@/features/terminal/parser";
import { resolvePath } from "@/features/terminal/filesystem";
import {
  HOME,
  MAX_ALIAS_DEPTH,
  MAX_ALIAS_NAME_LEN,
  MAX_ALIAS_VALUE_LEN,
  MAX_ALIASES,
  MAX_ARG_COUNT,
  RESERVED_NAMES,
} from "@/features/terminal/shell.constants";
import type { FsDir } from "@/features/terminal/shell.types";

const ALIAS_NAME_RE = /^[A-Za-z0-9_.-]+$/;
const ALIAS_LINE_RE = /^alias\s+([A-Za-z0-9_.-]+)=(.*)$/;

export function isValidAliasName(name: string): boolean {
  if (!name || name.length > MAX_ALIAS_NAME_LEN) return false;
  if (RESERVED_NAMES.has(name)) return false;
  return ALIAS_NAME_RE.test(name);
}

export function formatAlias(name: string, value: string): string {
  const escaped = value.replace(/'/g, `'\\''`);
  return `alias ${name}='${escaped}'`;
}

function stripValueQuotes(raw: string): string {
  if (raw.length >= 2) {
    const start = raw[0];
    const end = raw[raw.length - 1];
    if ((start === "'" && end === "'") || (start === '"' && end === '"')) {
      return raw.slice(1, -1);
    }
  }
  return raw;
}

/** Parse `alias name='value'` lines (as in ~/.bashrc). Comments and other lines are ignored. */
export function parseAliasFile(content: string): Map<string, string> {
  const aliases = new Map<string, string>();
  for (const rawLine of content.split("\n")) {
    if (aliases.size >= MAX_ALIASES) break;
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(ALIAS_LINE_RE);
    if (!match) continue;
    const name = match[1]!;
    const value = stripValueQuotes(match[2] ?? "");
    if (!isValidAliasName(name)) continue;
    if (value.length > MAX_ALIAS_VALUE_LEN) continue;
    aliases.set(name, value);
  }
  return aliases;
}

export function loadAliasesFromFs(fs: FsDir): Map<string, string> {
  const res = resolvePath(fs, "/", `${HOME}/.bashrc`);
  if (!res.ok || res.node.kind !== "file") return new Map();
  return parseAliasFile(res.node.content);
}

export function setAlias(
  aliases: Map<string, string>,
  name: string,
  value: string,
): ParseError | null {
  if (!isValidAliasName(name)) {
    return { message: `alias: \`${name}': invalid alias name` };
  }
  if (value.length > MAX_ALIAS_VALUE_LEN) {
    return { message: "alias: value too long" };
  }
  if (aliases.size >= MAX_ALIASES && !aliases.has(name)) {
    return { message: "alias: too many aliases" };
  }
  aliases.set(name, value);
  return null;
}

/**
 * Expand the first word of argv through aliases (bash-style, first-word only).
 * Recursion is blocked by not expanding a name already on the replacement chain
 * (`alias ls='ls -l'` therefore still runs `ls`).
 */
export function expandAliasArgv(
  argv: string[],
  aliases: Map<string, string>,
): string[] | ParseError {
  if (!argv.length || aliases.size === 0) return argv;

  const expanding = new Set<string>();
  let current = argv;
  let depth = 0;

  while (current[0] && aliases.has(current[0]!) && !expanding.has(current[0]!)) {
    if (depth >= MAX_ALIAS_DEPTH) {
      return { message: "alias expansion too deep" };
    }
    depth += 1;
    const name = current[0]!;
    expanding.add(name);
    const body = aliases.get(name) ?? "";
    const bodyTokens = tokenize(body);
    if ("message" in bodyTokens) return bodyTokens;
    current = [...bodyTokens, ...current.slice(1)];
    if (current.length > MAX_ARG_COUNT) {
      return { message: "too many arguments" };
    }
  }

  return current;
}
