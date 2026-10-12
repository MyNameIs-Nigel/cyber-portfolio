import { describe, expect, it } from "vitest";
import { GET } from "./route";
import { earnedCertifications } from "@/data/certifications";
import { renderCareerSummary } from "@/data/careerText";
import { HOME, MAX_FILE_BYTES, MAX_LINE_RENDER_LEN } from "@/features/terminal/shell.constants";
import { createBaseImage } from "@/features/terminal/baseImage";
import { resolvePath } from "@/features/terminal/filesystem";
import { SCRIPT_HANDLERS } from "@/features/terminal/scripts";
import type { ShellState } from "@/features/terminal/shell.types";

describe("machine-readable career profile", () => {
  it("serves the reconciled facts as plain text at the existing llms.txt URL", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    const body = await response.text();
    for (const fact of [
      "Expected July 2027", "Cloud & IT Consultant", "May 2023 – Present",
      "30,000-subscriber ISP", "200+ support calls monthly", "14%",
      "Cisco Certified Network Associate (CCNA) — Cisco — Studying; no exam date set",
      "Published GitHub Releases", "GitHub OIDC and AWS SSM",
    ]) expect(body).toContain(fact);
    for (const stale of ["Network+", "$700", "11 web apps", "self-hosted runner", "Solutions Architect", "resume.pdf"]) {
      expect(body).not.toContain(stale);
    }
    expect(earnedCertifications).toHaveLength(4);
    expect(earnedCertifications.some((cert) => cert.name.includes("CCNA"))).toBe(false);
  });

  it("keeps the shared shell summary within its filesystem content budget", () => {
    const text = renderCareerSummary();
    expect(new TextEncoder().encode(text).length).toBeLessThan(MAX_FILE_BYTES - 1024);
  });

  it("keeps ./resume.sh output and `cat resume.sh` under the shell display cap so nothing is truncated", () => {
    const fs = createBaseImage();
    const state = { fs, cwd: HOME } as unknown as ShellState;
    const result = SCRIPT_HANDLERS.get("/home/guest/resume.sh")!({ args: [], stdin: "", cwd: HOME, state });
    expect(result.stdout.length).toBeLessThanOrEqual(MAX_LINE_RENDER_LEN);
    expect(result.stdout).toContain("## Currently");
    expect(result.stdout).toContain("Opening the portfolio homepage");

    const sh = resolvePath(fs, HOME, "resume.sh");
    expect(sh.ok && sh.node.kind === "file" && sh.node.content.length).toBeLessThanOrEqual(MAX_LINE_RENDER_LEN);
  });
});
