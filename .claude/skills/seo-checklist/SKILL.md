---
name: seo-checklist
description: Audit a Next.js (App Router) app for SEO and apply safe fixes. Use when the user asks to "check SEO", "run the SEO checklist", "audit SEO", "optimize for search/SEO", "improve metadata/structured data/sitemap/robots", or fix Core Web Vitals / crawlability / Open Graph issues. Walks the codebase against checklist.md and, per item, either fixes it, asks the user, or skips it — then reports a categorized summary.
tools: Read, Glob, Grep, Edit, Write, Bash
---

# SEO Checklist Auditor

Audit a Next.js App Router project against [`checklist.md`](checklist.md) and, for every item, take exactly one of three actions — **FIX**, **ASK**, or **SKIP** — then end your turn with a categorized report.

`checklist.md` (in this skill folder) is the single source of truth for what to check. **Read it first, every run.** Each item there is pre-tagged 🟢 FIX / 🟡 ASK / ⚪ SKIP-ABLE — use those tags as the default disposition, but always confirm against the actual code before acting.

## Workflow

### Phase 1 — Load the checklist
Read `checklist.md` from this skill's directory. Treat its sections and tags as the authoritative item list. Do not work from memory.

### Phase 2 — Detect the project
Confirm this is a Next.js App Router project and gather facts before judging anything:
- Read `package.json` (Next.js version, scripts, deps like `next/font`, analyzers).
- Read `next.config.*`, locate the `app/` directory, root `layout.tsx`, and any `metadata`/`generateMetadata`/`viewport` exports.
- Check for existing convention files: `robots.ts`, `sitemap.ts`, `manifest.ts`, `opengraph-image.*`, `icon.*`, `not-found.tsx`, `error.tsx`.
- Identify content sources (e.g. data modules, dynamic `[slug]` routes) and the site's nature (portfolio, blog, e-commerce, local business) — this determines which ⚪ items are applicable.

Use `Glob`/`Grep`/`Read` only. **Do not** start the dev server, hit the network, or run external SEO tools.

### Phase 3 — Evaluate each item
Go section by section. For each checklist item, determine its current state in the code, then assign one disposition:

- **FIX (🟢)** — The correct change is unambiguous, code-level, and needs no business/content/credential decision. Apply it with `Edit`/`Write`, matching existing project conventions (see Constraints). Examples: missing `lang` on `<html>`, absent self-referencing canonical wiring, missing `robots.ts`/`sitemap.ts` scaffolding, viewport/`themeColor` export, `rel="noopener"` on `target="_blank"` links, decorative image missing `alt=""`, a non-`next/image` `<img>` that should be `next/image`.
- **ASK (🟡)** — Needs information you cannot safely infer. Do **not** guess. Collect these and ask the user (batch related questions with `AskUserQuestion` where possible). Examples: the production domain for `metadataBase`, brand name/tagline, meta description copy, social handles for `sameAs`, AI-bot allow/block policy, analytics IDs, OG image design, whether content is "final."
- **SKIP (⚪)** — Not applicable to this project type, or already correctly implemented. Record a one-line reason ("single-language site — hreflang N/A"; "already has self-referencing canonical").

When unsure whether something is FIX or ASK, **downgrade to ASK.** Never invent facts to make an item auto-fixable.

### Phase 4 — Apply fixes
Apply all 🟢 FIX items. After editing, verify the project still builds: run `npm run build` (and `npm run lint` if present). If a fix breaks the build, revert that change and reclassify it as ASK with the error noted. Keep edits minimal and idiomatic — do not reformat unrelated code.

### Phase 5 — Report (end of turn)
Always end your turn with a single categorized summary in this shape:

```
## SEO Checklist Results

### ✅ Completed (auto-fixed)
- <item> — <what changed, file:line>

### ❓ Action needed (your input required)
- <item> — <the specific question / what's blocking>

### ⏭️ Skipped (not applicable / already done)
- <item> — <reason>
```

If any ASK items exist, ask the user the concrete questions (via `AskUserQuestion` for discrete choices) so they can unblock those. Do not implement ASK items until answered.

## Constraints (read carefully)

1. **Never fabricate content or data.** No invented meta descriptions presented as final, no placeholder business names, no fake addresses, ratings, reviews, authors, or social links. Anything requiring real-world facts → ASK.
2. **Never guess the production domain.** `metadataBase`, canonical absolute URLs, sitemap host, and `robots.txt` `Sitemap:` all depend on it → ASK if not already defined in the codebase or env.
3. **Never fabricate structured data.** Only emit JSON-LD that maps to content/data that actually exists. Fake `AggregateRating`/`Review`/`LocalBusiness` data risks Google penalties. Schema type choice for real content can be FIX; missing facts → ASK.
4. **Audit before editing.** Confirm an item is actually missing/wrong by reading the code. Do not "fix" something already correct. Re-running the skill must be idempotent.
5. **Respect this project's stack and conventions.** This repo is Next.js 16 + React 19 + Tailwind v4. Use the App Router metadata APIs (`metadata`/`generateMetadata`, the `viewport` export, `alternates`), `next/font` or the existing font setup, path alias `@/*`, and the existing `Typography` components. Match surrounding style; read a neighboring file before adding a new one.
6. **Scope = SEO only.** Do not refactor unrelated code, change visual design, alter business logic, add dependencies (unless the user approves), or touch the fake-shell/interactive features beyond their SEO surface.
7. **No destructive or outward-facing actions.** Do not delete pages, change routing semantics, push commits, deploy, or submit to Search Console/Bing. Submission/verification/external-tool steps are always ASK/report items, never auto-done.
8. **Verify, don't claim.** After fixes, the build must pass. Report failures honestly; if you skipped a verification step, say so. Cite `file:line` for each completed fix.
9. **Stay idempotent and minimal.** Prefer the smallest correct change. If many similar fixes exist (e.g. dozens of images missing `sizes`), fix the clear ones and surface the rest in the report rather than mass-editing blindly.
10. **When in doubt, ASK rather than FIX.** A wrong auto-fix is worse than a surfaced question.

## Notes
- The checklist's 🟢/🟡/⚪ tags are guidance, not law — local context can move an item between buckets (e.g. an ⚪ item becomes relevant because the site is a blog). Justify any deviation in the report.
- Keep the three-bucket report even if a bucket is empty (state "none").
