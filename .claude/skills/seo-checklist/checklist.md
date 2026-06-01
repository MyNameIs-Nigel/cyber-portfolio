# SEO Checklist (2026)

A comprehensive checklist for Next.js sites and general web projects. Work through each section before launch, then revisit periodically.

Each item is tagged with an **auto-fix disposition** to guide the `seo-checklist` skill:
- 🟢 **FIX** — deterministic, code-level change with one unambiguous correct implementation. Safe to apply automatically.
- 🟡 **ASK** — requires information the agent cannot safely infer (production domain, brand voice, copy, social handles, analytics IDs, design assets, allow/block policy). Propose, but confirm with the user.
- ⚪ **SKIP-ABLE** — only applies to certain site types; mark "not applicable" with a reason when it doesn't fit.

---

## 1. Crawlability & Indexing

### robots.txt
- [ ] 🟢 `robots.txt` exists and is accessible at `/robots.txt`
- [ ] 🟢 Does **not** accidentally block important pages or assets (JS/CSS needed for render)
- [ ] 🟡 Staging/preview environments have `Disallow: /` (never ship `noindex` from staging to prod)
- [ ] 🟡 AI crawler rules configured intentionally (allow or block per-bot):
  - `GPTBot` — OpenAI training
  - `ClaudeBot` / `anthropic-ai` — Anthropic training
  - `PerplexityBot` — Perplexity answers
  - `Google-Extended` — Google AI training
  - `CCBot` — Common Crawl (feeds many LLMs)
  - `Bytespider` — ByteDance/TikTok
- [ ] 🟢 **Next.js:** Use `app/robots.ts` (auto-serves at `/robots.txt`, supports env-aware config)
- [ ] 🟢 `Sitemap:` directive in robots.txt points to the absolute sitemap URL

### XML Sitemap
- [ ] 🟡 Sitemap exists and is submitted to Google Search Console + Bing Webmaster Tools
- [ ] 🟢 Only includes canonical URLs with a 200 status — no 404s, redirects, or noindexed pages
- [ ] 🟢 `lastModified` dates are accurate (freshness signal for crawlers)
- [ ] 🟢 `changeFrequency` and `priority` set appropriately
- [ ] 🟢 Dynamic routes are included (blog posts, product pages, etc.)
- [ ] ⚪ Sitemap index used when > 50,000 URLs or > 50 MB (split into multiple sitemaps)
- [ ] ⚪ Dedicated image / video sitemap entries if media discovery matters
- [ ] 🟢 **Next.js:** Use `app/sitemap.ts` (auto-serves at `/sitemap.xml`); generate dynamic entries from data sources

### Canonical URLs
- [ ] 🟢 Every page has a self-referencing canonical tag pointing to its preferred URL
- [ ] 🟡 www vs. non-www is consistent — one redirects to the other (301)
- [ ] 🟢 Trailing slash is consistent across the entire site (`trailingSlash` in `next.config`)
- [ ] 🟡 **Next.js:** Set `metadataBase` in root layout — required for canonicals and OG images to resolve as absolute URLs (needs the real production domain)

```ts
// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://yourdomain.com'),
  alternates: { canonical: '/' },
}
```

### noindex Hygiene
- [ ] 🟢 Audit every page with a `noindex` tag — confirm each is intentional
- [ ] 🟢 Internal search results, admin pages, and staging paths are noindexed
- [ ] 🟢 Production build does not inherit `noindex` from a dev/staging config
- [ ] 🟢 Pages return `robots` directives like `max-image-preview:large`, `max-snippet:-1` to maximise rich previews where desired

---

## 2. Metadata

### Title Tags
- [ ] 🟢 Every page has a unique, descriptive title tag
- [ ] 🟡 Primary keyword appears naturally in the title
- [ ] 🟡 Length is 50–60 characters (avoids truncation in SERPs)
- [ ] 🟢 **Next.js:** Use the title template pattern to automatically append your brand name:

```ts
title: {
  template: '%s | Your Brand',
  default: 'Your Brand — Tagline',
}
```

### Meta Descriptions
- [ ] 🟡 Every page has a unique meta description
- [ ] 🟡 140–160 characters — written for humans, not just crawlers
- [ ] 🟡 Describes the page accurately and includes a natural call to action
- [ ] 🟢 No keyword stuffing

### Open Graph
- [ ] 🟢 `og:title`, `og:description`, `og:url`, `og:type` on every page
- [ ] 🟡 `og:image` on every page (recommended: 1200×630px)
- [ ] 🟢 `og:site_name` and `og:locale` set
- [ ] 🟢 OG image is an absolute URL (requires `metadataBase` in Next.js)
- [ ] ⚪ Article pages add `article:published_time`, `article:modified_time`, `article:author`
- [ ] 🟢 **Next.js:** Use `opengraph-image.tsx` file convention for auto-generated OG images per route
- [ ] 🟡 Test with [opengraph.xyz](https://www.opengraph.xyz) or Facebook Sharing Debugger

### Twitter / X Card
- [ ] 🟢 `twitter:card` set to `summary_large_image`
- [ ] 🟢 `twitter:title`, `twitter:description`, `twitter:image` present
- [ ] 🟡 `twitter:creator` and `twitter:site` set if applicable
- [ ] **Note:** Twitter card metadata is separate from OG even where values overlap

### Favicons, Icons & PWA
- [ ] 🟢 Favicon present (`app/icon.tsx`/`favicon.ico`); `apple-touch-icon` (`app/apple-icon.tsx`) for iOS
- [ ] 🟢 `theme-color` set (via the `viewport` export `themeColor`)
- [ ] ⚪ Web app manifest (`app/manifest.ts`) for installable/PWA experience
- [ ] ⚪ `mask-icon` / monochrome icon for Safari pinned tabs

### Additional Meta
- [ ] 🟢 `<html lang="en">` (or appropriate language code) set on root element
- [ ] 🟢 Viewport meta tag present (`width=device-width, initial-scale=1`)
- [ ] 🟢 **Next.js:** Viewport + `themeColor` are configured via the `viewport` export, not inside `metadata`
- [ ] ⚪ `authors`, `creator`, `publisher` fields populated in metadata where relevant
- [ ] Note: `meta keywords` is ignored by Google — do **not** add it (⚪ skip).

---

## 3. Internationalization (i18n)

Only applies to multi-language / multi-region sites — otherwise ⚪ skip with a note.

- [ ] ⚪ `hreflang` alternates declared for every localized URL (`alternates.languages` in Next.js metadata)
- [ ] ⚪ A self-referencing `hreflang` plus an `x-default` entry
- [ ] ⚪ `<html lang>` reflects the served locale per route
- [ ] ⚪ `og:locale` + `og:locale:alternate` for translated pages
- [ ] ⚪ Locale routing strategy is consistent (sub-path `/en`, subdomain, or domain) and reflected in the sitemap

---

## 4. Structured Data (JSON-LD)

Structured data is one of the strongest signals for both traditional SERP rich results and appearing in AI-generated answers (ChatGPT, Gemini, Perplexity). Add only schema types that match real content — never fabricate ratings, reviews, or business facts (Google penalizes this).

- [ ] 🟡 **Organization** schema on homepage / root layout — name, URL, logo, `sameAs` social profiles, contact
- [ ] ⚪ **WebSite** schema with `SearchAction` (enables sitelinks search box) if the site has internal search
- [ ] 🟢 **BreadcrumbList** schema on all non-root pages (pairs with breadcrumb UI)
- [ ] ⚪ **FAQPage** schema on any genuine FAQ sections (enables rich result dropdowns)
- [ ] ⚪ **Article / BlogPosting** on posts — `headline`, `datePublished`, `dateModified`, `author`, `image`
- [ ] ⚪ **Person / ProfilePage** on About page if a personal/consultant site (`sameAs`, `jobTitle`, `knowsAbout`)
- [ ] ⚪ **LocalBusiness** schema if a physical or local business (NAP: name, address, phone)
- [ ] ⚪ **Product** + `Offer` + `AggregateRating`/`Review` for e-commerce (only with real data)
- [ ] ⚪ **VideoObject**, **HowTo**, **Event**, **JobPosting**, **Recipe** where matching content exists
- [ ] 🟢 Use a connected `@graph` with `@id` references rather than scattered, duplicated nodes
- [ ] 🟡 Validated with [Google Rich Results Test](https://search.google.com/test/rich-results) + [Schema.org validator](https://validator.schema.org)
- [ ] 🟢 **Next.js:** Inject in a Server Component via `<script type="application/ld+json">` with `dangerouslySetInnerHTML` — renders in initial HTML, fully crawlable

```tsx
// Example: Organization schema in app/layout.tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Your Brand",
    "url": "https://yourdomain.com",
    "logo": "https://yourdomain.com/logo.png",
    "sameAs": ["https://github.com/you", "https://linkedin.com/in/you"],
  })}}
/>
```

---

## 5. Core Web Vitals (CWV)

Google's page experience signals. Check real-world data in Search Console, not just Lighthouse lab scores.

### LCP — Largest Contentful Paint (target: < 2.5s)
- [ ] 🟢 Hero image has `priority` prop (`<Image priority />`) — disables lazy loading for above-the-fold images
- [ ] 🟢 All images use `next/image` for automatic AVIF/WebP conversion, sizing, and lazy loading
- [ ] 🟢 Fonts load without blocking render — use `next/font` (or `@fontsource` with `display: swap`)
- [ ] 🟢 Server-side rendered content (not client-only) so crawlers and users get HTML immediately
- [ ] 🟡 `preconnect`/`dns-prefetch` for critical third-party origins; `preload` the LCP asset if not handled by `next/image`

### CLS — Cumulative Layout Shift (target: < 0.1)
- [ ] 🟢 All images have explicit `width` and `height` (or `fill` with a sized parent)
- [ ] 🟢 `next/font` used to prevent Flash of Unstyled Text (FOUT) and reserve font metrics
- [ ] 🟢 Space is reserved for dynamically loaded content (ads, embeds, async components)

### INP — Interaction to Next Paint (target: < 200ms)
- [ ] 🟡 JavaScript bundle audited with `@next/bundle-analyzer`
- [ ] 🟢 Non-critical scripts deferred (`next/script` with `strategy="lazyOnload"` or `"afterInteractive"`)
- [ ] 🟡 Heavy client-side libraries are code-split (`next/dynamic`) or removed where possible
- [ ] 🟢 Minimize client components — prefer Server Components to cut shipped JS

### Delivery
- [ ] ⚪ Compression (gzip/brotli) and a CDN in front of static assets (often handled by host/Vercel)
- [ ] 🟢 Long-lived cache headers on immutable/static assets

---

## 6. On-Page SEO

### Headings
- [ ] 🟢 One `<h1>` per page — matches (or closely reflects) the title tag
- [ ] 🟢 Heading hierarchy is logical: H1 → H2 → H3, no skipped levels
- [ ] 🟡 Each H2/H3 is followed by content that directly answers what the heading implies (AI citation pattern)

### Content Quality
- [ ] 🟡 Content is substantive, original, and matches search intent (no thin pages)
- [ ] 🟡 Visible "last updated" date on time-sensitive content (freshness)
- [ ] ⚪ Long-form pages have an anchored table of contents for deep links / jump-to citations

### URL Structure
- [ ] 🟢 Slugs are short, descriptive, and lowercase
- [ ] 🟢 Words separated by hyphens (not underscores, not spaces)
- [ ] 🟡 Primary keyword appears in the slug where natural
- [ ] 🟢 No stop words, special characters, or auto-generated IDs in slugs
- [ ] 🟢 **Next.js:** App Router folder names become URL segments — name them intentionally

### Images
- [ ] 🟡 Every meaningful image has descriptive alt text
- [ ] 🟢 Decorative images have empty alt text (`alt=""`) so screen readers skip them
- [ ] 🟢 No keyword stuffing in alt text
- [ ] 🟡 Image filenames are descriptive (`hero-bookkeeping-dashboard.webp` not `IMG_4832.jpg`)
- [ ] 🟢 `next/image` `sizes` set for responsive images so the right resolution is served

### Internal Linking
- [ ] 🟡 Related pages link to each other with descriptive anchor text
- [ ] 🟢 Anchor text describes the destination ("view our pricing" not "click here")
- [ ] 🟡 No orphan pages (every page is reachable via at least one internal link)
- [ ] 🟡 High-priority pages receive more internal links
- [ ] 🟢 Use `next/link` for internal navigation (enables prefetching + keeps links in the DOM)

### External Links
- [ ] 🟢 Outbound links opening in new tabs use `rel="noopener noreferrer"` / `target="_blank"`
- [ ] 🟡 Paid, sponsored, or affiliate links use `rel="nofollow"` or `rel="sponsored"`

---

## 7. Accessibility (doubles as SEO)

- [ ] 🟢 Semantic HTML used throughout: `<main>`, `<nav>`, `<article>`, `<section>`, `<header>`, `<footer>`
- [ ] 🟢 `<html lang="...">` attribute set
- [ ] 🟡 All interactive elements are keyboard-accessible with visible focus states
- [ ] 🟡 Color contrast meets WCAG AA minimum
- [ ] 🟢 Navigation links are in the DOM — not JS-only / hidden behind a control crawlers can't open
- [ ] 🟢 Skip-to-content link present for keyboard users
- [ ] 🟢 Forms have associated `<label>` elements
- [ ] 🟢 Images/icons that convey meaning have text alternatives; `aria-label` on icon-only buttons
- [ ] ⚪ `prefers-reduced-motion` respected for animations

---

## 8. Mobile-First

Google indexes the mobile version first.

- [ ] 🟢 Responsive layout — no fixed widths causing horizontal scroll on small viewports
- [ ] 🟡 Tap targets ≥ 44×44px with adequate spacing
- [ ] 🟡 Font sizes legible without zoom (≥ 16px body)
- [ ] 🟢 Same primary content + metadata served to mobile and desktop (no mobile-only hiding of indexable content)

---

## 9. Redirects & Error Pages

- [ ] 🟢 **404 page** — `app/not-found.tsx` returns actual HTTP 404 status. Helpful, with links back to main content.
- [ ] 🟢 **500 / error page** — `app/error.tsx` + `app/global-error.tsx` prevent blank pages on server errors (blank pages can trigger deindexing)
- [ ] 🟡 **301 redirects** configured for any changed URLs — use `redirects()` in `next.config`
- [ ] ⚪ **410 Gone** returned for permanently deleted pages (tells crawlers to drop URL faster than a 404)
- [ ] 🟡 Any old URLs with backlinks pointing to them are 301'd to the closest relevant live page
- [ ] 🟢 No redirect chains (A → B → C — collapse to A → C)
- [ ] 🟢 No soft 404s (pages that return 200 but say "not found")

---

## 10. Security & Trust (E-E-A-T)

Google and AI systems both weight Experience, Expertise, Authoritativeness, and Trust signals.

- [ ] 🟡 HTTPS enforced — no mixed-content warnings in DevTools
- [ ] 🟢 Security headers via `headers()` in `next.config`: HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and a CSP where feasible
- [ ] ⚪ Privacy policy page exists and is linked in the footer
- [ ] ⚪ Terms of service / legal pages present if applicable
- [ ] 🟡 About page with real information about the person or company
- [ ] 🟡 Contact page with a working method of contact
- [ ] ⚪ Author bios on blog posts / articles
- [ ] ⚪ Physical address listed if a local or service business
- [ ] ⚪ GDPR/CCPA-compliant cookie consent if collecting any user data

---

## 11. AI & Generative Engine Optimization (GEO) — 2026

Traditional SEO still forms the foundation, but these additional signals affect visibility in ChatGPT, Perplexity, Gemini, and other AI answer engines.

- [ ] 🟡 `robots.txt` AI bot rules are deliberate (you can allow AI answers but block training data separately)
- [ ] 🟡 `llms.txt` file at `/llms.txt` — emerging standard describing your site for LLM ingestion
- [ ] 🟡 Content is structured so each heading is followed by a direct, quotable answer
- [ ] 🟡 Schema markup is complete (AI systems heavily use structured data for citations)
- [ ] 🟡 E-E-A-T signals are strong (see section 10 — same signals, amplified for AI)
- [ ] 🟢 Pages are primarily server-rendered HTML — AI crawlers often don't execute JavaScript

---

## 12. Analytics & Monitoring

- [ ] 🟡 **Google Search Console** — site verified, sitemap submitted
- [ ] 🟡 **Bing Webmaster Tools** — verified + sitemap submitted (also powers ChatGPT search)
- [ ] 🟡 Search Console monitored for: Coverage errors, CWV failures, Rich Result issues, Manual actions
- [ ] 🟡 **GA4 or privacy-first alternative** (Plausible, Fathom) installed and tracking organic traffic
- [ ] 🟢 Analytics scripts loaded with `next/script` (`strategy="afterInteractive"`) to avoid CWV impact
- [ ] ⚪ **IndexNow** integrated to instantly notify Bing/Yandex of new or changed URLs
- [ ] ⚪ **Lighthouse CI** integrated in deployment pipeline to catch SEO regressions on every PR
- [ ] 🟡 Rich Results Test run on key pages after any structured data changes

---

## 13. Next.js-Specific File Conventions

Quick reference for built-in SEO files in the App Router:

| File | Serves at | Purpose |
|---|---|---|
| `app/robots.ts` | `/robots.txt` | Crawler access rules |
| `app/sitemap.ts` | `/sitemap.xml` | URL index for crawlers |
| `app/manifest.ts` | `/manifest.webmanifest` | PWA + mobile experience |
| `app/opengraph-image.tsx` | `/opengraph-image` | Auto-generated OG image |
| `app/twitter-image.tsx` | `/twitter-image` | Auto-generated Twitter card image |
| `app/icon.tsx` | `/icon` / favicon | Favicon |
| `app/apple-icon.tsx` | `/apple-icon` | iOS touch icon |
| `app/not-found.tsx` | Any 404 | Custom 404 page |
| `app/error.tsx` | Route-level 500 | Custom error boundary |
| `app/global-error.tsx` | Root 500 | Catches errors in root layout |

Metadata APIs: the `metadata` object / `generateMetadata()` for tags, the `viewport` export for viewport + `themeColor`, and `alternates` for canonical + `hreflang`.

---

## 14. Pre-Launch Final Checks

- [ ] 🟡 View page source on key pages — confirm critical content is in the initial HTML (not JS-rendered)
- [ ] 🟡 Open DevTools → Network → confirm no 404s on assets (broken images, fonts, scripts)
- [ ] 🟡 Test OG image preview: [opengraph.xyz](https://www.opengraph.xyz)
- [ ] 🟡 Validate structured data: [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] 🟡 Run Lighthouse audit on homepage, key landing pages, and a blog/content page
- [ ] 🟡 Submit sitemap in Google Search Console + Bing Webmaster Tools
- [ ] 🟢 Confirm `metadataBase` resolves all OG and canonical URLs to absolute paths
- [ ] 🟡 Check mobile rendering — Google indexes the mobile version first
- [ ] 🟢 `npm run build` succeeds and `npm run lint` is clean after SEO changes

---

*Last updated: June 2026. Sources: DebugBear, Semrush, Next.js docs, Google Search Central, Schema.org.*
