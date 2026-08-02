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
- `npm run test` — Vitest (single run); `npm run test:watch` for watch mode

Vitest runs with `environment: "node"` over `src/**/*.test.ts{,x}`. Suites that need a DOM opt
in per-file with a `// @vitest-environment jsdom` pragma (see `render-safety.test.tsx`).

## Architecture

A statically-generated personal portfolio site. App Router under `src/`, path alias `@/*` → `src/*`.

### Data-driven content
Page content lives in plain TypeScript modules under `src/data/` (e.g. `projects.ts`,
`interactiveProjects.ts`, `skills.ts`, `tools.ts`). Each exports a typed array plus a
`getXBySlug` lookup helper. **To change site content, edit these data files** — pages map over
them rather than hard-coding copy. All shared types live in `src/types/index.ts`.

### Routing & dynamic pages
- `src/app/projects/[slug]/page.tsx` — case-study pages, params from `projects.ts`
- `src/app/projects/interactive/[slug]/page.tsx` — interactive project pages, params from
  `interactiveProjects.ts`

Both dynamic routes use `generateStaticParams()` (from the data arrays) + `generateMetadata()`
and call `notFound()` for unknown slugs. They are static-by-default server components.

### Interactive apps (`src/features/interactive/`)
A registry pattern keeps the static project list decoupled from shipped interactive code, which
**must** stay in sync across two places when adding an app:
1. `registry-meta.ts` — `LIVE_INTERACTIVE_SLUGS` array + `isLiveInteractiveSlug` type guard
   (server-safe, no component imports).
2. `InteractiveAppHost.tsx` — `"use client"` map from slug → component (e.g. `minesweeper`).

Visibility is a separate axis from readiness:
- `published: false` hides a project from visitors entirely. `publicInteractiveProjects` (the
  filtered export) feeds the projects grid, `sitemap.ts`, and `generateStaticParams()`, and the
  `[slug]` route looks entries up with `getPublicInteractiveProjectBySlug`, so an unpublished
  slug 404s. Use it for work in progress.
- `status: "live"` + the slug registered in both files above renders the actual app; a published
  project without both shows a "coming soon" placeholder.

Individual apps follow the minesweeper layout: `*.types.ts`, `*.constants.ts`, a `useX` hook for
logic, and a `*App.tsx` view component (subnet-calculator adds a `*.math.ts` for pure helpers).
The desktop-only mobile warning modal is scoped to `category === "game"`.

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

### Health check
`src/app/_selfcheck/route.ts` — `force-dynamic` JSON endpoint. Returns basic status publicly;
returns runtime/memory/deployment detail only with a valid `Bearer` token matching the
`SELFCHECK_TOKEN` env var (constant-time compared). Reads Vercel `VERCEL_*` env vars.

### Images
Remote images allowed only from `placehold.co` (`next.config.ts`). Local assets live in `public/`.
