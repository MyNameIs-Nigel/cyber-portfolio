import { describe, expect, it } from "vitest";
import { SCRIPT_HANDLERS } from "@/features/terminal/scripts";
import type { ShellState } from "@/features/terminal/shell.types";
import { createBaseImage } from "@/features/terminal/baseImage";
import { HOME } from "@/features/terminal/shell.constants";

function ctx(): { state: ShellState } {
  return {
    state: {
      fs: createBaseImage(),
      cwd: HOME,
      oldpwd: HOME,
      vars: new Map(),
      scrollback: [],
      history: [],
    },
  };
}

describe("scripts", () => {
  it("resume.sh handler returns curl output and navigate to /", () => {
    const handler = SCRIPT_HANDLERS.get("/home/guest/resume.sh");
    expect(handler).toBeDefined();
    const result = handler!({ args: [], stdin: "", cwd: HOME, state: ctx().state });
    expect(result.stdout).toContain("Fetching résumé");
    expect(result.stdout).toContain("248k");
    expect(result.navigate).toEqual({ href: "/", delayMs: 1200 });
  });
});
