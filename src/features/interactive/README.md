# Interactive mini-apps

Each experience lives in its own folder (e.g. `minesweeper/`, `subnet-calculator/`). The App Router page at `src/app/projects/interactive/[slug]/page.tsx` loads the UI via `InteractiveAppHost`.

## Adding a new app

1. Add or update the entry in `src/data/interactiveProjects.ts` (`status: "live"` when shipped).
2. Add the slug to `LIVE_INTERACTIVE_SLUGS` in `registry-meta.ts`.
3. Implement a client component (use `"use client"` if it uses state or browser APIs).
4. Register it in `InteractiveAppHost.tsx` on the `apps` map (TypeScript will require every live slug to have a component).

Keep shared site chrome in `@/components/*`; keep game-specific logic inside the feature folder.

## Hiding a work-in-progress project

`InteractiveProject.published` controls visibility. `published: false` keeps the entry in
`interactiveProjects` but drops it from `publicInteractiveProjects`, which is what the projects
grid, `sitemap.ts`, and `generateStaticParams()` all read — so the tile disappears and
`/projects/interactive/<slug>` 404s. Flip it to `true` when the experience is ready to show.
