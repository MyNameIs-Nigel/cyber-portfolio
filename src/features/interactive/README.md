# Interactive mini-apps

Each experience lives in its own folder (e.g. `minesweeper/`, `subnet-calculator/`). The App Router page at `src/app/projects/interactive/[slug]/page.tsx` loads the UI via `InteractiveAppHost`.

## Adding a new app

1. Add or update the entry in `src/data/interactiveProjects.ts` (`status: "live"` when shipped).
2. Add the slug to `LIVE_INTERACTIVE_SLUGS` in `registry-meta.ts`.
3. Implement a client component (use `"use client"` if it uses state or browser APIs).
4. Register it in `InteractiveAppHost.tsx` on the `apps` map (TypeScript will require every live slug to have a component).

Keep shared site chrome in `@/components/*`; keep game-specific logic inside the feature folder.

## Dungeon RPG

`dungeon-rpg/` is larger than the other apps and has its own architecture doc:
**[`docs/dungeon-rpg.md`](../../../docs/dungeon-rpg.md)** — read it before touching anything in
that folder. The build plan lives in [`.claude/plans/dungeon-rpg/`](../../../.claude/plans/dungeon-rpg/README.md).

The one rule that shapes it: **`engine/` never imports React and never touches the DOM,
`window`, or a canvas.** Game rules are pure functions over plain data; `render/` is a projector
that reads a `GameState` and draws pixels without deciding anything. If a rule needs `document`
to determine an outcome, it is in the wrong file.

## Hiding a work-in-progress project

`InteractiveProject.published` controls visibility. `published: false` keeps the entry in
`interactiveProjects` but drops it from `visibleInteractiveProjects`, which is what the projects
grid and `generateStaticParams()` read — so the tile disappears and
`/projects/interactive/<slug>` 404s. Flip it to `true` when the experience is ready to show.

Preview deployments are the exception: Vercel sets `ENVIRONMENT=DEV` there, and
`visibleInteractiveProjects` then includes unpublished entries so work in progress can be
reviewed on the preview URL. `sitemap.ts` keeps using `publicInteractiveProjects`, which ignores
the environment, because it emits production URLs.
