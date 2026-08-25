/**
 * Converts the blog article HTML stored in MongoDB into clean Markdown.
 *
 * This is deliberately NOT a general-purpose HTML converter. It handles exactly
 * the element and class vocabulary the articles are authored in (see
 * `scripts/blog-content/*.html` and the `.pg-*` components in globals.css), and
 * nothing else. That keeps it small, dependency-free and predictable — and any
 * markup outside that vocabulary degrades to its text content rather than
 * producing broken Markdown.
 *
 * Run `renderArticleTokens()` first: `{{pg:...}}` catalogue tokens must be
 * resolved before conversion or they leak into the Markdown output.
 */

/** Decodes the small set of entities the articles actually contain. */
function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    // Ampersand last, so "&amp;lt;" does not become "<".
    .replace(/&amp;/g, "&")
}

/** Characters that would otherwise be read as Markdown syntax. */
function escapeMarkdown(value: string): string {
  return value.replace(/([\\`*_[\]])/g, "\\$1")
}

function collapse(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

/** Strips tags, keeping only text — the fallback for unrecognised markup. */
function textOf(html: string): string {
  return collapse(decodeEntities(html.replace(/<[^>]*>/g, " ")))
}

/**
 * Converts inline markup inside a block. Block-level tags are handled by the
 * caller; anything left here is inline or gets flattened to text.
 */
function inline(html: string, baseUrl: string): string {
  let out = html

  // Links first: the anchor text may itself contain <strong>/<em>.
  out = out.replace(
    /<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_m, href: string, label: string) => {
      const text = inline(label, baseUrl)
      if (!text) return ""
      let url = href.trim()
      if (url.startsWith("/")) url = `${baseUrl}${url}`
      return `[${text}](${url})`
    }
  )

  out = out.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, inner: string) => {
    const text = inline(inner, baseUrl)
    return text ? `**${text}**` : ""
  })

  out = out.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, inner: string) => {
    const text = inline(inner, baseUrl)
    return text ? `*${text}*` : ""
  })

  out = out.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_m, inner: string) => {
    const text = textOf(inner)
    return text ? `\`${text}\`` : ""
  })

  out = out.replace(/<br\s*\/?>/gi, " ")

  // Anything still tagged is not part of the authored vocabulary — keep its text.
  out = out.replace(/<[^>]+>/g, " ")

  return collapse(decodeEntities(out))
}

/** `<li>` items of the first list in `html`, as raw inner HTML strings. */
function listItems(html: string): string[] {
  const items: string[] = []
  const re = /<li\b[^>]*>([\s\S]*?)<\/li>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) items.push(m[1])
  return items
}

/**
 * `.pg-steps` list items carry a `<strong>` title plus a `<p>` body, and are
 * numbered by CSS counters in the browser. Markdown has to number them itself.
 */
function stepsToMarkdown(inner: string, baseUrl: string): string {
  return listItems(inner)
    .map((item, i) => {
      const title = item.match(/<strong\b[^>]*>([\s\S]*?)<\/strong>/i)?.[1]
      const body = item.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1]
      const head = title ? inline(title, baseUrl) : ""
      const text = body ? inline(body, baseUrl) : inline(item, baseUrl)
      return head ? `${i + 1}. **${head}** — ${text}` : `${i + 1}. ${text}`
    })
    .join("\n")
}

function bulletsToMarkdown(inner: string, baseUrl: string, ordered: boolean): string {
  return listItems(inner)
    .map((item, i) => {
      // A nested <p> inside <li> is how the checklist/step markup reads; flatten.
      const text = inline(item, baseUrl)
      return text ? (ordered ? `${i + 1}. ${text}` : `- ${text}`) : ""
    })
    .filter(Boolean)
    .join("\n")
}

function tableToMarkdown(inner: string, baseUrl: string): string {
  const rows: string[][] = []
  const rowRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi
  let rowMatch: RegExpExecArray | null

  while ((rowMatch = rowRe.exec(inner)) !== null) {
    const cells: string[] = []
    const cellRe = /<(th|td)\b[^>]*>([\s\S]*?)<\/\1>/gi
    let cellMatch: RegExpExecArray | null
    while ((cellMatch = cellRe.exec(rowMatch[1])) !== null) {
      // Pipes inside a cell would break the GFM table grid.
      cells.push(inline(cellMatch[2], baseUrl).replace(/\|/g, "\\|"))
    }
    if (cells.length) rows.push(cells)
  }

  if (!rows.length) return ""

  const width = Math.max(...rows.map((r) => r.length))
  const pad = (r: string[]) => [...r, ...Array(width - r.length).fill("")]

  const [head, ...body] = rows
  const lines = [
    `| ${pad(head).join(" | ")} |`,
    `| ${Array(width).fill("---").join(" | ")} |`,
    ...body.map((r) => `| ${pad(r).join(" | ")} |`),
  ]
  return lines.join("\n")
}

/**
 * Walks the article's top-level blocks in document order.
 *
 * A single regex alternation over block starts keeps ordering correct without
 * building a DOM — which matters because the `.pg-*` wrappers nest one level
 * deep and a naive "replace each tag type in turn" pass would reorder content.
 */
export function articleHtmlToMarkdown(html: string, baseUrl: string): string {
  const out: string[] = []

  const blockRe = new RegExp(
    [
      "<h([2-4])\\b[^>]*>([\\s\\S]*?)<\\/h\\1>",
      '<div class="pg-table-wrap">([\\s\\S]*?)<\\/table><\\/div>',
      '<div class="pg-faq">([\\s\\S]*?)<\\/div>\\s*(?=<h2|<div class="pg-cta"|$)',
      '<div class="pg-cta">([\\s\\S]*?)<\\/div>\\s*(?=<h2|$)',
      '<div class="pg-takeaways">([\\s\\S]*?)<\\/div>\\s*(?=<h2|<p|<div|$)',
      '<div class="pg-callout[^"]*">([\\s\\S]*?)<\\/div>\\s*(?=<h2|<h3|<p|<div|<ol|<ul|$)',
      '<div class="pg-cards">([\\s\\S]*?)<\\/div>\\s*(?=<h2|<h3|<p|<div|$)',
      '<div class="pg-stats">([\\s\\S]*?)<\\/div>\\s*(?=<h2|<h3|<p|<div|$)',
      "<figure\\b[^>]*>([\\s\\S]*?)<\\/figure>",
      "<blockquote\\b[^>]*>([\\s\\S]*?)<\\/blockquote>",
      '<ol class="pg-steps">([\\s\\S]*?)<\\/ol>',
      "<ol\\b[^>]*>([\\s\\S]*?)<\\/ol>",
      "<ul\\b[^>]*>([\\s\\S]*?)<\\/ul>",
      "<p\\b[^>]*>([\\s\\S]*?)<\\/p>",
    ].join("|"),
    "gi"
  )

  let match: RegExpExecArray | null
  while ((match = blockRe.exec(html)) !== null) {
    const [
      whole,
      headingLevel,
      headingBody,
      tableInner,
      faqInner,
      ctaInner,
      takeawaysInner,
      calloutInner,
      cardsInner,
      statsInner,
      figureInner,
      quoteInner,
      stepsInner,
      olInner,
      ulInner,
      pInner,
    ] = match

    if (headingLevel && headingBody !== undefined) {
      const text = inline(headingBody, baseUrl)
      if (text) out.push(`${"#".repeat(Number(headingLevel))} ${text}`)
      continue
    }

    if (tableInner !== undefined) {
      const table = tableToMarkdown(`${tableInner}</table>`, baseUrl)
      if (table) out.push(table)
      continue
    }

    if (faqInner !== undefined) {
      const entries: string[] = []
      const itemRe = /<div>\s*<span class="pg-faq-q">([\s\S]*?)<\/span>([\s\S]*?)<\/div>/gi
      let item: RegExpExecArray | null
      while ((item = itemRe.exec(faqInner)) !== null) {
        const q = inline(item[1], baseUrl)
        const a = inline(item[2], baseUrl)
        if (q && a) entries.push(`**Q: ${q}**\n\nA: ${a}`)
      }
      if (entries.length) out.push(entries.join("\n\n"))
      continue
    }

    if (ctaInner !== undefined) {
      const title = ctaInner.match(/<span class="pg-cta-title">([\s\S]*?)<\/span>/i)?.[1]
      const lines: string[] = []
      if (title) lines.push(`### ${inline(title, baseUrl)}`)
      const paras = [...ctaInner.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
        .map((p) => inline(p[1], baseUrl))
        .filter(Boolean)
      lines.push(...paras)
      if (lines.length) out.push(lines.join("\n\n"))
      continue
    }

    if (takeawaysInner !== undefined) {
      const label = takeawaysInner.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1]
      const list = takeawaysInner.match(/<ul\b[^>]*>([\s\S]*?)<\/ul>/i)?.[1]
      const lines: string[] = []
      if (label) lines.push(`**${inline(label, baseUrl)}**`)
      if (list) lines.push(bulletsToMarkdown(list, baseUrl, false))
      if (lines.length) out.push(lines.filter(Boolean).join("\n\n"))
      continue
    }

    if (calloutInner !== undefined) {
      const title = calloutInner.match(/<span class="pg-callout-title">([\s\S]*?)<\/span>/i)?.[1]
      const body = [...calloutInner.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
        .map((p) => inline(p[1], baseUrl))
        .filter(Boolean)
      const list = calloutInner.match(/<ul\b[^>]*>([\s\S]*?)<\/ul>/i)?.[1]
      // Blockquote is the closest Markdown equivalent of an aside.
      const parts = [title ? `**${inline(title, baseUrl)}**` : "", ...body]
      if (list) parts.push(bulletsToMarkdown(list, baseUrl, false))
      const text = parts.filter(Boolean).join("\n\n")
      if (text) {
        out.push(
          text
            .split("\n")
            .map((l) => (l ? `> ${l}` : ">"))
            .join("\n")
        )
      }
      continue
    }

    if (cardsInner !== undefined) {
      const cards = [...cardsInner.matchAll(/<div class="pg-card">([\s\S]*?)<\/div>/gi)]
      const lines: string[] = []
      for (const card of cards) {
        const heading = card[1].match(/<h4\b[^>]*>([\s\S]*?)<\/h4>/i)?.[1]
        const body = [...card[1].matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
          .map((p) => inline(p[1], baseUrl))
          .filter(Boolean)
        if (heading) lines.push(`#### ${inline(heading, baseUrl)}`)
        lines.push(...body)
      }
      if (lines.length) out.push(lines.join("\n\n"))
      continue
    }

    if (statsInner !== undefined) {
      const stats = [...statsInner.matchAll(/<div class="pg-stat">([\s\S]*?)<\/div>/gi)].map(
        (s) => {
          const value = s[1].match(/<b>([\s\S]*?)<\/b>/i)?.[1] ?? ""
          const label = s[1].match(/<span>([\s\S]*?)<\/span>/i)?.[1] ?? ""
          return `- **${inline(value, baseUrl)}** ${inline(label, baseUrl)}`
        }
      )
      if (stats.length) out.push(stats.join("\n"))
      continue
    }

    if (figureInner !== undefined) {
      const img = figureInner.match(/<img\b[^>]*>/i)?.[0] ?? ""
      const src = img.match(/src=["']([^"']+)["']/i)?.[1] ?? ""
      const alt = img.match(/alt=["']([^"']*)["']/i)?.[1] ?? ""
      const caption = figureInner.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i)?.[1]
      if (src) out.push(`![${escapeMarkdown(decodeEntities(alt))}](${src})`)
      if (caption) out.push(`*${inline(caption, baseUrl)}*`)
      continue
    }

    if (quoteInner !== undefined) {
      const text = inline(quoteInner, baseUrl)
      if (text) out.push(`> ${text}`)
      continue
    }

    if (stepsInner !== undefined) {
      const steps = stepsToMarkdown(stepsInner, baseUrl)
      if (steps) out.push(steps)
      continue
    }

    if (olInner !== undefined) {
      const list = bulletsToMarkdown(olInner, baseUrl, true)
      if (list) out.push(list)
      continue
    }

    if (ulInner !== undefined) {
      const list = bulletsToMarkdown(ulInner, baseUrl, false)
      if (list) out.push(list)
      continue
    }

    if (pInner !== undefined) {
      const text = inline(pInner, baseUrl)
      if (text) out.push(text)
      continue
    }

    // Unreachable in practice; keeps the loop total if the vocabulary grows.
    const fallback = textOf(whole)
    if (fallback) out.push(fallback)
  }

  return out.join("\n\n").replace(/\n{3,}/g, "\n\n").trim()
}
