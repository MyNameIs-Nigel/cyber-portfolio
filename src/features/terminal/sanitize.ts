import { BLACKLIST, MAX_INPUT_LEN } from "@/features/terminal/shell.constants";

const CONTROL_RE = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;
const ANSI_RE = /\x1b\[[0-9;]*[A-Za-z]/g;

const encoder = new TextEncoder();

export function byteLength(s: string): number {
  return encoder.encode(s).length;
}

function normalizeForBlacklist(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, "");
}

export function isBlacklisted(text: string): boolean {
  const norm = normalizeForBlacklist(text);
  if (!norm) return false;
  return BLACKLIST.some((word) => norm.includes(normalizeForBlacklist(word)));
}

export function sanitizeInput(raw: string): string {
  let s = raw.slice(0, MAX_INPUT_LEN);
  s = s.replace(ANSI_RE, "").replace(CONTROL_RE, "").replace(/\[[0-9;]*[A-Za-z]/g, "");
  return s;
}

export function truncateForDisplay(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen)}…`;
}
