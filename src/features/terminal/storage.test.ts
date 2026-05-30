import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { projects } from "@/data/projects";
import { createBaseImage } from "@/features/terminal/baseImage";
import { removePath, resolvePath, writeFileContent } from "@/features/terminal/filesystem";
import { applyOverlay, extractOverlay, loadShellFs, saveShellFs } from "@/features/terminal/storage";
import { FS_SCHEMA_VERSION, HOME, STORAGE_KEY } from "@/features/terminal/shell.constants";
import type { ShellState } from "@/features/terminal/shell.types";

describe("storage", () => {
  it("round-trips overlay entries", () => {
    const fs = createBaseImage();
    const s: ShellState = {
      fs,
      cwd: HOME,
      oldpwd: HOME,
      vars: new Map(),
      scrollback: [],
      history: [],
    };
    writeFileContent(fs, HOME, "user.txt", "persisted", false);
    const overlay = extractOverlay(s);
    expect(overlay.entries.some((e) => e.path.endsWith("user.txt"))).toBe(true);

    const fresh = createBaseImage();
    applyOverlay(fresh, overlay);
    const res = resolvePath(fresh, HOME, "user.txt");
    expect(res.ok && res.node.kind === "file" && res.node.content).toBe("persisted");
  });

  it("surfaces quota errors (S14)", () => {
    const s: ShellState = {
      fs: createBaseImage(),
      cwd: HOME,
      oldpwd: HOME,
      vars: new Map(),
      scrollback: [],
      history: [],
    };
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new DOMException("quota", "QuotaExceededError");
      },
      getItem: () => null,
      removeItem: () => undefined,
    });
    expect(saveShellFs(s)).toBe("No space left on device");
    vi.unstubAllGlobals();
  });

  describe("first boot seeding (v2)", () => {
    let store: Record<string, string>;

    beforeEach(() => {
      store = {};
      vi.stubGlobal("window", {});
      vi.stubGlobal("localStorage", {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
          store[key] = value;
        },
        removeItem: (key: string) => {
          delete store[key];
        },
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("seeds project files on first boot and persists them", () => {
      const { fs } = loadShellFs();
      expect(store[STORAGE_KEY]).toBeDefined();
      for (const p of projects) {
        const res = resolvePath(fs, HOME, `projects/${p.slug}.txt`);
        expect(res.ok).toBe(true);
      }
    });

    it("keeps deleted seeded files deleted after reload", () => {
      const first = loadShellFs();
      const slug = projects[0]!.slug;
      removePath(first.fs, HOME, `projects/${slug}.txt`, false, false);
      const s: ShellState = {
        fs: first.fs,
        cwd: HOME,
        oldpwd: HOME,
        vars: new Map(),
        scrollback: [],
        history: [],
      };
      saveShellFs(s);
      const second = loadShellFs();
      expect(resolvePath(second.fs, HOME, `projects/${slug}.txt`).ok).toBe(false);
    });

    it("ignores v1 storage key and reseeds at v2", () => {
      store["portfolio-shell-fs:v1"] = JSON.stringify({ version: 1, entries: [] });
      const { fs } = loadShellFs();
      expect(store[STORAGE_KEY]).toBeDefined();
      expect(JSON.parse(store[STORAGE_KEY]!).version).toBe(FS_SCHEMA_VERSION);
      expect(resolvePath(fs, HOME, `projects/${projects[0]!.slug}.txt`).ok).toBe(true);
    });
  });
});
