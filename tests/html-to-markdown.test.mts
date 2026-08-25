import test, { describe } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { articleHtmlToMarkdown } from "../lib/agent/html-to-markdown.ts"

const SITE = "https://www.puregrainexports.com"
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const CONTENT_DIR = path.join(ROOT, "scripts", "blog-content")

const md = (html: string) => articleHtmlToMarkdown(html, SITE)

describe("articleHtmlToMarkdown() — block elements", () => {
  test("headings map to their Markdown level", () => {
    assert.equal(md("<h2>Section</h2>"), "## Section")
    assert.equal(md("<h3>Sub</h3>"), "### Sub")
    assert.equal(md("<h4>Label</h4>"), "#### Label")
  })

  test("paragraphs are separated by a blank line", () => {
    assert.equal(md("<p>One.</p><p>Two.</p>"), "One.\n\nTwo.")
  })

  test("document order is preserved across mixed block types", () => {
    const out = md("<h2>A</h2><p>body</p><h3>B</h3><ul><li>item</li></ul>")
    assert.equal(out, "## A\n\nbody\n\n### B\n\n- item")
  })

  test("unordered and ordered lists", () => {
    assert.equal(md("<ul><li>a</li><li>b</li></ul>"), "- a\n- b")
    assert.equal(md("<ol><li>a</li><li>b</li></ol>"), "1. a\n2. b")
  })

  test("pg-steps get explicit numbers and a bold title", () => {
    const html = '<ol class="pg-steps"><li><strong>First</strong><p>Do it.</p></li></ol>'
    assert.equal(md(html), "1. **First** — Do it.")
  })

  test("tables become GFM tables with a header separator", () => {
    const html =
      '<div class="pg-table-wrap"><table><thead><tr><th>A</th><th>B</th></tr></thead>' +
      "<tbody><tr><td>1</td><td>2</td></tr></tbody></table></div>"
    assert.equal(md(html), "| A | B |\n| --- | --- |\n| 1 | 2 |")
  })

  test("figures become an image plus an italic caption", () => {
    const html =
      '<figure><img src="https://x/y.jpg" alt="Alt text" width="800" height="800">' +
      "<figcaption>A caption.</figcaption></figure>"
    assert.equal(md(html), "![Alt text](https://x/y.jpg)\n\n*A caption.*")
  })

  test("callouts render as blockquotes with a bold title", () => {
    const html =
      '<div class="pg-callout"><span class="pg-callout-title">Note</span><p>Body.</p></div><h2>Next</h2>'
    const out = md(html)
    assert.match(out, /^> \*\*Note\*\*/)
    assert.match(out, /> Body\./)
    assert.match(out, /## Next/)
  })

  test("FAQ blocks become Q/A pairs", () => {
    const html =
      '<div class="pg-faq"><div><span class="pg-faq-q">What?</span><p>This.</p></div></div>'
    assert.equal(md(html), "**Q: What?**\n\nA: This.")
  })
})

describe("articleHtmlToMarkdown() — inline elements", () => {
  test("strong and em", () => {
    assert.equal(md("<p><strong>b</strong> and <em>i</em></p>"), "**b** and *i*")
  })

  test("relative links are absolutised against the site URL", () => {
    assert.equal(md('<p><a href="/quality">QC</a></p>'), `[QC](${SITE}/quality)`)
  })

  test("absolute links are left alone", () => {
    assert.equal(md('<p><a href="https://example.com/x">X</a></p>'), "[X](https://example.com/x)")
  })

  test("entities are decoded", () => {
    assert.equal(md("<p>A &amp; B &ndash; C</p>"), "A & B – C")
  })

  test("pipes inside table cells are escaped so the grid survives", () => {
    const html =
      '<div class="pg-table-wrap"><table><tr><td>a|b</td></tr></table></div>'
    assert.match(md(html), /a\\\|b/)
  })
})

describe("articleHtmlToMarkdown() — real published articles", () => {
  const files = fs.existsSync(CONTENT_DIR)
    ? fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".html"))
    : []

  test("the article corpus is present", () => {
    assert.ok(files.length >= 10, `expected >=10 article files, found ${files.length}`)
  })

  for (const file of files) {
    test(`${file} converts cleanly`, () => {
      const html = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8")
      // Tokens are resolved before conversion in production; stub them here so
      // the assertion below is about markup handling, not token rendering.
      const resolved = html.replace(/\{\{pg:[^}]*\}\}/g, "X")
      const out = md(resolved)

      assert.ok(out.length > 500, "conversion produced almost no output")
      assert.ok(!/<[a-z][^>]*>/i.test(out), "raw HTML tags leaked into the Markdown")
      assert.ok(!out.includes("{{pg:"), "unresolved catalogue token leaked")
      assert.ok(out.includes("## "), "no headings survived conversion")
      assert.ok(!out.includes("&amp;"), "undecoded entity leaked")
      assert.ok(!/\n{3,}/.test(out), "excessive blank lines in output")
    })
  }
})
