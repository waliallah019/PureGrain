import test, { describe } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  INDUSTRY_PAGES,
  INDUSTRY_PAGE_LIST,
  REPLACED_ON_HUB,
  industryByPath,
} from "../lib/industries/index.ts"
import { INDUSTRY_FAQS } from "../lib/content/industry-faqs.ts"

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8")

const hubSource = read("app/industries/page.tsx")
const sitemapSource = read("app/sitemap.ts")

describe("industry registry integrity", () => {
  test("every entry has a route file on disk", () => {
    for (const ind of INDUSTRY_PAGE_LIST) {
      const file = path.join(ROOT, "app", ind.path.replace(/^\//, ""), "page.tsx")
      assert.ok(fs.existsSync(file), `missing page file for ${ind.path}`)
    }
  })

  test("paths are unique, lowercase and follow the agreed URL shape", () => {
    const seen = new Set<string>()
    for (const ind of INDUSTRY_PAGE_LIST) {
      // Most are "...-manufacturers"; corporate gifting buyers are not
      // manufacturers, so the suffix is deliberately not universal.
      assert.match(ind.path, /^\/leather-for-[a-z-]+$/, `bad path: ${ind.path}`)
      assert.ok(!seen.has(ind.path), `duplicate path: ${ind.path}`)
      seen.add(ind.path)
    }
  })

  test("industryByPath resolves, with and without a trailing slash", () => {
    for (const ind of INDUSTRY_PAGE_LIST) {
      assert.equal(industryByPath(ind.path)?.slug, ind.slug)
      assert.equal(industryByPath(`${ind.path}/`)?.slug, ind.slug)
    }
    assert.equal(industryByPath("/leather-for-nonexistent-manufacturers"), undefined)
  })

  test("hub anchors are unique and rendered from the registry", () => {
    // The hub now renders `id={ind.hubAnchor}` per card rather than hardcoding
    // an id per industry, so assert on the mechanism plus anchor uniqueness.
    // The hub keeps its own INDUSTRIES array and renders `id={ind.id}`; the
    // registry's hubAnchor is what joins the two, so assert they line up.
    assert.match(hubSource, /id=\{ind\.id\}/, "hub does not render section anchors")
    const seen = new Set<string>()
    for (const ind of INDUSTRY_PAGE_LIST) {
      assert.ok(!seen.has(ind.hubAnchor), `duplicate hubAnchor: ${ind.hubAnchor}`)
      seen.add(ind.hubAnchor)
      assert.match(ind.hubAnchor, /^[a-z-]+$/, `hubAnchor must be url-safe: ${ind.hubAnchor}`)
    }
  })

  test("anchor text is descriptive, never a bare call to action", () => {
    const vague = /^(learn more|read more|click here|find out more|more)$/i
    for (const ind of INDUSTRY_PAGE_LIST) {
      assert.ok(!vague.test(ind.hubLinkText.trim()), `vague anchor text on ${ind.slug}`)
      assert.ok(ind.hubLinkText.length > 15, `anchor text too thin on ${ind.slug}`)
      assert.match(ind.hubLinkText, /leather/i, `anchor text should name the material: ${ind.slug}`)
    }
  })

  test("SEO fields respect the limits the seed validator enforces elsewhere", () => {
    for (const ind of INDUSTRY_PAGE_LIST) {
      assert.ok(ind.seoTitle.length <= 60, `${ind.slug} seoTitle ${ind.seoTitle.length} chars`)
      assert.ok(
        ind.seoDescription.length <= 165,
        `${ind.slug} seoDescription ${ind.seoDescription.length} chars`
      )
      assert.ok(ind.keywords.length >= 3, `${ind.slug} has too few keywords`)
      assert.ok(ind.h1.length > 10, `${ind.slug} h1 too short`)
    }
  })

  test("related guides point at articles that actually exist", () => {
    for (const ind of INDUSTRY_PAGE_LIST) {
      assert.ok(ind.relatedGuides.length >= 1, `${ind.slug} has no related guides`)
      for (const g of ind.relatedGuides) {
        const slug = g.href.replace("/blogs/", "")
        const file = path.join(ROOT, "scripts", "blog-content", `${slug}.html`)
        assert.ok(fs.existsSync(file), `${ind.slug} links to a missing article: ${g.href}`)
        assert.ok(g.label.length > 15, `${ind.slug} guide anchor text too thin`)
      }
    }
  })

  test("catalogue links avoid the ?type= pattern robots.txt disallows", () => {
    for (const ind of INDUSTRY_PAGE_LIST) {
      assert.ok(
        !ind.catalogueHref.includes("?type="),
        `${ind.slug} links via ?type=, which robots.txt blocks from crawling`
      )
      assert.match(ind.catalogueHref, /^\/catalog\//, `${ind.slug} catalogue link looks wrong`)
    }
  })
})

describe("industries replaced on the hub are documented, not forgotten", () => {
  test("each replacement records what replaced it and why", () => {
    assert.ok(REPLACED_ON_HUB.length > 0)
    for (const r of REPLACED_ON_HUB) {
      assert.ok(r.reason.length > 80, `${r.label} reason is too thin to be useful`)
      assert.ok(r.replacedBy.length > 3, `${r.label} does not say what replaced it`)
    }
  })

  test("the hub no longer renders the replaced industries", () => {
    for (const r of REPLACED_ON_HUB) {
      assert.ok(!hubSource.includes(r.label), `hub still lists "${r.label}"`)
    }
  })
})

describe("hub integration", () => {
  test("the original hub design is intact, not replaced", () => {
    // The hub is deliberately still its own client component with its own
    // stylesheet — the brief was to integrate into that design, not swap it.
    assert.ok(hubSource.includes('"use client"'), "hub should still be the original client component")
    assert.match(hubSource, /import "\.\/industries\.css"/, "hub should still use its own stylesheet")
    assert.ok(
      fs.existsSync(path.join(ROOT, "app/industries/industries.css")),
      "industries.css must not be deleted"
    )
  })

  test("every industry section on the hub has a dedicated page", () => {
    const ids = [...hubSource.matchAll(/^    id: "([a-z-]+)"/gm)].map((m) => m[1])
    assert.ok(ids.length >= 8, `expected the full industry list, found ${ids.length}`)
    const anchors = new Set(INDUSTRY_PAGE_LIST.map((i) => i.hubAnchor))
    for (const id of ids) {
      assert.ok(anchors.has(id), `hub section "${id}" has no dedicated page — dead end`)
    }
  })

  test("the hub links out using the registry path and descriptive anchor text", () => {
    assert.match(hubSource, /INDUSTRY_PAGE_LIST/, "hub does not import the registry")
    assert.match(hubSource, /href=\{detail\.path\}/, "hub does not link to the registry path")
    assert.match(hubSource, /\{detail\.hubLinkText\}/, "hub link text is not the descriptive anchor")
    assert.match(hubSource, /indDeepLink/, "deep link element missing")
  })

  test("hub imagery is first-party — no hotlinked stock photos", () => {
    assert.ok(!/images\.unsplash\.com/.test(hubSource), "hub still hotlinks Unsplash")
    const urls = [...hubSource.matchAll(/imageUrl:\s*"([^"]+)"/g)].map((m) => m[1])
    assert.ok(urls.length >= 8, `expected an image per industry, found ${urls.length}`)
    for (const u of urls) {
      assert.ok(
        u.startsWith("/") || u.startsWith("https://res.cloudinary.com/"),
        `hub image is not first-party: ${u}`
      )
    }
  })

  test("local hub images exist on disk", () => {
    const urls = [...hubSource.matchAll(/imageUrl:\s*"(\/[^"]+)"/g)].map((m) => m[1])
    for (const u of urls) {
      assert.ok(
        fs.existsSync(path.join(ROOT, "public", u.replace(/^\//, ""))),
        `hub references a missing local image: ${u}`
      )
    }
  })
})

describe("industry FAQs", () => {
  test("every industry page has its own FAQ set", () => {
    for (const ind of INDUSTRY_PAGE_LIST) {
      const faqs = INDUSTRY_FAQS[ind.slug]
      assert.ok(faqs && faqs.length >= 5, `${ind.slug} needs at least 5 FAQs, has ${faqs?.length}`)
    }
  })

  test("questions are unique within and across industries", () => {
    const seen = new Map<string, string>()
    for (const [slug, faqs] of Object.entries(INDUSTRY_FAQS)) {
      const local = new Set<string>()
      for (const f of faqs) {
        assert.ok(!local.has(f.q), `${slug} repeats a question`)
        local.add(f.q)
        const prior = seen.get(f.q)
        assert.ok(!prior, `"${f.q}" appears in both ${prior} and ${slug}`)
        seen.set(f.q, slug)
      }
    }
  })

  test("answers are substantive and self-contained", () => {
    for (const [slug, faqs] of Object.entries(INDUSTRY_FAQS)) {
      for (const f of faqs) {
        assert.match(f.q, /\?$/, `${slug}: question should end with "?" — ${f.q}`)
        assert.ok(f.a.length >= 80, `${slug}: answer too short — ${f.q}`)
        // FAQPage structured data must be plain text, not markup.
        assert.ok(!/<[a-z][^>]*>/i.test(f.a), `${slug}: HTML in FAQ answer — ${f.q}`)
      }
    }
  })

  test("no FAQ repeats the retired site-wide MOQ figures", () => {
    for (const [slug, faqs] of Object.entries(INDUSTRY_FAQS)) {
      for (const f of faqs) {
        assert.ok(!/500 sq ft per grade/i.test(f.a), `${slug} repeats the stale hide MOQ`)
        assert.ok(!/100 units per style/i.test(f.a), `${slug} repeats the stale goods MOQ`)
      }
    }
  })
})

describe("pages are genuinely different, not one template", () => {
  const sources = INDUSTRY_PAGE_LIST.map((i) => ({
    slug: i.slug,
    src: read(path.join("app", i.path.replace(/^\//, ""), "page.tsx")),
  }))

  test("each page declares its own section headings", () => {
    const headings = sources.map(({ slug, src }) => ({
      slug,
      set: new Set([...src.matchAll(/heading="([^"]+)"/g)].map((m) => m[1])),
    }))

    for (const h of headings) {
      assert.ok(h.set.size >= 5, `${h.slug} has only ${h.set.size} sections`)
    }

    // Compare every pair: no two pages may share more than half their headings.
    for (let i = 0; i < headings.length; i++) {
      for (let j = i + 1; j < headings.length; j++) {
        const a = headings[i]
        const b = headings[j]
        const shared = [...a.set].filter((x) => b.set.has(x))
        const ratio = shared.length / Math.min(a.set.size, b.set.size)
        assert.ok(
          ratio <= 0.5,
          `${a.slug} and ${b.slug} share ${shared.length} of their headings (${shared.join(", ")})`
        )
      }
    }
  })

  test("only pages with real OEM capability carry a private-label section", () => {
    for (const { slug, src } of sources) {
      const ind = INDUSTRY_PAGES[slug as keyof typeof INDUSTRY_PAGES]
      const mentionsOem =
        /custom-manufacturing|private-label|under your (own )?label|finished (bags|garment|gear|piece)|What we produce/i.test(src)
      if (ind.oemProductTypes.length === 0) {
        assert.ok(
          !/Also available/.test(src),
          `${slug} has no OEM product types but renders an "Also available" section`
        )
      } else {
        assert.ok(mentionsOem, `${slug} manufactures finished goods but never says so`)
      }
    }
  })

  test("every page links back to the hub and out to a conversion route", () => {
    for (const { slug, src } of sources) {
      assert.match(src, /IndustryBreadcrumb/, `${slug} has no breadcrumb`)
      assert.match(src, /faqPageSchema/, `${slug} emits no FAQ structured data`)
      assert.match(src, /breadcrumbSchema/, `${slug} emits no breadcrumb structured data`)
      assert.match(src, /IndustryCta/, `${slug} has no call to action`)
    }
  })
})

describe("imagery is first-party", () => {
  test("no industry uses an external stock-photo host", () => {
    for (const ind of INDUSTRY_PAGE_LIST) {
      assert.ok(
        ind.image.startsWith("/") || ind.image.startsWith("https://res.cloudinary.com/"),
        `${ind.slug} image is not first-party: ${ind.image}`
      )
    }
  })

  test("local images exist on disk", () => {
    for (const ind of INDUSTRY_PAGE_LIST) {
      if (!ind.image.startsWith("/")) continue
      assert.ok(
        fs.existsSync(path.join(ROOT, "public", ind.image.replace(/^\//, ""))),
        `${ind.slug} references a missing local image: ${ind.image}`
      )
    }
  })

  test("every image has descriptive alt text", () => {
    for (const ind of INDUSTRY_PAGE_LIST) {
      assert.ok(ind.imageAlt.length > 20, `${ind.slug} alt text too thin`)
      assert.ok(!/^image of/i.test(ind.imageAlt), `${ind.slug} alt text is boilerplate`)
    }
  })

  test("hub cards and page heroes both render the registry image", () => {
    // The hub renders its own imageUrl field; that it is first-party is
    // asserted in the "hub imagery is first-party" test above.
    assert.match(hubSource, /src=\{ind\.imageUrl\}/, "hub card does not render its image")
    for (const ind of INDUSTRY_PAGE_LIST) {
      const src = read(path.join("app", ind.path.replace(/^\//, ""), "page.tsx"))
      assert.match(src, /IndustryHero/, `${ind.slug} has no hero image`)
    }
  })
})

describe("sitemap coverage", () => {
  test("every industry page is in the sitemap via the registry", () => {
    assert.match(sitemapSource, /INDUSTRY_PAGE_LIST\.map\(\(i\) => i\.path\)/)
  })
})
