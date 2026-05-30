import { BASE_NODE_PATHS, createBaseImage } from "@/features/terminal/baseImage";
import { FS_SCHEMA_VERSION, HOME, STORAGE_KEY } from "@/features/terminal/shell.constants";
import { mkdirPath, resolvePath, writeFileContent } from "@/features/terminal/filesystem";
import { seedProjectFiles } from "@/features/terminal/seed";
import type { FsDir, OverlayEntry, PersistedOverlay, ShellState } from "@/features/terminal/shell.types";

function isWritablePath(path: string): boolean {
  if (BASE_NODE_PATHS.has(path)) return false;
  return path === HOME || path.startsWith(`${HOME}/`) || path.startsWith("/tmp");
}

function collectOverlay(root: FsDir, basePath: string, entries: OverlayEntry[]) {
  const walk = (node: import("@/features/terminal/shell.types").FsNode, path: string) => {
    if (BASE_NODE_PATHS.has(path)) {
      if (node.kind === "dir") {
        for (const [name, child] of node.children) {
          walk(child, path === "/" ? `/${name}` : `${path}/${name}`);
        }
      }
      return;
    }
    if (!isWritablePath(path)) return;
    if (node.kind === "file") {
      entries.push({ path, kind: "file", content: node.content, mtime: node.mtime });
      return;
    }
    entries.push({ path, kind: "dir", mtime: node.mtime });
    for (const [name, child] of node.children) {
      walk(child, `${path}/${name}`.replace(/\/+/g, "/"));
    }
  };
  for (const [name, child] of root.children) {
    walk(child, `/${name}`);
  }
}

export function extractOverlay(state: ShellState): PersistedOverlay {
  const entries: OverlayEntry[] = [];
  collectOverlay(state.fs, "/", entries);
  return { version: FS_SCHEMA_VERSION, entries };
}

function restampBaseNodes(target: FsDir, source: FsDir, path = "/") {
  if (BASE_NODE_PATHS.has(path) && target.kind === "dir" && source.kind === "dir") {
    target.readonly = source.readonly;
    target.hidden = source.hidden;
    target.mtime = source.mtime;
    for (const [name, srcChild] of source.children) {
      const tgtChild = target.children.get(name);
      if (!tgtChild) continue;
      const childPath = path === "/" ? `/${name}` : `${path}/${name}`;
      if (srcChild.kind === "file" && tgtChild.kind === "file") {
        tgtChild.content = srcChild.content;
        tgtChild.readonly = srcChild.readonly;
        tgtChild.hidden = srcChild.hidden;
        tgtChild.executable = srcChild.executable;
        tgtChild.mtime = srcChild.mtime;
      } else if (srcChild.kind === "dir" && tgtChild.kind === "dir") {
        restampBaseNodes(tgtChild, srcChild, childPath);
      }
    }
  } else if (target.kind === "dir" && source.kind === "dir") {
    for (const [name, srcChild] of source.children) {
      const tgtChild = target.children.get(name);
      if (tgtChild) {
        const childPath = path === "/" ? `/${name}` : `${path}/${name}`;
        if (BASE_NODE_PATHS.has(childPath)) {
          if (srcChild.kind === "file" && tgtChild.kind === "file") {
            tgtChild.content = srcChild.content;
            tgtChild.readonly = srcChild.readonly;
            tgtChild.hidden = srcChild.hidden;
            tgtChild.executable = srcChild.executable;
          } else if (srcChild.kind === "dir" && tgtChild.kind === "dir") {
            restampBaseNodes(tgtChild, srcChild, childPath);
          }
        }
      }
    }
  }
}

export function applyOverlay(root: FsDir, overlay: PersistedOverlay): void {
  for (const entry of overlay.entries) {
    if (BASE_NODE_PATHS.has(entry.path)) continue;
    if (!isWritablePath(entry.path)) continue;
    if (entry.kind === "dir") {
      mkdirPath(root, "/", entry.path, true);
      continue;
    }
    const parts = entry.path.split("/").filter(Boolean);
    const name = parts.at(-1)!;
    const parentPath = parts.length === 1 ? "/" : `/${parts.slice(0, -1).join("/")}`;
    mkdirPath(root, "/", parentPath, true);
    writeFileContent(root, "/", entry.path, entry.content ?? "", false);
    const res = resolvePath(root, "/", entry.path);
    if (res.ok && res.node.kind === "file") {
      res.node.mtime = entry.mtime;
    }
    void name;
  }
}

export function loadShellFs(): { fs: FsDir; cwd: string } {
  const base = createBaseImage();
  const canonical = createBaseImage();
  const cwd = HOME;

  if (typeof window === "undefined") {
    return { fs: base, cwd };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      seedProjectFiles(base);
      const seeded: ShellState = {
        fs: base,
        cwd,
        oldpwd: cwd,
        vars: new Map(),
        scrollback: [],
        history: [],
      };
      saveShellFs(seeded);
      return { fs: base, cwd };
    }
    const parsed = JSON.parse(raw) as PersistedOverlay;
    if (!parsed || parsed.version !== FS_SCHEMA_VERSION || !Array.isArray(parsed.entries)) {
      localStorage.removeItem(STORAGE_KEY);
      return { fs: base, cwd };
    }
    applyOverlay(base, parsed);
    restampBaseNodes(base, canonical);
    return { fs: base, cwd };
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return { fs: base, cwd };
  }
}

export function saveShellFs(state: ShellState): string | null {
  if (typeof window === "undefined") return null;
  try {
    const overlay = extractOverlay(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overlay));
    return null;
  } catch {
    return "No space left on device";
  }
}

export function createInitialState(): ShellState {
  const { fs, cwd } = loadShellFs();
  return {
    fs,
    cwd,
    oldpwd: cwd,
    vars: new Map([
      ["HOME", HOME],
      ["USER", "guest"],
      ["PWD", cwd],
      ["OLDPWD", cwd],
      ["HOSTNAME", "portfolio"],
    ]),
    scrollback: [],
    history: [],
  };
}
