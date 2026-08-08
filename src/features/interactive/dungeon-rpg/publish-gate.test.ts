import { afterEach, describe, expect, it, vi } from "vitest";
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
    // `publicInteractiveProjects` feeds the sitemap, and `visibleInteractiveProjects` (which
    // equals it outside preview deployments) feeds the projects grid and `generateStaticParams()`,
    // so its absence here is what makes the route 404.
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

/**
 * Preview deployments run with `ENVIRONMENT=DEV` and open the gate, so unfinished work can be
 * reviewed on a preview URL. The module reads the variable once at import time, hence the
 * `resetModules()` + dynamic import dance.
 */
describe("ENVIRONMENT=DEV visibility", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function loadWith(environment: string | undefined) {
    vi.resetModules();
    vi.stubEnv("ENVIRONMENT", environment);
    return import("@/data/interactiveProjects");
  }

  it("shows unpublished projects on preview deployments", async () => {
    const { visibleInteractiveProjects, getVisibleInteractiveProjectBySlug, interactiveProjects } = await loadWith("DEV");

    expect(visibleInteractiveProjects.map((p) => p.slug)).toEqual(interactiveProjects.map((p) => p.slug));
    expect(getVisibleInteractiveProjectBySlug("dungeon-rpg")).toBeDefined();
  });

  it("keeps them hidden in production", async () => {
    const { visibleInteractiveProjects, getVisibleInteractiveProjectBySlug } = await loadWith("PRODUCTION");

    expect(visibleInteractiveProjects.every((p) => p.published)).toBe(true);
    expect(getVisibleInteractiveProjectBySlug("dungeon-rpg")).toBeUndefined();
  });

  it("keeps them hidden when the variable is unset", async () => {
    const { visibleInteractiveProjects } = await loadWith(undefined);

    expect(visibleInteractiveProjects.every((p) => p.published)).toBe(true);
  });

  it("never leaks unpublished projects into the sitemap, which emits production URLs", async () => {
    const { publicInteractiveProjects: publicOnDev } = await loadWith("DEV");

    expect(publicOnDev.every((p) => p.published)).toBe(true);
    expect(publicOnDev.map((p) => p.slug)).not.toContain("dungeon-rpg");
  });
});
