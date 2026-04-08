/**
 * Slugs that have a shipped interactive experience.
 * Keep in sync with `InteractiveAppHost` — add a slug here when you register its component.
 */
export const LIVE_INTERACTIVE_SLUGS = ["minesweeper"] as const;

export type LiveInteractiveSlug = (typeof LIVE_INTERACTIVE_SLUGS)[number];

export function isLiveInteractiveSlug(slug: string): slug is LiveInteractiveSlug {
  return (LIVE_INTERACTIVE_SLUGS as readonly string[]).includes(slug);
}
