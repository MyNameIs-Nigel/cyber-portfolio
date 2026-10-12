# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Next.js version warning (from AGENTS.md)

This repo runs **Next.js 16.2 + React 19**. APIs, conventions, and file structure may differ
from older Next.js you may know. Before writing framework code, read the relevant guide in
`node_modules/next/dist/docs/` and heed deprecation notices. Notable consequences already in
the codebase:

- Route `params` are a `Promise` and must be awaited (see the `[slug]` pages).
- Tailwind CSS v4 (`@tailwindcss/postcss`) — CSS-first config via `@import "tailwindcss"` and
  `@config` in `globals.css`, no `@tailwind` directives.

## Commands

- `npm run dev` — start the dev server (Turbopack) at http://localhost:3000
- `npm run build` — production build
- `npm start` — serve the production build
- `npm run lint` — ESLint (flat config, `eslint-config-next` core-web-vitals + typescript)

`npm test` runs the Vitest suites, including shell behavior and content consistency.

## Architecture

A statically-generated personal portfolio site. App Router under `src/`, path alias `@/*` → `src/*`.

### Data-driven content
Page content lives in plain TypeScript modules under `src/data/` (e.g. `projects.ts`,
`interactiveProjects.ts`, `skills.ts`, `tools.ts`). Each exports a typed array plus a
`getXBySlug` lookup helper. **To change site content, edit these data files** — pages map over
them rather than hard-coding copy. All shared types live in `src/types/index.ts`.

### Routing & project pages
- `src/app/projects/<slug>/page.tsx` — one dedicated page per featured web app in `projects.ts`
  (`ndsironwood`, `ssharcade`, `bus321`, `full-coverage-technology`, in display order). Each page
  wraps its own write-up in `ProjectPage` (`src/components/projects/ProjectPage.tsx`: back link,
  screenshot slideshow, title, tags, links) and exports `metadata = projectMetadata(project)`.
  Adding a project means adding both the data entry and the page folder — `src/data/projects.test.ts`
  enforces the pairing and that every screenshot path exists. Screenshots are 2400×1600
  quality-80 JPEGs in `public/projects/<folder>/`.
- `src/app/projects/ssh-arcade-fleet/page.tsx` — the SSH Arcade infrastructure case study (the
  `ssharcade` page above covers the website instead).
- `src/app/projects/interactive/[slug]/page.tsx` — interactive project pages, params from
  `interactiveProjects.ts`. Uses `generateStaticParams()` + `generateMetadata()` and calls
  `notFound()` for unknown slugs.

### Interactive apps (`src/features/interactive/`)
A registry pattern keeps the static project list decoupled from shipped interactive code, which
**must** stay in sync across two places when adding an app:
1. `registry-meta.ts` — `LIVE_INTERACTIVE_SLUGS` array + `isLiveInteractiveSlug` type guard
   (server-safe, no component imports).
2. `InteractiveAppHost.tsx` — `"use client"` map from slug → component (e.g. `minesweeper`).

A project in `interactiveProjects.ts` is rendered live only when its `status` is `"live"` AND
its slug is registered in both files above; otherwise the page shows a "coming soon" placeholder.
Individual apps follow the minesweeper layout: `*.types.ts`, `*.constants.ts`, a `useX` hook for
logic, and a `*App.tsx` view component.

### Components
Presentational components in `src/components/` (cards in `src/components/cards/`, project-specific
in `src/components/projects/`). `Navbar` + `Footer` wrap all pages via `src/app/layout.tsx`.
`Typography.tsx` exports the canonical `H1`–`H4`/`Paragraph` — use these instead of raw heading
tags. `LivePreview.tsx` renders scaled, inert (`pointer-events: none`, sandboxed) iframes of
external sites, lazy-mounted via `IntersectionObserver` with a screenshot fallback.

### Theming
Dark theme only. Colors are CSS custom properties in `src/app/globals.css` (`--color-bg`,
`--color-fg`, `--color-accent-1..4`, etc.), surfaced to Tailwind as named utilities
(`bg-bg`, `text-accent-1`, …) via `tailwind.config.ts`. The `Accent` type (`1 | 2 | 3 | 4`)
threads accent-color choices through component props. Font is Inter via `@fontsource/inter`.

### Fake shell (`src/features/terminal/`)
An interactive, browser-only Unix-ish shell embedded on `/projects` (via `FakeShellSection`). It is a
pure client feature — no server route, no `fetch`, no `eval` — backed by a canonical read-only "base
image" plus a per-visitor `localStorage` overlay. **See [`docs/fake-shell.md`](docs/fake-shell.md)
for the full architecture, command model, persistence, and safety budget before touching it.**
Planned enhancements live in `.claude/plans/fake-shell-enhancements.md`.

### Ambient backdrop (`src/features/ambient/`)
Decorative scene in the side gutters, mounted once in `layout.tsx` (so client navigations keep it). It shows
`DEFAULT_SCENE` (`night`); `?ambient=<id>` switches to any of `AMBIENT_SCENES` (`storm`, `night`, `fireflies`)
for that page load. Two gutter-sized canvases sit behind the page
(`-z-10`, `pointer-events: none`, `aria-hidden`), sized from `computeStage()` so the 768px column stays clear;
nothing runs below `MIN_VIEWPORT_WIDTH`, and reduced motion paints a single still frame. Scenes live in
`scenes/*Scene.ts` and implement `AmbientScene` (`resize` / `update` / `draw`); to add one, write a factory and
register it in `scenes/index.ts` and `AMBIENT_SCENES`. The night scene's moon uses `moonPhase.ts` (real phase,
flipped for southern-hemisphere time zones); firefly synchrony is the Kuramoto model in `scenes/fireflySync.ts`.

### Health check
`src/app/_selfcheck/route.ts` — `force-dynamic` JSON endpoint. Returns basic status publicly;
returns runtime/memory/deployment detail only with a valid `Bearer` token matching the
`SELFCHECK_TOKEN` env var (constant-time compared). Reads Vercel `VERCEL_*` env vars.

### Images
Remote images allowed only from `placehold.co` (`next.config.ts`). Local assets live in `public/`.
