import { BASE_NODE_PATHS } from "@/features/terminal/baseImage";
import {
  HOME,
  MAX_DEPTH,
  MAX_FILE_BYTES,
  MAX_NAME_LEN,
  MAX_NODES,
  MAX_PATH_LEN,
  MAX_TOTAL_BYTES,
  RESERVED_NAMES,
} from "@/features/terminal/shell.constants";
import { byteLength, isBlacklisted } from "@/features/terminal/sanitize";
import type { FsDir, FsFile, FsNode } from "@/features/terminal/shell.types";

export type FsError = { message: string; code?: number };

export function normalizePath(cwd: string, input: string): string {
  let p = input.trim();
  if (!p) return cwd;
  if (p.startsWith("~")) {
    p = p === "~" || p.startsWith("~/") ? HOME + p.slice(1) : HOME;
  }
  if (!p.startsWith("/")) {
    p = cwd === "/" ? `/${p}` : `${cwd}/${p}`;
  }
  const parts = p.split("/").filter(Boolean);
  const stack: string[] = [];
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") {
      stack.pop();
      continue;
    }
    stack.push(part);
  }
  const out = `/${stack.join("/")}`.replace(/\/+/g, "/");
  if (out.length > MAX_PATH_LEN) return out.slice(0, MAX_PATH_LEN);
  return out === "" ? "/" : out;
}

export function isValidName(name: string): boolean {
  if (!name || name === "." || name === "..") return false;
  if (name.length > MAX_NAME_LEN) return false;
  if (RESERVED_NAMES.has(name)) return false;
  if (name.includes("/")) return false;
  return true;
}

export function countNodes(root: FsDir): number {
  let n = 0;
  const walk = (node: FsNode) => {
    n++;
    if (node.kind === "dir") {
      for (const child of node.children.values()) walk(child);
    }
  };
  walk(root);
  return n;
}

export function totalBytes(root: FsDir): number {
  let total = 0;
  const walk = (node: FsNode) => {
    if (node.kind === "file") total += byteLength(node.content);
    else for (const child of node.children.values()) walk(child);
  };
  walk(root);
  return total;
}

type ResolveResult =
  | { ok: true; node: FsNode; parent: FsDir | null; name: string; path: string }
  | { ok: false; error: string };

export function resolvePath(root: FsDir, cwd: string, target: string): ResolveResult {
  const path = normalizePath(cwd, target);
  if (path === "/") return { ok: true, node: root, parent: null, name: "", path: "/" };
  const parts = path.split("/").filter(Boolean);
  let current: FsNode = root;
  let parent: FsDir | null = null;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    if (current.kind !== "dir") {
      return { ok: false, error: `Not a directory: ${path}` };
    }
    parent = current;
    const next = current.children.get(part);
    if (!next) return { ok: false, error: path };
    current = next;
  }
  return { ok: true, node: current, parent, name: parts.at(-1) ?? "", path };
}

export function getParentDir(root: FsDir, cwd: string, target: string): ResolveResult {
  const path = normalizePath(cwd, target);
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return { ok: true, node: root, parent: null, name: "", path: "/" };
  const parentPath = parts.length === 1 ? "/" : `/${parts.slice(0, -1).join("/")}`;
  return resolvePath(root, "/", parentPath);
}

function pathDepth(path: string): number {
  return path.split("/").filter(Boolean).length;
}

function wouldExceedCaps(root: FsDir, extraBytes: number, extraNodes: number): string | null {
  if (countNodes(root) + extraNodes > MAX_NODES) return "No space left on device";
  if (totalBytes(root) + extraBytes > MAX_TOTAL_BYTES) return "No space left on device";
  return null;
}

export function mkdirPath(
  root: FsDir,
  cwd: string,
  target: string,
  recursive: boolean,
): FsError | null {
  const path = normalizePath(cwd, target);
  if (pathDepth(path) > MAX_DEPTH) return { message: "No space left on device" };
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return { message: "File exists" };

  const name = parts.at(-1)!;
  if (!isValidName(name)) return { message: "Invalid file name" };
  if (isBlacklisted(name)) return { message: "content blocked" };

  const parentPath = parts.length === 1 ? "/" : `/${parts.slice(0, -1).join("/")}`;
  const parentRes = resolvePath(root, "/", parentPath);
  if (!parentRes.ok) {
    if (recursive && parts.length > 1) {
      const parentDirPath = `/${parts.slice(0, -1).join("/")}`;
      const err = mkdirPath(root, "/", parentDirPath, true);
      if (err) return err;
      return mkdirPath(root, cwd, target, true);
    }
    return { message: "No such file or directory" };
  }
  if (parentRes.node.kind !== "dir") return { message: "Not a directory" };
  if (parentRes.node.readonly) return { message: "Permission denied" };

  if (parentRes.node.children.has(name)) {
    if (recursive) {
      const existing = parentRes.node.children.get(name)!;
      return existing.kind === "dir" ? null : { message: "File exists" };
    }
    return { message: "File exists" };
  }

  const cap = wouldExceedCaps(root, 0, 1);
  if (cap) return { message: cap };

  const newDir: FsDir = {
    kind: "dir",
    name,
    children: new Map(),
    mtime: Date.now(),
  };
  parentRes.node.children.set(name, newDir);
  return null;
}

export function touchFile(root: FsDir, cwd: string, target: string): FsError | null {
  const path = normalizePath(cwd, target);
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return { message: "Invalid path" };
  const name = parts.at(-1)!;
  if (!isValidName(name)) return { message: "Invalid file name" };
  if (isBlacklisted(name)) return { message: "content blocked" };

  const parentPath = parts.length === 1 ? "/" : `/${parts.slice(0, -1).join("/")}`;
  const parentRes = resolvePath(root, "/", parentPath);
  if (!parentRes.ok || parentRes.node.kind !== "dir") return { message: "No such file or directory" };
  if (parentRes.node.readonly) return { message: "Permission denied" };

  const existing = parentRes.node.children.get(name);
  if (existing) {
    if (existing.readonly) return { message: "Permission denied" };
    if (existing.kind === "dir") return { message: "Is a directory" };
    existing.mtime = Date.now();
    return null;
  }

  const cap = wouldExceedCaps(root, 0, 1);
  if (cap) return { message: cap };

  const f: FsFile = { kind: "file", name, content: "", mtime: Date.now() };
  parentRes.node.children.set(name, f);
  return null;
}

export function writeFileContent(
  root: FsDir,
  cwd: string,
  target: string,
  content: string,
  append: boolean,
): FsError | null {
  if (isBlacklisted(content)) return { message: "content blocked" };
  const path = normalizePath(cwd, target);
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return { message: "Is a directory" };
  const name = parts.at(-1)!;
  if (!isValidName(name)) return { message: "Invalid file name" };
  if (isBlacklisted(name)) return { message: "content blocked" };

  const parentPath = parts.length === 1 ? "/" : `/${parts.slice(0, -1).join("/")}`;
  const parentRes = resolvePath(root, "/", parentPath);
  if (!parentRes.ok || parentRes.node.kind !== "dir") return { message: "No such file or directory" };
  if (parentRes.node.readonly) return { message: "Permission denied" };

  const newContent = (() => {
    const existing = parentRes.node.children.get(name);
    if (existing?.kind === "file") {
      if (existing.readonly) return null;
      return append ? existing.content + content : content;
    }
    return content;
  })();

  if (newContent === null) return { message: "Permission denied" };

  const bytes = byteLength(newContent);
  if (bytes > MAX_FILE_BYTES) return { message: "No space left on device" };

  const existing = parentRes.node.children.get(name);
  const extraNodes = existing ? 0 : 1;
  const oldBytes = existing?.kind === "file" ? byteLength(existing.content) : 0;
  const delta = bytes - oldBytes;
  const cap = wouldExceedCaps(root, Math.max(0, delta), extraNodes);
  if (cap) return { message: cap };

  if (existing?.kind === "dir") return { message: "Is a directory" };

  if (existing?.kind === "file") {
    existing.content = newContent;
    existing.mtime = Date.now();
  } else {
    parentRes.node.children.set(name, {
      kind: "file",
      name,
      content: newContent,
      mtime: Date.now(),
    });
  }
  return null;
}

export function removePath(
  root: FsDir,
  cwd: string,
  target: string,
  recursive: boolean,
  force: boolean,
): FsError | null {
  const path = normalizePath(cwd, target);
  if (path === "/" || path === cwd) return { message: "Permission denied" };
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return force ? null : { message: "No such file or directory" };

  const name = parts.at(-1)!;
  const parentPath = parts.length === 1 ? "/" : `/${parts.slice(0, -1).join("/")}`;
  const parentRes = resolvePath(root, "/", parentPath);
  if (!parentRes.ok || parentRes.node.kind !== "dir") {
    return force ? null : { message: "No such file or directory" };
  }

  const node = parentRes.node.children.get(name);
  if (!node) return force ? null : { message: "No such file or directory" };
  if (node.readonly || BASE_NODE_PATHS.has(path)) return { message: "Permission denied" };

  if (node.kind === "dir") {
    if (!recursive) return { message: "Is a directory" };
    const removeDir = (d: FsDir, basePath: string) => {
      for (const [childName, child] of [...d.children.entries()]) {
        const childPath = `${basePath}/${childName}`.replace(/\/+/g, "/");
        if (child.readonly || BASE_NODE_PATHS.has(childPath)) continue;
        if (child.kind === "dir") removeDir(child, childPath);
        else d.children.delete(childName);
      }
      for (const [childName, child] of [...d.children.entries()]) {
        const childPath = `${basePath}/${childName}`.replace(/\/+/g, "/");
        if (!child.readonly && !BASE_NODE_PATHS.has(childPath)) d.children.delete(childName);
      }
    };
    removeDir(node, path);
    if (node.children.size > 0) return { message: "Permission denied" };
  }

  parentRes.node.children.delete(name);
  return null;
}

export function listDirEntries(dir: FsDir, showHidden: boolean): FsNode[] {
  const entries: FsNode[] = [];
  for (const child of dir.children.values()) {
    if (!showHidden && child.hidden) continue;
    entries.push(child);
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

export function formatMtime(ms: number): string {
  const d = new Date(ms);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mon = months[d.getMonth()]!;
  const day = String(d.getDate()).padStart(2, " ");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${mon} ${day} ${hh}:${mm}`;
}

export function permString(node: FsNode): string {
  const ro = node.readonly;
  if (node.kind === "dir") {
    return ro ? "dr-xr-xr-x" : "drwxr-xr-x";
  }
  return ro ? "-r--r--r--" : "-rw-r--r--";
}

export function displayPath(cwd: string): string {
  if (cwd === HOME) return "~";
  if (cwd.startsWith(`${HOME}/`)) return `~${cwd.slice(HOME.length)}`;
  return cwd;
}
