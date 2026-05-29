// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { createBaseImage } from "@/features/terminal/baseImage";
import { writeFileContent } from "@/features/terminal/filesystem";
import { catCommand } from "@/features/terminal/commands/cat";
import { HOME } from "@/features/terminal/shell.constants";
import type { ShellState } from "@/features/terminal/shell.types";

describe("render safety (S7)", () => {
  it("renders script tags as literal text", () => {
    const fs = createBaseImage();
    const payload = '<img src=x onerror="alert(1)">';
    writeFileContent(fs, HOME, "xss.txt", payload, false);
    const state: ShellState = {
      fs,
      cwd: HOME,
      oldpwd: HOME,
      vars: new Map(),
      scrollback: [],
      history: [],
    };
    const result = catCommand.run({ args: ["xss.txt"], stdin: "", cwd: HOME, state });
    const container = document.createElement("div");
    const root = createRoot(container);
    act(() => {
      root.render(<span>{result.stdout}</span>);
    });
    expect(container.textContent).toContain("<img");
    expect(container.querySelector("img")).toBeNull();
    root.unmount();
  });

  it("does not use dangerouslySetInnerHTML in terminal feature", () => {
    const dir = join(process.cwd(), "src/features/terminal");
    const files = ["FakeShellApp.tsx", "useShell.ts"];
    for (const f of files) {
      const src = readFileSync(join(dir, f), "utf8");
      expect(src).not.toContain("dangerouslySetInnerHTML");
    }
  });
});
