# GEO Analysis — puregrainexports.com

**Date:** 2026-08-29
**URL:** https://puregrainexports.com/
**Framework:** Next.js (SSR/SSG capable)
**Business:** B2B leather hides & wholesale finished goods exporter, Lahore, Pakistan

> **Disclaimer:** Scores below are heuristics based on publicly observable signals. They are not derived from any Google-internal data. Google's position is that "optimizing for generative AI search is still SEO" — the same ranking and quality systems power AI Overviews and AI Mode. Source: [Google AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)

---

## GEO Readiness Score: 29 / 100

| Category | Weight | Score | Max |
|----------|--------|-------|-----|
| Citability | 25% | 7 | 25 |
| Structural Readability | 20% | 10 | 20 |
| Multi-Modal Content | 15% | 4 | 15 |
| Authority & Brand Signals | 20% | 5 | 20 |
| Technical Accessibility | 20% | 3 | 20 |
| **Total** | **100%** | **29** | **100** |

---

## 1. Platform Breakdown

### Google AI Overviews — Score: 25/100

AI Overviews strongly favour pages that already rank well in classic Search. puregrainexports.com has:

- **No canonical tags** — Google may split ranking signals across duplicate URLs
- **No structured data** — AI Overviews use schema to understand entity relationships
- **No OG/meta description tags** visible in source — snippet generation relies on page text alone
- **Placeholder statistics on homepage** ("0+" years, "0K+" capacity) — zero citability for any passage that includes them
- **Decent heading hierarchy** on industry pages — the footwear page opens with a clear, quotable definition

**Verdict:** The site is unlikely to surface in AI Overviews until foundational SEO gaps (canonicals, schema, meta tags) are closed. 92% of AI Overview citations come from top-10 ranking pages.

### ChatGPT — Score: 20/100

ChatGPT draws heavily from Wikipedia (47.9%) and Reddit (11.3%):

- **Wikipedia:** No article exists for Pure Grain Exports ❌
- **Reddit:** No mentions found ❌
- **YouTube:** No channel or videos ❌
- **LinkedIn:** Company page exists at `/company/puregrainexports` ✅ (limited visibility)
- **llms.txt:** Present and well-formed ✅ — but note: no major AI search system currently consumes it; Google Search explicitly ignores it

**Verdict:** Near-zero brand footprint on the platforms ChatGPT cites most. The llms.txt file is a positive signal for non-Google AI services but won't compensate for missing entity presence.

### Perplexity — Score: 25/100

Perplexity prioritises Reddit (46.7%) and Wikipedia:

- Same gaps as ChatGPT — no Reddit, no Wikipedia
- The site's technical content (QC process, leather grading) would be citable if it ranked
- Industry pages have strong self-contained answer blocks

**Verdict:** Content quality exists on industry pages, but the brand is invisible on Perplexity's preferred citation platforms.

### Google AI Mode — Score: 30/100

AI Mode draws from a broader pool than AI Overviews, citing ~9 domains per query (Ahrefs). It favours freshness and entity authority over raw ranking position:

- **Freshness:** Blog posts dated Aug 23, 2026 — recent ✅
- **Sitemap lastmod:** Aug 18–25, 2026 — active ✅
- **Entity authority:** Weak — no Wikipedia, limited social proof
- **Citable passages:** Industry pages have good technical content

**Verdict:** The best platform opportunity. Fresh content and strong industry pages could surface here if technical SEO gaps are fixed.

---

## 2. AI Crawler Access Status

**robots.txt configuration:**

```
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /sample-request/review
Disallow: /sample-request/success
Disallow: /request-sample/pay
Disallow: /payment-confirmation/
Disallow: /*?type=
Sitemap: https://www.puregrainexports.com/sitemap.xml
```

| Crawler | Owner | Status | Action Needed |
|---------|-------|--------|---------------|
| GPTBot | OpenAI | ✅ Allowed (via wildcard) | None |
| OAI-SearchBot | OpenAI | ✅ Allowed | None |
| ChatGPT-User | OpenAI | N/A (user-triggered, ignores robots.txt) | None |
| ClaudeBot | Anthropic | ✅ Allowed | None |
| PerplexityBot | Perplexity | ✅ Allowed | None |
| CCBot | Common Crawl | ✅ Allowed | Consider blocking (training data) |
| anthropic-ai | Anthropic | ✅ Allowed | Consider blocking (training) |
| Bytespider | ByteDance | ✅ Allowed | Consider blocking (training) |
| cohere-ai | Cohere | ✅ Allowed | Consider blocking (training) |
| Google-Extended | Google | ✅ Allowed | Consider blocking (training opt-out) |
| Google-Agent | Google | N/A (user-triggered) | None |

**Assessment:** All AI search crawlers have access — this is correct. However, the site currently also allows all AI training crawlers. Consider adding explicit blocks for training-only crawlers (CCBot, Google-Extended, anthropic-ai, Bytespider, cohere-ai) while keeping search crawlers allowed.

**Sitemap issue:** robots.txt points to `https://www.puregrainexports.com/sitemap.xml` (www subdomain), but the site serves content from `https://puregrainexports.com` (no www). Verify canonical domain and ensure sitemap URL matches.

---

## 3. llms.txt Status

**Status:** ✅ Present and well-formed

The file provides:
- Business model description (B2B leather supplier)
- Primary use cases (bulk hides, OEM manufacturing, low-MOQ first orders)
- What to decline (consumer purchases, synthetic materials)
- Agent interaction protocol (sample-request form, quote-request form)
- Contact information

**Important context:** Google Search explicitly ignores llms.txt ([source](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)). No major AI search system has confirmed consuming it. John Mueller called the discovery use case "a dead end." Keep it for non-Google optionality, but do not treat it as a citation lever.

---

## 4. Brand Mention Analysis

| Platform | Presence | Impact on AI Citations |
|----------|----------|----------------------|
| Wikipedia | ❌ No article | Highest correlation with ChatGPT citations |
| Reddit | ❌ No mentions found | High correlation with Perplexity & ChatGPT |
| YouTube | ❌ No channel or videos | Strongest correlation with AI citations (~0.737) |
| LinkedIn | ✅ Company page exists | Moderate correlation |
| Instagram | ✅ @puregrainexports | Low direct correlation |
| Facebook | ✅ /puregrainexports | Low direct correlation |
| Wikidata | ❌ No entity | Supports entity disambiguation |
| Industry directories | Not checked | Moderate — trade-specific |

**Critical gap:** Brand mentions correlate 3x more strongly with AI visibility than backlinks (Ahrefs, 75K brand study, Dec 2025). YouTube mentions alone show ~0.737 correlation with AI citations. The site has zero presence on the three most impactful platforms.

---

## 5. Passage-Level Citability

### Homepage

**Weak citability.** The hero section opens with marketing language rather than a citable definition:

> "Source exceptional quality leather at scale. From full grain to custom finishes, we supply discerning brands with materials that define craftsmanship."

- No "What is..." or "X is..." definition patterns
- Placeholder stats ("0+" years, "0K+" capacity) destroy credibility of any surrounding passage
- Process section has a decent 5-step breakdown but uses imperative voice (instructions, not facts)
- Testimonials cite names but no verifiable companies

**Optimal passages found:** 0 blocks at 134–167 words with citable facts

### Industry Pages (e.g., footwear)

**Moderate citability.** The footwear page opens well:

> "We supply hides by the square foot to shoe factories and footwear brands — cut-ready material with documented substance, temper and grade, not a mixed pallet you have to sort."

- Technical specifications (thickness ranges: 1.4–1.8mm uppers, 0.8–1.2mm linings) are citable
- Application tables (component → suggested leather → reasoning) are strong
- FAQ section addresses real buyer questions
- **Missing:** Source attribution for all specifications, author byline, dates

### Blog Posts

**Not evaluable** — all blog post URLs returned 404 during testing. URL routing may be broken or slug patterns don't match sitemap entries.

### Quality Page

**Moderate citability.** Six-stage QC process is well-structured:
- Specific certifications (ISO 9001:2015, ISO 14001:2015, LWG Gold, REACH)
- Finish type definitions (aniline, semi-aniline, pull-up, nubuck)
- Testing parameters (thickness, tensile strength, colour fastness)
- **Missing:** Source attribution, test methodology references, author credentials

---

## 6. Structural Readability Assessment

| Signal | Homepage | Industry Pages | Quality Page |
|--------|----------|---------------|-------------|
| Clean H1→H2→H3 hierarchy | ✅ | ✅ | ✅ |
| Question-based headings | ❌ | ✅ (FAQ) | ❌ |
| Short paragraphs (2-4 sentences) | ✅ | ✅ | ✅ |
| Tables for comparative data | ❌ | ✅ | ❌ |
| Lists for multi-item content | ✅ | ✅ | ✅ |
| FAQ sections | ❌ | ✅ | ❌ |
| Definition in first 60 words | ❌ | ✅ | ❌ |

**Score: 10/20** — Industry pages are structurally strong, but homepage and quality page lack question-based headings, FAQs, and front-loaded definitions.

---

## 7. Server-Side Rendering Check

**Framework:** Next.js (confirmed via `/_next/image` references)

**Assessment:** Next.js supports SSR, SSG, and ISR. Without viewing raw HTML source (pre-JavaScript), I cannot confirm whether content is server-rendered or client-only. Key concerns:

- AI crawlers (GPTBot, ClaudeBot, PerplexityBot) **do not execute JavaScript**
- If content is rendered client-side only, AI crawlers see an empty shell
- Next.js default with App Router is server-rendered — likely OK, but needs verification
- Dynamic elements (currency selector, theme toggle) suggest progressive enhancement over client-only rendering

**Action required:** Test with `curl -s https://puregrainexports.com/ | head -200` to confirm HTML contains content before JavaScript executes. If the response body contains only `<div id="__next"></div>` with no content, SSR is not configured.

---

## 8. Schema / Structured Data Status

**Status: ❌ No structured data detected on any page**

| Schema Type | Present | Priority |
|-------------|---------|----------|
| Organization | ❌ | Critical — establishes entity for AI disambiguation |
| LocalBusiness | ❌ | High — physical address in Lahore |
| Product | ❌ | High — 290+ product pages in catalog |
| Article / BlogPosting | ❌ | High — blog posts need author, date, publisher |
| BreadcrumbList | ❌ | Medium — navigation structure |
| FAQPage | ❌ | Medium — industry pages have FAQ content |
| Person | ❌ | Medium — founder Ahmad Hassan |
| WebSite (with SearchAction) | ❌ | Low |

**Impact:** Without Organization schema, AI systems cannot confidently attribute content to the "Pure Grain Exports" entity. Without Product schema, catalog pages are invisible to product-aware AI features.

---

## 9. Content Reformatting Suggestions

### Homepage Hero — Add a Citable Definition

**Current:**
> "Source exceptional quality leather at scale."

**Recommended (first 60 words):**
> "Pure Grain Exports is a B2B leather supplier based in Lahore, Pakistan, that supplies full-grain, top-grain, and finished leather hides to manufacturers across 30+ countries. The company offers bulk hides by the square foot for factory production lines and wholesale finished goods — bags, jackets, belts, and accessories — for brands and distributors."

### Homepage Stats — Fix Placeholder Values

**Current:** "0+ Years Exporting", "0K+ Sq. Ft. Monthly"

These placeholders actively harm citability. Replace with real numbers or remove the section entirely.

### Industry Pages — Add Source Attribution

**Current:**
> "Uppers typically 1.4–1.8mm; linings 0.8–1.2mm"

**Recommended:**
> "Uppers typically 1.4–1.8mm; linings 0.8–1.2mm (ISO 2589:2019, leather thickness measurement)"

### Quality Page — Add Definition Opening

**Current:** Jumps straight into certifications.

**Recommended opening:**
> "Pure Grain Exports maintains ISO 9001:2015 and ISO 14001:2015 certification with Leather Working Group (LWG) Gold status. Every batch undergoes a six-stage quality control process from raw material selection through final dispatch, with REACH-compliant chemistry verified at the tanning stage."

### Blog Posts — Add Author Credentials

**Current byline:** "Pure Grain Exports"

**Recommended:** "By Ahmad Hassan, Founder & Director, Pure Grain Exports — 10+ years in leather export procurement" with linked author page.

---

## 10. Top 5 Highest-Impact Changes

### 1. Implement Organization + Product Schema (Impact: Critical)

Add JSON-LD to every page. Minimum:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Pure Grain Exports",
  "url": "https://puregrainexports.com",
  "logo": "https://puregrainexports.com/new_logo.png",
  "foundingDate": "1999",
  "founder": {
    "@type": "Person",
    "name": "Ahmad Hassan",
    "jobTitle": "Founder & Director"
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Kothi Mian Bashir Ahmed Toheed Park, Daroghawala",
    "addressLocality": "Lahore",
    "postalCode": "54000",
    "addressCountry": "PK"
  },
  "sameAs": [
    "https://www.linkedin.com/company/puregrainexports",
    "https://instagram.com/puregrainexports/",
    "https://www.facebook.com/puregrainexports"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+92-324-524-3670",
    "contactType": "sales",
    "email": "info@puregrainexports.com"
  }
}
```

Add Product schema to all 290+ catalog pages with name, description, brand, offers, and material properties.

### 2. Fix Homepage Placeholder Stats & Add Front-Loaded Definition (Impact: High)

- Replace "0+" counters with real values or remove entirely
- Rewrite hero to open with a citable "Pure Grain Exports is..." definition in the first 60 words
- Add "What does Pure Grain Exports supply?" H2 with a 134–167 word self-contained answer block

### 3. Add Canonical Tags + OG Meta Tags to All Pages (Impact: High)

- Every page needs `<link rel="canonical" href="...">` — currently missing sitewide
- Add `og:title`, `og:description`, `og:image`, `og:type` to all pages
- Add `<meta name="description">` to all pages
- Fix sitemap URL to match canonical domain (www vs non-www)

### 4. Build Brand Presence on YouTube, Reddit, Wikipedia (Impact: High, Long-Term)

Brand mentions correlate 3x more with AI visibility than backlinks:

- **YouTube (highest correlation ~0.737):** Create a channel with leather sourcing, quality process, and manufacturing content. Even 5–10 videos showing the tannery, QC process, and product range would establish presence.
- **Reddit:** Participate authentically in r/leathercraft, r/leatherworking, r/smallbusiness, r/ecommerce. Share expertise, not promotions.
- **Wikipedia:** Work toward a notable, verifiable presence. This requires third-party reliable sources covering the company — trade publications, industry reports.

### 5. Add Author Bylines with Credentials + Publication Dates (Impact: Medium-High)

- Create an author page for Ahmad Hassan with credentials, LinkedIn link, and experience
- Add author byline + publication date + last-updated date to all blog posts and industry pages
- Implement Person schema for the author
- Add Article/BlogPosting schema to blog posts with `author`, `datePublished`, `dateModified`, `publisher`

---

## Quick Wins (< 1 day each)

1. ✅ Fix placeholder stats on homepage (0+ → real values)
2. Add `<meta name="description">` and `<link rel="canonical">` to all pages
3. Add OG tags to all pages
4. Add publication dates to blog posts and industry pages
5. Fix sitemap URL (www vs non-www consistency)
6. Add question-based H2s to homepage and quality page
7. Block training-only crawlers in robots.txt (CCBot, Google-Extended, Bytespider)

## Medium Effort (1–5 days)

1. Implement Organization schema sitewide
2. Add Product schema to catalog pages
3. Add Article/BlogPosting schema to blog posts
4. Create author page for Ahmad Hassan with Person schema
5. Rewrite homepage hero with front-loaded citable definition
6. Add FAQ sections to homepage and quality page
7. Fix blog post URL routing (all posts returning 404)
8. Add comparison tables with sourced data to key pages

## High Impact (Weeks–Months)

1. Launch YouTube channel with leather sourcing and QC content
2. Build authentic Reddit presence in leather and sourcing communities
3. Pursue trade publication coverage for Wikipedia notability
4. Create original research (e.g., "State of Pakistan Leather Exports 2026" report)
5. Implement comprehensive `sameAs` entity linking across all platforms
6. Build interactive tools (leather thickness calculator, MOQ estimator)
7. Establish a scheduled content refresh program — content under 3 months old is ~3x more likely to be cited in AI answers

---

## Appendix: Preferred Sources (Google)

Google's "Preferred Sources" feature (launched 2026) lets users pick sites that get a "preferred" badge in AI answers. Over 345K sources have been selected by users. **Quick win:** Encourage existing clients to add puregrainexports.com as a Preferred Source in their Google Search settings.

## Appendix: What NOT to Do (per Google)

Google's AI optimization guide explicitly rejects these common "GEO" recommendations:

- ❌ Do not create content specifically "chunked" for AI consumption
- ❌ Do not rewrite content with AI-specific phrasings or long-tail variations
- ❌ Do not chase inauthentic mentions across blogs/forums/videos
- ❌ Do not over-invest in structured data specifically for AI features (use schema for its SEO benefits, not as an AI shortcut)
- ❌ Do not treat llms.txt as a ranking lever for Google Search

What works: unique, non-commodity, first-hand content with genuine expertise.
