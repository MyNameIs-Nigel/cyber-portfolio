import {
  MAX_ARG_COUNT,
  MAX_EXPANDED_LEN,
  MAX_PIPE_SEGMENTS,
  MAX_VAR_LEN,
  MAX_VARS,
} from "@/features/terminal/shell.constants";
import { sanitizeInput } from "@/features/terminal/sanitize";
import type { ParsedAssignment, ParsedLine, ParsedPipeline, PipelineSegment } from "@/features/terminal/shell.types";

const ASSIGN_RE = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/;

export type ParseError = { message: string };

export function tokenize(line: string): string[] | ParseError {
  const tokens: string[] = [];
  let i = 0;
  let current = "";
  let quote: "'" | '"' | null = null;

  const push = () => {
    if (current.length > 0) {
      tokens.push(current);
      current = "";
    }
  };

  while (i < line.length) {
    const ch = line[i]!;
    if (quote === "'") {
      if (ch === "'") {
        quote = null;
        i++;
        continue;
      }
      current += ch;
      i++;
      continue;
    }
    if (quote === '"') {
      if (ch === '"') {
        quote = null;
        i++;
        continue;
      }
      if (ch === "$" && line[i + 1] === "{") {
        const end = line.indexOf("}", i + 2);
        if (end === -1) return { message: "unexpected EOF while looking for matching quote" };
        current += line.slice(i, end + 1);
        i = end + 1;
        continue;
      }
      if (ch === "$") {
        const m = line.slice(i).match(/^\$[A-Za-z_][A-Za-z0-9_]*/);
        if (m) {
          current += m[0];
          i += m[0].length;
          continue;
        }
      }
      current += ch;
      i++;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      i++;
      continue;
    }
    if (/\s/.test(ch)) {
      push();
      i++;
      continue;
    }
    if (ch === "$" && line[i + 1] === "{") {
      const end = line.indexOf("}", i + 2);
      if (end === -1) return { message: "unexpected EOF while looking for matching quote" };
      current += line.slice(i, end + 1);
      i = end + 1;
      continue;
    }
    if (ch === "$") {
      const m = line.slice(i).match(/^\$[A-Za-z_][A-Za-z0-9_]*/);
      if (m) {
        current += m[0];
        i += m[0].length;
        continue;
      }
    }
    current += ch;
    i++;
  }

  if (quote) return { message: "unexpected EOF while looking for matching quote" };
  push();
  if (tokens.length > MAX_ARG_COUNT) return { message: "too many arguments" };
  return tokens;
}

export function expandVariables(line: string, vars: Map<string, string>, inSingleQuote = false): string {
  if (inSingleQuote) return line;
  return line.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, braced, plain) => {
    const name = braced ?? plain;
    return vars.get(name) ?? "";
  });
}

function expandTokens(tokens: string[], vars: Map<string, string>): string[] {
  return tokens.map((t) => expandVariables(t, vars));
}

function extractRedirect(argv: string[]): { argv: string[]; redirect?: PipelineSegment["redirect"] } {
  const out = [...argv];
  let redirect: PipelineSegment["redirect"];
  for (let i = out.length - 1; i >= 0; i--) {
    const tok = out[i]!;
    if (tok === ">" || tok === ">>") {
      if (redirect) return { argv: out, redirect: undefined };
      const target = out[i + 1];
      if (!target) return { argv: out };
      redirect = { mode: tok, target };
      out.splice(i, 2);
      break;
    }
  }
  if (out.filter((t) => t === ">" || t === ">>").length > 0) {
    return { argv: out };
  }
  return { argv: out, redirect };
}

export function parseLine(raw: string, vars: Map<string, string>): ParsedLine | ParseError {
  const sanitized = sanitizeInput(raw);
  const trimmed = sanitized.trim();
  if (!trimmed) {
    return { kind: "pipeline", segments: [{ argv: [] }] };
  }

  const assignMatch = trimmed.match(ASSIGN_RE);
  if (assignMatch) {
    const [, name, value] = assignMatch;
    const exportAlias = trimmed.startsWith("export ");
    return { kind: "assignment", name: name!, value: value ?? "", exportAlias } satisfies ParsedAssignment;
  }

  const pipeParts = trimmed.split("|").map((s) => s.trim());
  if (pipeParts.length > MAX_PIPE_SEGMENTS) {
    return { message: "too many pipe segments" };
  }
  if (pipeParts.some((p) => p === "")) {
    return { message: "syntax error near unexpected token '|'" };
  }

  const segments: PipelineSegment[] = [];
  for (const part of pipeParts) {
    const tokResult = tokenize(part);
    if ("message" in tokResult) return tokResult;
    const expanded = expandTokens(tokResult, vars);
    const joined = expanded.join(" ");
    const expandedLine = expandVariables(joined, vars);
    if (expandedLine.length > MAX_EXPANDED_LEN) {
      return { message: "line too long after expansion" };
    }
    const reTokenized = tokenize(expandedLine);
    if ("message" in reTokenized) return reTokenized;
    const { argv, redirect } = extractRedirect(reTokenized);
    if (argv.includes(">") || argv.includes(">>")) {
      return { message: "syntax error near unexpected token" };
    }
    if (!redirect && (part.includes(">") || part.includes(">>")) && !part.match(/>>?\s+\S/)) {
      return { message: "syntax error near unexpected token" };
    }
    segments.push({ argv, redirect });
  }

  return { kind: "pipeline", segments } satisfies ParsedPipeline;
}

export function applyAssignment(
  vars: Map<string, string>,
  assignment: ParsedAssignment,
): ParseError | null {
  const { name, value } = assignment;
  if (vars.size >= MAX_VARS && !vars.has(name)) {
    return { message: "too many variables" };
  }
  if (value.length > MAX_VAR_LEN) {
    return { message: "variable value too long" };
  }
  vars.set(name, value);
  return null;
}
