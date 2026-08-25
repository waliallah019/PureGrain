import test, { describe } from "node:test"
import assert from "node:assert/strict"
import { negotiate } from "../lib/agent/content-negotiation.ts"

/**
 * Accept-header negotiation, against the acceptmarkdown.com readiness checks
 * and RFC 9110 §12.5.1.
 *
 * Run with `pnpm test`.
 */

describe("negotiate() — markdown is served when asked for", () => {
  test("bare text/markdown", () => {
    assert.equal(negotiate("text/markdown"), "markdown")
  })

  test("with charset parameter", () => {
    assert.equal(negotiate("text/markdown; charset=utf-8"), "markdown")
  })

  test("legacy text/x-markdown spelling", () => {
    assert.equal(negotiate("text/x-markdown"), "markdown")
  })

  test("markdown preferred over html by q-value", () => {
    assert.equal(negotiate("text/html;q=0.8, text/markdown;q=0.9"), "markdown")
  })

  test("markdown listed first but html scores higher still yields html", () => {
    assert.equal(negotiate("text/markdown;q=0.3, text/html;q=0.9"), "html")
  })
})

describe("negotiate() — browsers and crawlers keep getting HTML", () => {
  test("no Accept header at all", () => {
    assert.equal(negotiate(null), "html")
    assert.equal(negotiate(undefined), "html")
    assert.equal(negotiate(""), "html")
  })

  test("curl's default */*", () => {
    assert.equal(negotiate("*/*"), "html")
  })

  test("a real Chrome Accept header", () => {
    const chrome =
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
    assert.equal(negotiate(chrome), "html")
  })

  test("Googlebot's Accept header", () => {
    assert.equal(negotiate("text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"), "html")
  })

  test("text/* wildcard is a tie, so HTML wins", () => {
    assert.equal(negotiate("text/*"), "html")
  })
})

describe("negotiate() — 406 territory", () => {
  test("client accepting only JSON", () => {
    assert.equal(negotiate("application/json"), "unacceptable")
  })

  test("client accepting only images", () => {
    assert.equal(negotiate("image/png, image/webp"), "unacceptable")
  })

  test("html and markdown both explicitly refused", () => {
    assert.equal(negotiate("text/html;q=0, text/markdown;q=0"), "unacceptable")
  })

  test("garbage header degrades to html rather than 406", () => {
    // A malformed header should not lock a client out of the site.
    assert.equal(negotiate("not-a-media-type"), "html")
  })
})

describe("negotiate() — q-value edge cases", () => {
  test("q=0 on a specific type beats a permissive wildcard", () => {
    // The client accepts anything EXCEPT markdown.
    assert.equal(negotiate("*/*, text/markdown;q=0"), "html")
  })

  test("wildcard-only markdown request still resolves to html", () => {
    assert.equal(negotiate("text/*;q=1, application/json;q=0.1"), "html")
  })

  test("q values above 1 are clamped, not treated as higher priority", () => {
    assert.equal(negotiate("text/html;q=1, text/markdown;q=5"), "html")
  })

  test("whitespace and casing are tolerated", () => {
    assert.equal(negotiate("  TEXT/MARKDOWN ;  Q=0.9 , text/html;q=0.1 "), "markdown")
  })
})
