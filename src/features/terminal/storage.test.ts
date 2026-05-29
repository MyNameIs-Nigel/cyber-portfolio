import { describe, expect, it, vi } from "vitest";
import { createBaseImage } from "@/features/terminal/baseImage";
import { resolvePath, writeFileContent } from "@/features/terminal/filesystem";
import { applyOverlay, extractOverlay, saveShellFs } from "@/features/terminal/storage";
import { HOME } from "@/features/terminal/shell.constants";
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
});
