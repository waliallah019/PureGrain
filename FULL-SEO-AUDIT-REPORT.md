# Full SEO Audit Report — puregrainexports.com
**Date:** 2026-08-16
**Auditor:** Claude SEO (claude-seo:seo-audit)
**URL:** https://www.puregrainexports.com/

---

## Executive Summary

**SEO Health Score: 36 / 100 — Needs Significant Improvement**

Pure Grain Exports is a well-built B2B leather export platform with strong brand positioning, solid content on core pages, and a clean site structure. However, the SEO layer is almost entirely missing: zero canonical tags, zero structured data, most pages lack meta descriptions, product pages are absent from the sitemap, and blog content is too thin to rank or be cited.

The good news: this is a fixable situation with high ROI. Most critical issues are technical implementation gaps — not content strategy failures — and can be resolved in one to two weeks of focused development effort.

### Business Context
- **Type:** B2B leather wholesaler / exporter
- **Location:** Lahore, Pakistan (established ~1999)
- **Target:** Manufacturers in footwear, furniture, automotive, fashion, accessories
- **Markets:** 40+ countries across 6 continents
- **Platform:** Next.js SPA
- **Certifications:** ISO 9001, ISO 14001, LWG, REACH

---

## SEO Health Score Breakdown

| Category | Weight | Score | Contribution |
|----------|--------|-------|-------------|
| Technical SEO | 22% | 38 | 8.4 |
| Content Quality | 23% | 44 | 10.1 |
| On-Page SEO | 20% | 32 | 6.4 |
| Schema / Structured Data | 10% | 2 | 0.2 |
| Performance (CWV) | 10% | 35 | 3.5 |
| AI Search Readiness | 10% | 22 | 2.2 |
| Images | 5% | 68 | 3.4 |
| **TOTAL** | **100%** | **–** | **34.2 → 36/100** |

---

## Top 5 Critical Issues

### 1. No Canonical Tags Anywhere (Technical — Critical)
Zero `<link rel="canonical">` tags across the entire site. With a catalog that uses query parameters for filtering (e.g., `?type=Nubuck`), Google sees dozens of duplicate URLs. Without canonical signals, ranking signals are split across URL variants.

**Fix:** 1–2 hours dev. Add canonical to Next.js layout. Point filtered URLs → parent URL.

---

### 2. No Structured Data / JSON-LD (Schema — Critical)
Not a single JSON-LD block exists on any page. The site has rich entity information (business, products, testimonials, FAQs) that could generate rich results but is invisible to Google's entity understanding.

**Fix:** 3–6 hours dev. Add Organization (sitewide), Product (product pages), BlogPosting (blog posts), BreadcrumbList (catalog), FAQPage (about).

---

### 3. Product Pages Not in Sitemap (Technical — Critical)
The sitemap lists 20 static pages. Hundreds of individual product pages (e.g., `/catalog/raw-leather/6a74b3836ada5f2cb0a84af1`) are completely absent. Google cannot efficiently discover these pages.

**Fix:** 3 hours dev. Dynamic sitemap generation with Next.js.

---

### 4. Blog Content 150–250 Words — Extremely Thin (Content — Critical)
All 4 blog posts contain critically thin content (150–250 words each), all published on the same day (April 18, 2026). Google's Helpful Content System is specifically designed to demote this type of bulk-posted, thin content.

**Fix:** 2 hours copywriting per post to expand to 1,200+ words with expertise, evidence, and internal links.

---

### 5. Admin Path Disclosed in robots.txt (Security — Critical)
`robots.txt` explicitly names `/admin-ahmza` and `/admin-login`, revealing admin URL patterns to anyone who reads the file. This is a common reconnaissance step for attackers.

**Fix:** 1 hour dev. Rename to non-descriptive path; add IP allowlist protection.

---

## Top 5 Quick Wins

| # | Win | Time |
|---|-----|------|
| 1 | Add canonical tags to all pages via Next.js layout | 2h dev |
| 2 | Fix duplicate titles on Contact and Catalog pages | 1h dev |
| 3 | Add Organization JSON-LD to site layout | 2h dev |
| 4 | Write meta descriptions for all pages | 4h copy |
| 5 | Create /llms.txt file | 15min |

---

## Technical SEO (Score: 38/100)

**Strengths:** HTTPS ✅ | TTFB 101ms ✅ | CLS 0.0 ✅ | Mobile viewport ✅ | Robots.txt ✅ | Sitemap pointer ✅

**Gaps:**
- No canonical tags (Critical)
- Admin path in robots.txt (Critical — security)
- Product pages missing from sitemap (Critical)
- Duplicate title tags — Contact and Catalog pages using homepage default title (High)
- Page load 4.4 seconds — heavy JS bundle execution (High)
- 12 API calls on homepage, 6 duplicates (High)
- temp_logo.png + new_logo.png in production (High)
- No hreflang tags for global targeting (Medium)
- No OG/Twitter Card tags (Medium)
- Currency defaults to PKR for all visitors (Medium)

---

## Content Quality (Score: 44/100)

**Strengths:** About page (~2,500 words) ✅ | Quality page (~3,000 words, certifications cited) ✅ | Industries page (~3,000 words, 9 sectors) ✅ | Named testimonials ✅ | Specific credentials stated ✅

**Gaps:**
- Blog posts: 150–250 words each — far below Google's Helpful Content threshold (Critical)
- Zero internal links within blog content (Critical)
- No meta descriptions on About, Quality, Contact, Industries, blogs, products (High)
- No named author / E-E-A-T signals on blog posts (High)
- Only 4 blog posts total — insufficient longtail coverage (High)
- All blogs published same day — signals bulk upload (Medium)

---

## On-Page SEO (Score: 32/100)

**Strengths:** Single H1 on homepage ✅ | Good heading hierarchy on main pages ✅ | 49 internal links on homepage ✅ | Blog titles are unique and descriptive ✅

**Gaps:**
- Contact and Catalog pages have duplicate homepage title (Critical)
- No keyword targeting strategy mapped to specific pages (Critical)
- Homepage title 74 chars — exceeds 60-char SERP display limit (High)
- No internal linking from blog to catalog pages (High)

---

## Schema / Structured Data (Score: 2/100)

**The site has zero structured data.** No JSON-LD exists on any page.

Missing and required:
- `Organization` — sitewide (Critical)
- `Product` — all product detail pages (Critical)
- `BlogPosting` — all blog posts (Critical)
- `BreadcrumbList` — catalog and product pages (High)
- `FAQPage` — About page (High)
- `Review` / `AggregateRating` — homepage testimonials (Medium)
- `WebSite` with `SearchAction` — homepage (Medium)

---

## Performance / Core Web Vitals (Score: 35/100)

| Metric | Measured | Target | Status |
|--------|----------|--------|--------|
| TTFB | 101ms | < 800ms | ✅ Excellent |
| DCL | 1,655ms | < 2,000ms | 🟡 Marginal |
| Load Complete | 4,444ms | < 3,000ms | 🔴 Poor |
| CLS | 0.0 | < 0.1 | ✅ Perfect |
| LCP | Not captured | < 2.5s | ⚠️ At risk |

**Root cause of slow load:** 16 JS bundles taking 2–4 seconds each; 12 API fetch calls on homepage load; hero images not optimized.

---

## AI Search Readiness (Score: 22/100)

**What AI systems can use:** Quality page certifications, industries content, business details.

**What's blocking AI citation:**
- No `llms.txt` (Critical)
- No entity schema for AI knowledge graph (Critical)
- Blog posts too thin for AI citation (150–250 words) (High)
- "Pure Grain Team" author — no named expert for credibility (High)

---

## Images (Score: 68/100)

**Strengths:** Most product/category images have descriptive alt text ✅

**Gaps:**
- 2 hero images missing alt text (High)
- All images served as JPEG/PNG — should be WebP (Medium)
- Dual logo files in production (`temp_logo.png`, `new_logo.png`) (High)

---

## Sitemap Coverage

| Section | In Sitemap | Notes |
|---------|-----------|-------|
| Static pages | ✅ 7 pages | Homepage, About, Contact, Privacy, Terms, Quality |
| Blog posts | ✅ 4 posts | All current posts included |
| Catalog index | ✅ 3 URLs | /catalog, /catalog/raw-leather, /catalog/finished-products |
| Service pages | ✅ 3 URLs | /custom-manufacturing, /quote-request, /sample-request |
| Individual products | ❌ 0 pages | Hundreds of product URLs absent |
| Filtered catalog views | ❌ 0 URLs | Not appropriate (use canonical instead) |

---

## Robots.txt Analysis

```
User-Agent: *
Allow: /
Disallow: /admin-ahmza        ← ⚠️ Reveals admin path
Disallow: /admin-ahmza/*
Disallow: /admin-login        ← ⚠️ Standard path — acceptable
Disallow: /api
Disallow: /api/*

Sitemap: https://www.puregrainexports.com/sitemap.xml  ✅
```

---

## Competitive Positioning Notes

Pure Grain is competing globally for queries like:
- "leather hides wholesale supplier"
- "B2B leather exporter"
- "leather manufacturer Pakistan"
- "[type] leather bulk wholesale"

Current SEO state means Google cannot properly categorize or rank this site for these queries because:
1. No entity markup to identify what the business is
2. No product markup to understand what's being sold
3. No keyword-mapped title/meta strategy
4. Product pages not indexed via sitemap

Competitors with even basic SEO implementation will outrank Pure Grain despite potentially inferior product quality.

---

## Implementation Roadmap

```
Week 1  → Critical technical fixes (canonical, schema entity, sitemap, security)
Weeks 2–3 → On-page completion (meta, OG tags, product schema, performance)
Month 2 → Content strategy (blog expansion, author attribution, internal linking)
Ongoing → Content calendar, monitoring, iteration
```

---

*Full category findings in `findings/` directory.*
*Prioritized action plan with effort estimates in `ACTION-PLAN.md`.*
*Structured audit data in `audit-data.json` (compatible with report generator).*
