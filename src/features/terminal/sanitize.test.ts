import { describe, expect, it } from "vitest";
import { byteLength, isBlacklisted, sanitizeInput } from "@/features/terminal/sanitize";
import { MAX_INPUT_LEN } from "@/features/terminal/shell.constants";

describe("sanitize", () => {
  it("clamps input length (S2)", () => {
    const long = "a".repeat(MAX_INPUT_LEN + 500);
    expect(sanitizeInput(long).length).toBe(MAX_INPUT_LEN);
  });

  it("strips control and ANSI sequences (S8)", () => {
    expect(sanitizeInput("hello\x07world")).toBe("helloworld");
    expect(sanitizeInput("x\x1b[31mred\x1b[0m")).toBe("xred");
  });

  it("detects blacklist (S10)", () => {
    expect(isBlacklisted("contains blockedword here")).toBe(true);
    expect(isBlacklisted("clean text")).toBe(false);
  });

  it("counts UTF-8 bytes (S3)", () => {
    expect(byteLength("😀")).toBe(4);
  });

  it("handles long adversarial strings quickly (S11)", () => {
    const start = performance.now();
    for (let i = 0; i < 200; i++) {
      sanitizeInput(`${"a|>".repeat(500)}${i}`);
      isBlacklisted("x".repeat(1000));
    }
    expect(performance.now() - start).toBeLessThan(500);
  });
});
