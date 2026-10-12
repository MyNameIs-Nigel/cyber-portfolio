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
      aliases: new Map(),
      scrollback: [],
      history: [],
    },
  };
}

describe("scripts", () => {
  it("resume.sh shows current career facts without claiming a PDF download", () => {
    const handler = SCRIPT_HANDLERS.get("/home/guest/resume.sh");
    expect(handler).toBeDefined();
    const result = handler!({ args: [], stdin: "", cwd: HOME, state: ctx().state });
    expect(result.stdout).toContain("Expected July 2027");
    expect(result.stdout).toContain("Cloud & IT Consultant");
    expect(result.stdout).toContain("CCNA");
    expect(result.stdout).not.toContain("resume.pdf");
    expect(result.stdout).not.toContain("Saved to");
    expect(result.navigate).toEqual({ href: "/", delayMs: 1200 });
  });
});
