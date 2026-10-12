import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { getProjectBySlug, projects } from "@/data/projects";

const root = fileURLToPath(new URL("../../", import.meta.url));
const projectsAppDir = path.join(root, "src/app/projects");

/** Static segments under /projects that are not featured web apps. */
const OTHER_SEGMENTS = new Set(["interactive", "ssh-arcade-fleet"]);

describe("featured web projects", () => {
  it("uses unique slugs", () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every project a dedicated page, and every page a project", () => {
    for (const { slug } of projects) {
      expect(existsSync(path.join(projectsAppDir, slug, "page.tsx")), `missing page for ${slug}`).toBe(true);
    }
    const pageDirs = readdirSync(projectsAppDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !OTHER_SEGMENTS.has(entry.name))
      .map((entry) => entry.name);
    expect(pageDirs.sort()).toEqual(projects.map((p) => p.slug).sort());
  });

  it("points every image at a file in public/", () => {
    for (const project of projects) {
      for (const src of [project.image, ...project.screenshots].filter(Boolean) as string[]) {
        expect(existsSync(path.join(root, "public", src)), `${project.slug}: ${src}`).toBe(true);
      }
    }
  });

  it("throws on an unknown slug instead of returning nothing", () => {
    expect(getProjectBySlug("ndsironwood").title).toBe("Photography Portfolio");
    expect(() => getProjectBySlug("photography-portfolio")).toThrow(/No project with slug/);
  });
});
