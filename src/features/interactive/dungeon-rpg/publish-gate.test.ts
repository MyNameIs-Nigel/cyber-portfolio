import { describe, expect, it } from "vitest";
import {
  getInteractiveProjectBySlug,
  getPublicInteractiveProjectBySlug,
  publicInteractiveProjects,
} from "@/data/interactiveProjects";
import { LIVE_INTERACTIVE_SLUGS, isLiveInteractiveSlug } from "@/features/interactive/registry-meta";

/**
 * Registration and visibility are separate axes, and this is the test that keeps them separate.
 * Phases 0–2 ship a *renderable* game behind a shut publish gate; the gate opens in phase 3,
 * and that should be a deliberate one-line change with this test updated alongside it.
 */
describe("dungeon-rpg publish gate", () => {
  it("is registered as a live interactive slug", () => {
    expect(LIVE_INTERACTIVE_SLUGS).toContain("dungeon-rpg");
    expect(isLiveInteractiveSlug("dungeon-rpg")).toBe(true);
  });

  it("is still unpublished, so visitors cannot reach it", () => {
    const entry = getInteractiveProjectBySlug("dungeon-rpg");
    expect(entry).toBeDefined();
    expect(entry!.published).toBe(false);
    expect(entry!.status).toBe("coming-soon");
  });

  it("is absent from every visitor-facing surface", () => {
    // `publicInteractiveProjects` feeds the projects grid, the sitemap, and
    // `generateStaticParams()`, so its absence here is what makes the route 404.
    expect(publicInteractiveProjects.map((p) => p.slug)).not.toContain("dungeon-rpg");
    expect(getPublicInteractiveProjectBySlug("dungeon-rpg")).toBeUndefined();
  });

  it("keeps every published live slug reachable, so the gate is the exception not the rule", () => {
    for (const slug of LIVE_INTERACTIVE_SLUGS) {
      if (slug === "dungeon-rpg") continue;
      expect(`${slug}:${getPublicInteractiveProjectBySlug(slug) !== undefined}`).toBe(`${slug}:true`);
    }
  });
});
