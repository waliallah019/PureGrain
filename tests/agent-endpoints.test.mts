import test, { describe, before } from "node:test"
import assert from "node:assert/strict"

/**
 * End-to-end verification of the agent-readiness surface against a running
 * server.
 *
 *   BASE_URL=http://localhost:3000 node --test tests/agent-endpoints.test.mts
 *
 * Defaults to http://localhost:3000. Point BASE_URL at the deployed origin to
 * verify production after a release.
 */

const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "")

const MD = "text/markdown"
const HTML = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"

async function get(path: string, accept?: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: accept ? { Accept: accept } : {},
    redirect: "manual",
  })
  return {
    status: res.status,
    type: res.headers.get("content-type") || "",
    vary: res.headers.get("vary") || "",
    body: await res.text(),
  }
}

/** Vary is a comma-separated, case-insensitive token list. */
function varyIncludesAccept(vary: string): boolean {
  return vary
    .toLowerCase()
    .split(",")
    .map((t) => t.trim())
    .includes("accept")
}

before(async () => {
  try {
    await fetch(BASE, { method: "HEAD" })
  } catch {
    throw new Error(`No server reachable at ${BASE}. Start one, or set BASE_URL.`)
  }
})

describe("1. Agent-friendly 404s", () => {
  test("a nonexistent path returns a real 404", async () => {
    const res = await get("/some-path-that-does-not-exist")
    assert.equal(res.status, 404, "must be 404, never 200 with the app shell")
  })

  test("the HTML 404 returns a real 404, never a 500", async () => {
    // A custom app/not-found.tsx currently 500s in this project — see
    // docs/KNOWN-ISSUE-custom-404.md for the full bisect. It is parked at
    // docs/not-found.tsx.disabled, so HTML clients get Next's built-in 404.
    // The status is what matters most: a 500 tells a crawler "retry later"
    // and keeps a dead URL alive in the index, which is the failure mode the
    // audit was guarding against.
    const res = await get("/some-path-that-does-not-exist", HTML)
    assert.equal(res.status, 404, "must be 404, never 500 and never 200")
    assert.match(res.type, /text\/html/)
  })

  test("recovery links are served to agents on the Markdown 404", async () => {
    // The audit asked for a Markdown body pointing agents at the sitemap; that
    // requirement is met on the negotiated response rather than the HTML one.
    const res = await get("/some-path-that-does-not-exist", MD)
    assert.equal(res.status, 404)
    assert.match(res.body, /llms\.txt/, "404 should name llms.txt")
    assert.match(res.body, /sitemap\.xml/, "404 should name the sitemap")
    assert.match(res.body, /robots\.txt/, "404 should name robots.txt")
  })

  test("the Markdown 404 body is Markdown and lists recovery links", async () => {
    const res = await get("/some-path-that-does-not-exist", MD)
    assert.equal(res.status, 404)
    assert.match(res.type, /text\/markdown/)
    assert.match(res.body, /^# 404/m)
    assert.match(res.body, /\/llms\.txt/)
    assert.match(res.body, /\/sitemap\.xml/)
    assert.ok(!/<[a-z][^>]*>/i.test(res.body), "Markdown 404 must not contain HTML tags")
  })

  test("a nonexistent blog slug 404s rather than rendering an empty article", async () => {
    const res = await get("/blogs/definitely-not-a-real-article", MD)
    assert.equal(res.status, 404)
  })

  test("deep nonexistent paths also 404", async () => {
    for (const p of ["/a/b/c", "/catalog/nope", "/blogs/x/y"]) {
      const res = await get(p)
      assert.equal(res.status, 404, `${p} should 404`)
    }
  })
})

describe("2. Markdown content negotiation (acceptmarkdown.com)", () => {
  const negotiable = ["/", "/about", "/quality", "/catalog/raw-leather", "/blogs", "/contact"]

  for (const path of negotiable) {
    test(`${path} serves Markdown for Accept: text/markdown`, async () => {
      const res = await get(path, MD)
      assert.equal(res.status, 200)
      assert.match(res.type, /text\/markdown/, `got ${res.type}`)
      assert.match(res.type, /charset=utf-8/)
      assert.ok(res.body.trim().startsWith("#"), "Markdown should open with a heading")
      assert.ok(!/<!DOCTYPE/i.test(res.body), "HTML document leaked into the Markdown variant")
    })

    test(`${path} sets Vary: Accept on the Markdown variant`, async () => {
      const res = await get(path, MD)
      assert.ok(varyIncludesAccept(res.vary), `Vary was "${res.vary}"`)
    })

    test(`${path} still serves HTML to a browser, with Vary: Accept`, async () => {
      const res = await get(path, HTML)
      assert.equal(res.status, 200)
      assert.match(res.type, /text\/html/)
      assert.ok(varyIncludesAccept(res.vary), `Vary was "${res.vary}"`)
    })
  }

  test("a published article converts to Markdown with its metadata", async () => {
    const res = await get("/blogs/how-to-verify-leather-supplier", MD)
    assert.equal(res.status, 200)
    assert.match(res.type, /text\/markdown/)
    assert.match(res.body, /^# /m)
    assert.match(res.body, /\*\*Canonical URL:\*\*/)
    assert.match(res.body, /\*\*Published:\*\*/)
    assert.ok(!res.body.includes("{{pg:"), "unresolved catalogue token in Markdown")
    assert.ok(!/<[a-z][^>]*>/i.test(res.body), "raw HTML leaked into article Markdown")
  })

  test("catalogue prices in Markdown come from the live catalogue", async () => {
    const res = await get("/blogs/custom-leather-wallet-manufacturer", MD)
    assert.equal(res.status, 200)
    // Token-rendered figures are currency amounts; the literal token must be gone.
    assert.ok(!res.body.includes("{{pg:"))
    assert.match(res.body, /\$\d/, "expected a rendered price figure")
  })

  test("unsupported Accept types are rejected with 406", async () => {
    for (const accept of ["application/json", "image/png"]) {
      const res = await get("/", accept)
      assert.equal(res.status, 406, `Accept: ${accept} should be 406, got ${res.status}`)
      assert.ok(varyIncludesAccept(res.vary), "406 should still Vary on Accept")
    }
  })

  test("q-values are honoured", async () => {
    const mdWins = await get("/", "text/html;q=0.4, text/markdown;q=0.9")
    assert.match(mdWins.type, /text\/markdown/)

    const htmlWins = await get("/", "text/markdown;q=0.2, text/html;q=0.8")
    assert.match(htmlWins.type, /text\/html/)
  })

  test("curl's default */* still gets HTML", async () => {
    const res = await get("/", "*/*")
    assert.match(res.type, /text\/html/)
  })

  test("no Accept header at all still gets HTML", async () => {
    const res = await get("/")
    assert.match(res.type, /text\/html/)
  })
})

describe("3. Agent instruction file", () => {
  test("llms.txt is served as Markdown", async () => {
    const res = await get("/llms.txt")
    assert.equal(res.status, 200)
    assert.match(res.type, /text\/markdown/, `got ${res.type}`)
  })

  test("llms.txt carries explicit when-to-use guidance", async () => {
    const { body } = await get("/llms.txt")
    assert.match(body, /##\s*When to use/i, "missing a 'when to use' section")
    assert.match(body, /##\s*How an agent should use this site/i, "missing calling guidance")
    assert.match(body, /Do \*\*not\*\* route these to us/i, "missing negative guidance")
  })

  test("llms.txt names the negotiation contract and the sitemap", async () => {
    const { body } = await get("/llms.txt")
    assert.match(body, /Accept: text\/markdown/)
    assert.match(body, /sitemap\.xml/)
  })

  test("llms.txt no longer claims the stale minimum order quantities", async () => {
    const { body } = await get("/llms.txt")
    assert.ok(!/500 sq ft per grade/.test(body), "stale hide MOQ claim still present")
    assert.ok(!/100 units per style/.test(body), "stale finished-goods MOQ claim still present")
  })
})

describe("4. Existing behaviour is preserved", () => {
  test("sitemap.xml is unchanged and still XML", async () => {
    const res = await get("/sitemap.xml")
    assert.equal(res.status, 200)
    assert.match(res.type, /xml/)
    assert.match(res.body, /<urlset/)
  })

  test("robots.txt is unchanged and still plain text", async () => {
    const res = await get("/robots.txt")
    assert.equal(res.status, 200)
    assert.match(res.type, /text\/plain/)
    assert.match(res.body, /Sitemap:/)
  })

  test("robots.txt is not intercepted by content negotiation", async () => {
    const res = await get("/robots.txt", MD)
    assert.match(res.type, /text\/plain/, "robots.txt must not become Markdown")
  })

  test("the admin gate still redirects anonymous visitors", async () => {
    const res = await get("/admin-ahmza")
    assert.ok([307, 308, 302].includes(res.status), `expected a redirect, got ${res.status}`)
  })

  test("admin API still returns 401 JSON for anonymous callers", async () => {
    const res = await get("/api/admin/payment-confirmations")
    assert.equal(res.status, 401)
    assert.match(res.type, /application\/json/)
  })

  test("public API routes are not negotiated into Markdown", async () => {
    const res = await get("/api/blogs", MD)
    assert.match(res.type, /application\/json/, "API routes must keep speaking JSON")
  })

  test("every sitemap route the index claims to cover resolves as Markdown", async () => {
    const { body } = await get("/sitemap.xml")
    const paths = [...body.matchAll(/<loc>https:\/\/www\.puregrainexports\.com([^<]*)<\/loc>/g)]
      .map((m) => m[1] || "/")
      .filter((p) => !p.startsWith("/catalog/raw-leather/") && !p.startsWith("/catalog/finished-products/"))

    assert.ok(paths.length > 5, "sitemap parsed no usable paths")

    for (const p of paths) {
      const res = await get(p, MD)
      assert.equal(res.status, 200, `${p} returned ${res.status} for Accept: text/markdown`)
      assert.match(res.type, /text\/markdown/, `${p} did not return Markdown`)
      assert.ok(!res.body.startsWith("# 404"), `${p} has no Markdown representation in the page index`)
    }
  })
})
