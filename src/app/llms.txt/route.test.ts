import { describe, expect, it } from "vitest";
import { GET } from "./route";
import { earnedCertifications } from "@/data/certifications";
import { renderCareerSummary } from "@/data/careerText";
import { MAX_FILE_BYTES } from "@/features/terminal/shell.constants";

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
});
