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

---

# ✅ Implementation Log — Schema / Structured Data (2026-08-18)

Audit score for this category was **2/100** — "The site has zero structured
data. No JSON-LD exists on any page."

All of it now emits from `lib/schema.tsx`.

## What ships

| Entity | Where | Source of truth |
|---|---|---|
| `Organization` | every page | `lib/site.ts` (real address, phone, email, socials) |
| `WebSite` + `SearchAction` | every page | points at the catalogue's real `?q=` search |
| `Product` | 506 product detail pages | the product/hide record |
| `BlogPosting` | every blog post | the Blog document |
| `BreadcrumbList` | catalogue, product, blog, about, quality, contact, industries, custom-manufacturing, sample/quote request | route hierarchy |
| `FAQPage` | About, Quality | `lib/content/faqs.ts` |

Entities are emitted as **one `@graph` per page** and linked by `@id`, so the
Organization is the `seller` on every Offer and the `publisher` of every post —
one connected graph rather than isolated fragments.

## Decisions worth knowing

**FAQ copy was extracted to `lib/content/faqs.ts`.** It previously lived inside
the two `"use client"` page components. Google requires FAQPage markup to match
the visible answers; duplicating the copy for the schema would have guaranteed
drift. The accordion and the JSON-LD now read the same array.

**Offers are omitted when there is no price**, rather than emitting `price: 0`.
Google requires a price on an Offer — a zero would be invalid markup, not a
graceful fallback.

**Blog `author` falls back to the Organization** when `authorName` is the
default "Pure Grain Team". Inventing a `Person` for E-E-A-T would be fabricating
a credential; attributing to the company is accurate.

**Breadcrumbs are emitted from pages, not from the shared layouts.** First
attempt put them in `app/catalog/layout.tsx` and the two listing layouts — but a
layout wraps its nested routes, so product detail pages emitted *two* competing
BreadcrumbLists. Caught by a duplicate-entity check; now every route emits
exactly one.

## Deliberately NOT implemented: Review / AggregateRating

The action plan lists this as item #25. **It should not be added**, and the
homepage testimonials should not be marked up:

- Google's structured-data policy disallows **self-serving reviews** — reviews
  about your own business, collected and displayed by you, are not eligible for
  Organization rich results.
- Marking them up anyway is a common trigger for a *manual action* for spammy
  structured data, which would hurt far more than the stars would help.
- The testimonials are also unverifiable (no review platform behind them).

If star ratings are wanted, the route is a third-party review platform
(Google Business Profile, Trustpilot) and marking up **their** aggregate, not
ours. Flagging so #25 is closed as a decision rather than left as an open task.

## Verification

- 11 public routes + 2 product detail routes + blog post: **every JSON-LD block
  parses**, has `@context`, and passes required-field checks (Product has name,
  Offers have price, breadcrumb positions are sequential 1..n, FAQPage has
  questions)
- **Zero duplicate entities** on any route
- Spot-checked live output: `Dragonfly Margalla Suede` → Product with
  `sku`, `category: Suede`, `offers 6.02 USD / InStock`, 7 spec properties, real
  Cloudinary images; blog post → BlogPosting with real `datePublished` and
  `@id`-linked publisher
- `tsc --noEmit` clean · `pnpm build` **exit 0**

## Remaining SEO backlog

Content and performance only — the technical and schema layers are done:
blog expansion to 1,200+ words (#19–22), homepage API call dedupe (#16),
bundle analysis / `next/dynamic` (#18), geo-IP currency default (#24).

---

# ✅ Implementation Log — On-Page SEO (2026-08-18)

Audit score for this category was **32/100**. Two of its four gaps were already
closed in the technical pass (duplicate titles on /contact and /catalog; the
74-char homepage title). This covers the rest.

## Fixed

**Two pages had no H1 at all.** `/sample-request` and `/quote-request` opened
with an `<h2>`, so neither had a declared primary topic. `/quote-request` also
imported `PageBanner` (which renders an H1) without ever using it. Both now have
an H1 — a semantic change only; the visual size is unchanged.

Audited result — **12/12 pages now have exactly one H1**, with a sensible
H2/H3 tree beneath it.

**Keyword targeting mapped to pages** (action item #27). H1 and opening
paragraph now carry the same target term as the page's title/description, so the
on-page copy agrees with the metadata instead of drifting from it:

| Page | Was | Now |
|---|---|---|
| `/catalog/raw-leather` | "Premium Leather Hides" | **Leather Hides Wholesale** |
| `/catalog/finished-products` | "Finished Leather Products" | **Wholesale Finished Leather Goods** |
| `/blogs` | "Pure Grain Blogs" (brand only) | **Leather Sourcing Guides & Industry Insights** |
| `/sample-request` | *(no H1)* | **Request Free Leather Samples** |
| `/quote-request` | *(no H1)* | **Request a Wholesale Leather Quote** |

**Blog → catalogue internal linking** (action item #21). Posts had **zero**
internal links and were crawl dead-ends passing no equity to the commercial
pages. New `components/blog/RelatedCatalogue.tsx` renders on every post:
**0 → 4 onward links each** (`/catalog/raw-leather`,
`/catalog/finished-products`, `/sample-request`, `/quality`) with descriptive
anchor text.

Relevance is data-driven: the post's own tags are matched against the live
`RawLeatherType` / `ProductType` taxonomies. Blog tags today are descriptive
phrases ("full grain leather") rather than type names ("Nubuck"), so the
tag-matched row correctly renders nothing for current posts and the two
catalogue hubs still show. Unit-tested the matcher so the path is not dead
code — tags `veg tan` → Veg Tan, `nubuck care` → Nubuck, `wallet` → Wallet.

**Why a component, not rewritten post copy.** Item #21 describes editing the
posts themselves. That is copywriting in the client's editorial voice, and
inventing sentences purely to hang links on would be putting words in their
mouth. The component achieves the same SEO outcome from real data. In-body
contextual links remain a genuine copy task.

**Leftover palette drift:** the shipping Badge on `/sample-request` was still
raw Tailwind `amber-100/amber-800` — missed in the earlier consistency sweep
because it was inside a `<Badge>`. Now on brass tokens, dark-mode aware.

## Bug I introduced and fixed

Promoting the `/sample-request` heading, I used `heading-section` (text-3xl)
where the page was designed at `heading-subsection` (text-2xl). At 375px the
heading measured **333px against a 327px grid track**, overflowing the page
horizontally. Caught by the responsive sweep, traced to the exact element.

Fixed by restoring the intended size (the H1 change should have been semantic
only) and adding `min-w-0` to both grid columns — a grid item defaults to
`min-width: auto`, which is what let content push it past its track.

## Not done — and why

**Blog posts are 99–157 words** (the audit estimated 150–250; measured, they are
thinner still). That is Content item #19, ~8h of copywriting, and it is the
single biggest remaining constraint on these posts ranking. No amount of
on-page markup compensates for a 120-word article. Not something to fake.

## Verification

- **12/12 pages: exactly one H1**, keyword-aligned on all five target pages
- **4/4 blog posts: ≥3 onward internal links** (was 0)
- No horizontal overflow at 375 / 768 / 1920 on every changed page
- `tsc --noEmit` **exit 0** · `pnpm build` **exit 0**

---

# ✅ Implementation Log — Remaining dev items + hero rework (2026-08-19)

## #5 llms.txt — done

`/public/llms.txt`, served 200 as `text/plain`. Company overview, what we sell,
certifications, key-page index, trade terms and contact. Includes a note telling
AI systems to take figures from the page they appear on rather than aggregating
across pages — a hedge against the unresolved 25+/10+ years contradiction.

## #16 Duplicate API calls — done, measured

New `lib/taxonomy.ts`: a module-level **promise cache**. The first caller starts
the request and stores the promise; concurrent callers await that same in-flight
promise. No new dependency and no provider to wire (SWR/React Query would have
needed both).

Homepage API requests, measured in-browser:

| Endpoint | Before | After |
|---|---|---|
| `raw-leather-types` | **4×** | **1×** |
| `product-types` | **2×** | **1×** |
| **Total requests** | **11** | **7** |

Callers routed through the cache: Header, Catalog mega-menu, Footer, homepage,
and both catalogue listing pages. Failed requests are not cached, so a transient
error does not poison the value for the session.

## #18 Bundle — partially done, with an honest result

**Found and removed 4 dead shadcn primitives**: `ui/carousel`, `ui/calendar`,
`ui/drawer`, `ui/command` were imported by **zero files** while pulling in
`embla-carousel-react`, `react-day-picker`, `vaul` and `cmdk`.

Result — **peer-dependency warnings went 4 → 1** (only
`multer-storage-cloudinary` wanting cloudinary ^1.21.0 remains). That closes
most of the peer noise from the earlier deploy failure.

**But First Load JS did not change.** Those primitives were already tree-shaken
out of the route bundles, so the win is dependency hygiene and install size, not
delivered bytes. Reporting that plainly rather than claiming a bundle win.

### Not done: removing axios from the 3 heaviest public routes

`/quote-request` (248 kB), `/custom-manufacturing` (240 kB) and
`/sample-request` (~249 kB) sit ~25–35 kB above every other public route, and
`axios` is the differentiator — it is imported by exactly those three and by
nothing else public.

Replacing it with native `fetch` would trim them, **but those are the three
lead-capture forms**, including FormData file uploads on custom-manufacturing.
It means rewriting submission and error handling on the paths that capture the
business's actual enquiries, and verifying it properly means submitting real
forms into the live database. That trade — ~13 kB gzipped per route against
silently risking lead capture — is not one to make inside a sweep. It should be
a focused change with deliberate form testing.

## #24 Geo-IP currency — closed, audit claim does not reproduce

The audit states "Currency defaults to PKR for all visitors." Verified:

- `/api/detect-currency` returns `{"currency":"USD","country":"US"}`
- the code fallback in `CurrencyContext` is `"USD"`
- `NEXT_PUBLIC_BASE_CURRENCY=USD`

Geo-IP detection already works. Closing this rather than spending 3h on it —
worth one confirmation from a non-US IP.

## Reported performance regression — investigated, did not reproduce

Two claims were raised. Neither holds against the codebase or measurement:

**"New API call `review?type=HIDE` taking 6.7s."** There is no `/api/review`
route anywhere in the project, and the homepage makes **zero** requests matching
`review` (measured). The only `HIDE`-shaped thing is `/sample-request/review`, a
**page** in the sample checkout flow that reads a `"HIDE" | "FINISHED_PRODUCT"`
mode from the tray — pre-existing, and not called from the homepage.

**"Hero first slide has no `priority` prop."** It does —
`priority={i === 0}` in `HeroSlider.tsx`. Confirmed working: Next emits
`<link rel="preload" as="image">` for `hero-leather-warm.jpg` in `<head>` with
the full responsive srcset.

Measured homepage: **7 API requests, 0 slow resources (>1500ms), load ~3.1–4.1s
in dev.** The 4.4 → 9.7s regression does not reproduce here. If it is real in
production it is coming from something outside this codebase.

## Hero rework

Removed as requested:
- play/pause and prev/next **icon buttons** — on mobile they sat on the artwork
  and added nothing swipe does not
- the standing proof row (*25+ Years · 40+ Countries · ISO 9001 · Free Samples*)
  — the trust strip directly beneath the hero states the same four facts, so it
  was repeating itself inside one screen height

Replaced with **information rather than chrome**: a slide counter showing
position and the active slide's own label (`02 / 03 — ARTISAN CRAFTSMANSHIP`)
over a hairline rule that fills across the autoplay window.

Copy redistributed — the section is now a flex column with the copy centred in a
`flex-1` row and the indicator on its own bottom row, and height reduced from
`100svh` to `86/92svh` so the composition reads deliberate rather than sparse
now that two blocks were removed.

**Accessibility note:** the three counter segments are still real `<button>`s,
and arrow-key navigation was added on the carousel region. Removing *every*
control would leave an auto-rotating carousel keyboard-inoperable and fails WCAG
2.2.2 (Pause, Stop, Hide). Autoplay also still pauses on hover/focus-within and
is disabled entirely under `prefers-reduced-motion`. Verified: 3 buttons, 1 SVG
(the CTA arrow) — no icon controls remain.

## Verification

- `llms.txt` 200, `text/plain`, 3.7 kB
- Homepage: **7 API calls**, no duplicates, **0 console errors**
- No horizontal overflow: 5 pages × 3 widths (375/768/1440)
- Hero under reduced-motion: content visible, keyboard-operable
- `tsc --noEmit` **exit 0** · `pnpm build` **exit 0**
