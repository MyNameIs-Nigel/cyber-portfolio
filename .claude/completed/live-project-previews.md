# Plan: Live Rendered Previews for Featured Project Cards

**Status:** Draft / not started
**Author:** Planning pass (no code written)
**Date:** 2026-05-29

## 1. Goal

On the Projects page (`src/app/projects/page.tsx`), the **Featured Web Applications**
section currently renders each project's large card with a *static screenshot*
(`Image` from `project.image`). We want to replace that static screenshot with a
**live, fetched rendering of the actual site** — so the card shows the project's real,
current homepage rather than a frozen PNG.

All three featured projects are server-rendered websites that Nigel controls:

| Project | URL | Notes |
|---|---|---|
| Full Coverage Technology | https://fullcoveragetechnology.com/ | Next.js, Nigel-owned |
| Photography Portfolio | https://ndsironwood.com/ | Next.js, Nigel-owned |
| Grade Calculator | https://grades.ndsironwood.com/ | Firebase, Nigel-owned |

Because Nigel owns all three, we can change response headers (CSP / `X-Frame-Options`)
on those origins if an embedding approach requires it. That materially widens our options.

## 2. Current state (what exists today)

- **`src/data/projects.ts`** — `projects: Project[]` with `image` (hero) + `screenshots[]`.
- **`src/types/index.ts`** — `Project` interface and `ProjectCardProps`
  (`ProjectCardProps` currently exposes `title, description, tags, link?, image?, slug?`).
- **`src/components/cards/ProjectCard.tsx`** — renders `image` inside an
  `aspect-video` rounded container via `next/image` when `image` is set, then title /
  description / tags / arrow. Card is wrapped in a `Link` to `/projects/{slug}`.
- **`src/app/projects/page.tsx`** — maps `projects` to `<ProjectCard />`.
- **`src/app/projects/[slug]/page.tsx`** — detail page; uses `ImageSlideshow` over
  `project.screenshots`. (Out of scope unless we choose to extend, see §8.)
- **`next.config.ts`** — `images.remotePatterns` only allows `placehold.co` today.
- **Stack:** Next.js **16.2.2**, React 19.2.4, Tailwind v4, deployed on Vercel.
  Per `AGENTS.md`, treat Next 16 as having breaking changes — **read the relevant guide
  in `node_modules/next/dist/docs/` before writing any code.**

## 3. Key constraint: "fetched rendered preview" can mean two very different things

There are two fundamentally different interpretations, and they have very different
trade-offs. The plan should land on one (recommendation in §5).

### Option A — Live `<iframe>` of the real site (true "live" preview)
Embed the actual site in a scaled-down, non-interactive iframe inside the card.

- ✅ Genuinely live — always reflects the current production site.
- ✅ No screenshot pipeline, no storage, no staleness.
- ⚠️ **Framing headers:** the target site must allow being framed. Default Next.js / many
  hosts send `X-Frame-Options: SAMEORIGIN` or a CSP `frame-ancestors` that blocks us.
  Nigel owns all 3 sites, so we can add `frame-ancestors https://<portfolio-domain>` to
  each — but `grades.ndsironwood.com` is Firebase and needs its own header config, and any
  third-party widgets/auth on it may misbehave when framed.
- ⚠️ **Performance:** each card loads a full website (JS, fonts, images). Three featured
  cards = three full page loads on the Projects route. Must lazy-load (load iframe only
  when near viewport) and consider `loading="lazy"`.
- ⚠️ **Interactivity / accessibility:** we don't want the iframe stealing scroll, focus, or
  clicks since the whole card is itself a link. Need a transparent overlay + scaled,
  `pointer-events: none` iframe, and `tabindex=-1` / `aria-hidden` on the frame.
- ⚠️ **Mobile / responsive:** the embedded site renders at its own viewport; we typically
  render the iframe at a fixed "desktop" width (e.g. 1280px) and CSS-scale it down to fit
  the `aspect-video` box, so it reads as a desktop screenshot.
- ⚠️ **Reliability:** if a site is down/slow or later changes headers, the card breaks —
  needs a graceful fallback to the existing static `image`.

### Option B — Live screenshot generation (rendered image of the real site)
Render the site headlessly and capture an image, then show that image. "Fetched + rendered"
but materialized as a picture rather than a live frame.

- ✅ Looks identical to the current card (it's still an image), so layout/UX unchanged.
- ✅ No framing-header problems, no interactivity problems, fast to display.
- ✅ Can be regenerated on a schedule so it stays reasonably current.
- ⚠️ Needs a rendering engine. Sub-choices:
  - **B1 — On-demand via headless Chromium in a Route Handler.** Use
    `puppeteer-core` + `@sparticuz/chromium` (Vercel-compatible) in an `app/api/.../route.ts`
    that takes a URL, screenshots it, and returns/caches a PNG. Heavy cold starts; Vercel
    function size + timeout limits apply; needs caching (ISR-style or CDN cache headers,
    see `02-guides/incremental-static-regeneration.md` and `cdn-caching.md`).
  - **B2 — Third-party screenshot API.** e.g. Microlink, ScreenshotOne, urlbox, thum.io.
    Zero infra; just an `<img>`/`next/image` pointing at their URL (with an API key for paid
    tiers). Adds an external dependency + possible cost/rate limits; free tiers watermark or
    throttle. This is the lowest-effort "live-ish" option.
  - **B3 — Build-time screenshots.** Generate PNGs during `next build` and commit/output
    them as static assets. Effectively automated versions of today's screenshots; "live"
    only as fresh as the last deploy. Simplest runtime, but not truly live.

### Option C — Hybrid (recommended shape)
Live `<iframe>` preview (Option A) as the primary experience, with the existing static
`image` as an automatic fallback when the iframe can't load or the user is on a
constrained connection / reduced-data / mobile. Optionally layer in B for OG/social.

## 4. Decision factors to confirm with Nigel

These change the recommendation — confirm before building:

1. **"Live" vs "fresh-looking"?** Does Nigel want a genuinely interactive/live frame, or
   just an always-up-to-date *image*? His phrasing ("fetched rendered preview of that exact
   site") leans toward a true live render → Option A/C.
2. **Willing to add response headers** to the three target sites (to allow framing)?
   Required for Option A. If not → Option B.
3. **Acceptable to add a paid/free third-party API** (Option B2) or new heavy deps
   (`puppeteer`, `@sparticuz/chromium` for B1)?
4. **Mobile behavior:** live iframes on mobile are costly. Acceptable to fall back to the
   static image on small screens / `prefers-reduced-data`?
5. **Performance budget:** three live embeds on one route is significant. Acceptable with
   lazy-loading + scale-down, or should only the *first* card be live and the rest images?

## 5. Recommendation

**Option C (Hybrid), defaulting to a scaled live `<iframe>` with static-image fallback**,
for these reasons:
- It most directly satisfies "a fetched rendered preview of that exact site."
- Nigel owns all three origins, so the main blocker (framing headers) is solvable.
- Keeping `project.image` as a graceful fallback means we never regress to a broken card,
  and we reuse existing assets.
- No screenshot pipeline, storage, or third-party cost.

If during discovery the framing headers prove impractical (esp. the Firebase-hosted
`grades.ndsironwood.com`), **fall back to Option B2** (third-party screenshot API) for that
one project, since the data model (§6) supports a per-project preview mode.

## 6. Proposed data model changes (`src/types/index.ts` + `src/data/projects.ts`)

Add an optional, per-project preview descriptor so each card can opt into a mode and we can
mix strategies without code branching at the call site:

```
// types/index.ts (illustrative — not final code)
type ProjectPreview =
  | { mode: "live"; url: string; previewWidth?: number }   // scaled iframe of url
  | { mode: "screenshot"; src: string }                    // remote/generated image url
  | { mode: "image" };                                      // existing static project.image

interface Project {
  // ...existing fields...
  preview?: ProjectPreview;   // default: { mode: "image" } -> current behavior
}
```

- `previewWidth` lets us render the iframe at a desktop viewport (e.g. 1280) then CSS-scale.
- Default/omitted `preview` keeps current static-image behavior → safe, incremental rollout.
- `ProjectCardProps` in `types/index.ts` must also gain `preview?` (currently it only has
  `image?`), and `projects.page.tsx` already spreads `{...p}` so it will pass through.

## 7. Implementation steps (for the chosen Hybrid path)

> Do **not** start coding until §4 questions are answered. When coding, first read:
> `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md`,
> `.../content-security-policy.md`, and `.../incremental-static-regeneration.md`
> (only if a screenshot route is used). Heed Next 16 deprecation notices.

1. **Confirm framing headers.** On each target site, add
   `Content-Security-Policy: frame-ancestors 'self' https://<portfolio-domain>`
   (and remove/relax any `X-Frame-Options: DENY/SAMEORIGIN`). Verify each loads inside an
   iframe from the portfolio's origin. For the Firebase site, set headers via
   `firebase.json` `hosting.headers`. **This is a prerequisite — validate before building UI.**

2. **Extend the type model** (§6): add `ProjectPreview` + `Project.preview` +
   `ProjectCardProps.preview`. Populate `preview: { mode: "live", url, previewWidth: 1280 }`
   for the projects whose headers now allow framing; leave others as `{ mode: "image" }`.

3. **Build a `LivePreview` client component** (`src/components/projects/LivePreview.tsx`,
   `"use client"`):
   - Render inside the existing `aspect-video` container.
   - `IntersectionObserver` to only mount the `<iframe>` when the card scrolls near the
     viewport (perf). Until then, show the static `image` (or a skeleton).
   - Render iframe at fixed `width={previewWidth}` and use a CSS `transform: scale(...)`
     + `transform-origin: top left` wrapper so the desktop render fits the card box.
   - `pointer-events: none`, `tabindex={-1}`, `aria-hidden`, `loading="lazy"`,
     `sandbox` with minimal allowances (e.g. `allow-scripts allow-same-origin` only as
     needed), and `referrerPolicy` as appropriate.
   - `onError` / load-timeout → swap to the static `image` fallback.
   - Respect `prefers-reduced-data` / small viewports → render static `image` instead
     (decide via §4.4/§4.5).

4. **Wire `ProjectCard.tsx`** to switch on `preview?.mode`:
   - `"live"` → `<LivePreview url={...} fallbackImage={image} previewWidth={...} />`
   - `"screenshot"` → `next/image` with the remote src (requires `remotePatterns` entry).
   - `"image"` / undefined → existing `next/image` block (unchanged).
   - Keep the whole card as the outer `Link`; the preview is purely decorative/non-interactive.

5. **`next.config.ts`** — if using Option B2/screenshot mode, add the screenshot host(s) to
   `images.remotePatterns`. (Not needed for pure iframe mode.) Confirm Next 16 remotePatterns
   syntax against `03-api-reference` images docs.

6. **CSP on the portfolio itself** — if the portfolio later adds a CSP, ensure
   `frame-src`/`child-src` allows the three project origins. See
   `02-guides/content-security-policy.md`.

7. **Fallback chain & loading states** — define: skeleton → static image →
   (in view) live iframe; and live iframe error → static image. No card should ever be blank.

## 8. Out of scope (note for later)

- The project **detail page** (`[slug]/page.tsx`) still uses `ImageSlideshow` over
  `screenshots[]`. We *could* add a live embed there too, but keep this change focused on the
  Featured cards on the Projects index. Flag as a follow-up.
- The "Other Work" grid and Interactive Projects section are unaffected.

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Target site blocks framing (esp. Firebase grades site) | Per-project `preview.mode`; fall back to screenshot (B2) or static image for that one |
| Perf: 3 full sites loading on one route | IntersectionObserver lazy-mount; consider live-only for first card, images for rest |
| Site down / slow / header change later | `onError` + timeout → static `image` fallback always present |
| Mobile data cost | Render static image under a breakpoint / on `prefers-reduced-data` |
| Iframe steals scroll/click/focus from the card link | `pointer-events:none`, `aria-hidden`, `tabindex=-1`, overlay |
| Next 16 API drift | Read `node_modules/next/dist/docs/` guides before coding; heed deprecations |
| Sites evolve and look broken at 1280→scaled | `previewWidth` is per-project tunable; QA each |

## 10. Acceptance criteria

- Each featured card configured for `live` mode shows a scaled, current rendering of the real
  site, visually filling the `aspect-video` slot like the old screenshot did.
- Clicking anywhere on the card still navigates to `/projects/{slug}` (preview is inert).
- If a live preview fails to load (header block, network, timeout), the card falls back to the
  existing static `image` with no visible breakage.
- Lighthouse/perf on the Projects route stays within an agreed budget (lazy-loaded previews).
- Projects left in `image` mode render exactly as before (no regression).
- `npm run lint` and `next build` pass; no new TypeScript errors.

## 11. Open questions for Nigel (answer before implementation)

1. True live iframe, or always-fresh *image*? (Option A/C vs B)
2. OK to add `frame-ancestors` headers to all three sites (incl. Firebase config)?
3. Live on all three cards, or only the first / desktop-only?
4. Acceptable to add a third-party screenshot API or `puppeteer`/`@sparticuz/chromium`
   if framing turns out impractical for a given site?
5. Any concern with the embedded sites' own analytics/cookies firing from within the portfolio?
