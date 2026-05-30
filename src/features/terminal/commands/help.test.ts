import { describe, expect, it } from "vitest";
import { helpCommand } from "@/features/terminal/commands/help";

describe("help command", () => {
  it("lists visible commands only, without operators or disclaimer", () => {
    const result = helpCommand.run({ args: [], stdin: "", cwd: "/home/guest", state: {} as never });
    expect(result.stdout).not.toContain("Operators:");
    expect(result.stdout).not.toContain("Simulated shell");
    expect(result.stdout).not.toContain("nothing here is real");
    expect(result.stdout).not.toContain("sudo");
    expect(result.stdout).not.toContain("whoami");
    expect(result.stdout).toContain("help <command>");
  });

  it("help sudo still resolves hidden commands", () => {
    const result = helpCommand.run({ args: ["sudo"], stdin: "", cwd: "/home/guest", state: {} as never });
    expect(result.stdout).toContain("sudo");
    expect(result.code).toBe(0);
  });
});
