# SEO Action Plan — puregrainexports.com
**Generated:** 2026-08-16 | **Health Score: 36/100**

---

## Priority Legend
- 🔴 **Critical** — Blocks indexing or causes penalties. Fix immediately.
- 🟠 **High** — Significantly impacts rankings. Fix within 1 week.
- 🟡 **Medium** — Optimization opportunity. Fix within 1 month.
- 🔵 **Low** — Nice to have. Backlog.

---

## Phase 1 — Critical Fixes (Week 1)

| # | Action | Priority | Effort | Category |
|---|--------|----------|--------|----------|
| 1 | Add self-referencing canonical tags to every page via Next.js layout | 🔴 Critical | 2h dev | Technical |
| 2 | Fix duplicate title tags on `/contact` and `/catalog/raw-leather` — add unique `metadata` exports | 🔴 Critical | 1h dev | On-Page |
| 3 | Remove `temp_logo.png` from production; consolidate to single optimized WebP logo | 🔴 Critical | 1h dev | Performance |
| 4 | Add `Organization` JSON-LD to site layout (renders on all pages) | 🔴 Critical | 2h dev | Schema |
| 5 | Create `/public/llms.txt` with company overview and key page index | 🔴 Critical | 15min | AI Search |
| 6 | Add alt text to `hero-leather-warm.jpg` and `hero-leather-espresso.jpg` | 🔴 Critical | 15min dev | Images |
| 7 | Generate dynamic sitemap including all product pages (`/sitemap-products.xml`) | 🔴 Critical | 3h dev | Technical |
| 8 | Rename `/admin-ahmza` to non-descriptive path; update robots.txt | 🔴 Critical | 1h dev | Security |

**Phase 1 Total Effort: ~10 hours dev + 1 hour copy**

---

## Phase 2 — High-Impact Improvements (Weeks 2–3)

| # | Action | Priority | Effort | Category |
|---|--------|----------|--------|----------|
| 9 | Write unique meta descriptions for all pages (About, Quality, Contact, Industries, Catalog, Blog index, all product pages) | 🟠 High | 4h copy | On-Page |
| 10 | Add `Product` JSON-LD to all product detail pages (dynamic, server-generated) | 🟠 High | 4h dev | Schema |
| 11 | Add `BlogPosting` JSON-LD to all blog posts | 🟠 High | 1h dev | Schema |
| 12 | Add `BreadcrumbList` JSON-LD to catalog and product pages | 🟠 High | 2h dev | Schema |
| 13 | Add `FAQPage` JSON-LD to About page FAQ section | 🟠 High | 1h dev | Schema |
| 14 | Add Open Graph + Twitter Card meta tags to all pages; dynamically generate `og:image` for products | 🟠 High | 3h dev | Technical |
| 15 | Shorten homepage title to under 60 characters | 🟠 High | 15min | On-Page |
| 16 | Fix duplicate API calls on homepage (SWR/React Query deduplication of `raw-leather-types` × 4) | 🟠 High | 2h dev | Performance |
| 17 | Convert hero images to WebP; add `priority` prop to first slide's `<Image>` | 🟠 High | 2h dev | Performance |
| 18 | Run `next build --analyze`; lazy-load below-fold components with `next/dynamic` | 🟠 High | 4h dev | Performance |

**Phase 2 Total Effort: ~19 hours dev + 4 hours copy**

---

## Phase 3 — Content & Authority (Month 2)

| # | Action | Priority | Effort | Category |
|---|--------|----------|--------|----------|
| 19 | Expand all 4 blog posts to 1,200+ words with evidence, subheadings, and internal links | 🟠 High | 8h copy | Content |
| 20 | Assign all blog posts to named author (Ahmad Hassan); add author bio section | 🟠 High | 2h copy + 1h dev | Content |
| 21 | Add 3–5 internal links per blog post pointing to relevant catalog pages | 🟠 High | 2h copy | Content |
| 22 | Publish 2 new blog posts targeting: "leather hides wholesale supplier" and "leather exporter Pakistan" | 🟠 High | 6h copy | Content |
| 23 | Add hreflang tags (en / x-default) to all pages | 🟡 Medium | 1h dev | Technical |
| 24 | Implement geo-IP currency detection; default to USD for international visitors | 🟡 Medium | 3h dev | UX / Technical |
| 25 | Add `Review` and `AggregateRating` schema to homepage testimonials | 🟡 Medium | 1h dev | Schema |
| 26 | Add `WebSite` schema with `SearchAction` to homepage | 🟡 Medium | 30min dev | Schema |
| 27 | Assign primary keyword per page; update H1 and opening paragraph for keyword targeting | 🟡 Medium | 4h copy | On-Page |

**Phase 3 Total Effort: ~7 hours dev + 22 hours copy**

---

## Phase 4 — Monitoring & Iteration (Ongoing)

| # | Action | Priority | Effort |
|---|--------|----------|--------|
| 28 | Submit sitemap to Google Search Console; verify indexation | 🟠 High | 30min |
| 29 | Monitor Core Web Vitals in CrUX (GSC > Experience > Core Web Vitals) | 🟡 Medium | Ongoing |
| 30 | Publish 2 blog posts per month on buyer-intent topics | 🟡 Medium | 6h/month copy |
| 31 | Track rankings: "leather hides wholesale", "leather exporter Pakistan", "B2B leather supplier [country]" | 🟡 Medium | Setup 2h |
| 32 | Set up SEO drift monitoring for homepage, catalog, about, quality pages | 🔵 Low | 2h setup |
| 33 | Review AI Overview appearance for brand queries quarterly | 🔵 Low | Quarterly |

---

## ROI Priority Order

For maximum SEO impact per hour invested, tackle in this order:

1. **Canonical tags** — prevents Google from splitting ranking signals across duplicate URLs
2. **Organization schema** — entity recognition for all AI and traditional search
3. **Product sitemap** — gets 100+ product pages indexed and ranked
4. **Meta descriptions** — direct CTR improvement across all SERP listings
5. **Product schema** — rich product snippets for catalog pages
6. **Blog content expansion** — longtail keyword capture and E-E-A-T
7. **Performance optimization** — Core Web Vitals ranking factor
8. **OG tags** — social traffic and branded perception

---

# ✅ Implementation Log — Phase 1 Technical SEO (2026-08-16)

All **Technical SEO** items from the audit are implemented. Verified against a
running server, not assumed.

## Root cause the audit saw only the symptoms of

The audit reported "Contact and Catalog pages using homepage default title" as a
duplicate-title issue. The underlying cause was structural: **9 customer-facing
pages are `"use client"`, and a client component cannot export `metadata` in the
App Router**, so they silently inherited the root layout's title and description.

Fixed with a passthrough `layout.tsx` per client route segment, each exporting
metadata built by the new `lib/seo.ts` → `pageMetadata()` helper. Server pages
call the same helper, so every page emits one consistent tag set.

## Completed

| # | Action | Status | Evidence |
|---|--------|--------|----------|
| 1 | Self-referencing canonicals on every page | ✅ | 15/15 pages verified |
| 2 | Unique titles on `/contact`, `/catalog`, everywhere | ✅ | 15/15 unique, all ≤60 chars |
| 7 | Dynamic sitemap incl. all product pages | ✅ | **526 URLs** (was ~20) |
| 8 | Admin path no longer disclosed in robots.txt | ✅ | see below |
| — | Meta descriptions on all pages | ✅ | 15/15 |
| 14 | Open Graph + Twitter Card on all pages | ✅ | 15/15 incl. `og:image` |
| 23 | hreflang (`en` + `x-default`) | ✅ | emitted as `hrefLang` by Next |
| 15 | Homepage title under 60 chars | ✅ | 74 → **50** |
| 6 | Hero image alt text | ✅ | all 3 slides (was 1 of 3) |
| 17 | Hero images optimised | ✅ | 310KB JPEG → **92KB AVIF** |

### Sitemap: 20 → 526 URLs

```
finished PRODUCT pages    319
raw-leather PRODUCT pages 187
static pages               16
blog posts                  4
```

Excluded on purpose: filtered `?type=` views (canonicalised to parent),
transactional routes (noindex), and `/privacy-policy` (see below).

### robots.txt — the security finding

`Disallow: /admin-ahmza` was removed. Disallow was never the right control:

- it only asks well-behaved crawlers not to *crawl*; it does not prevent indexing
- a URL blocked by robots.txt can still be indexed from external links, and
  because Google cannot fetch it, it cannot see a `noindex` on it either
- and a public file that names your admin URL simply advertises it

Replaced with `X-Robots-Tag: noindex, nofollow, noarchive` from `middleware.ts`
(covers the client-component admin layout *and* JSON API responses, which a
`<meta>` tag cannot), plus `noindex` metadata on `/admin-login`.

**The admin path was NOT renamed.** That is a routing change with real breakage
risk (bookmarks, the middleware matcher) and is your call — the noindex controls
above close the SEO/disclosure exposure without it.

## Found during the work — not in the audit

- **Duplicate privacy pages.** `/privacy` (linked in the footer) *and*
  `/privacy-policy` (orphaned legacy copy, nothing links to it, not in the
  sitemap) were **both indexable** and competing. `/privacy-policy` is now
  `noindex` with a canonical to `/privacy`. Safe to delete once you confirm no
  external links.
- **Raw-leather product pages had no metadata at all** — 187 URLs sharing the
  homepage title. The audit only noted they were missing from the sitemap. They
  now generate per-hide title, description, canonical and OG image.
- **Transactional routes were indexable** (`/request-sample/pay`,
  `/sample-request/review`, `/sample-request/success`, `/payment-confirmation`).
  All noindex now.
- **`images: { unoptimized: true }` in `next.config.mjs`** — a v0.dev scaffold
  leftover that disabled Next's image optimizer entirely. This is the real cause
  of "all images served as JPEG/PNG — should be WebP" and a large share of the
  4.4s load. Now enabled with AVIF/WebP, and `res.cloudinary.com` allowlisted
  (verified: all 523 remote image URLs in the DB are Cloudinary). `sharp` moved
  to `dependencies` since production needs it.

## Not done — deliberately

| Item | Why |
|---|---|
| Rename `/admin-ahmza` | Routing change; your decision. Exposure already closed via noindex. |
| Blog expansion to 1,200+ words (#19–22) | Phase 3 copywriting, not technical. |
| JSON-LD schema (#4, #10–13) | Separate Schema category — next chunk of work. |
| Dedupe homepage API calls (#16) | Phase 2 performance; needs SWR/React Query. |
| Bundle analysis / `next/dynamic` (#18) | Phase 2 performance. |
| Geo-IP currency default (#24) | Phase 3 UX. |

**`temp_logo.png` + `new_logo.png` is not a bug.** The audit assumed one was
leftover. Both are required — dark-ink logo for light surfaces, light-ink for the
transparent header over dark hero photography. Their declared dimensions were
wrong though (180×50 = 3.6:1 vs the real 4.15:1), which is now corrected.

## Verification performed

- 15/15 pages: unique title ≤60 chars, canonical, description, `og:title`,
  `og:image`, `twitter:card`, hreflang
- `robots.txt` fetched — no admin disclosure
- `sitemap.xml` parsed — 526 URLs, 0 duplicates, no noindex URLs listed
- `X-Robots-Tag` confirmed on `/admin-ahmza`; `noindex` confirmed on all 5
  transactional/duplicate routes
- Image optimizer confirmed serving AVIF for both local and Cloudinary sources
- Zero console errors on `/`, `/about`, `/quality`, `/contact` (fresh sessions)
- No horizontal overflow at 375 / 1024 / 1920
- `tsc --noEmit` clean; `pnpm build` **exit code 0**

### Known dev-only warnings (not defects)

- framer-motion "container has a non-static position" on the three scroll-linked
  pages. DOM inspection confirms section, target and offsetParent are all
  `relative`; the scroll-drawn progress rails work correctly. Pre-dates this work.
- `sticker.png detected as LCP` on PolicyHero pages — those heroes have no image,
  so the 88px floating badge is the largest *image* candidate while the true LCP
  is the `<h1>` text. Adding `priority` would preload a decorative badge ahead of
  real content, so it was left off deliberately.
- Pre-existing, unrelated: `Module not found: Can't resolve 'fs'` from
  `lib/utils/invoicePdfGenerator.ts` imported by the admin reports page (a client
  component importing a Node-only module). Non-blocking; worth fixing separately.
