import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/config/db"
import { getAllPublishedBlogs, getPublishedPostBySlug } from "@/lib/blog-cache"
import { SITE_URL } from "@/lib/seo"
import { MARKDOWN_CONTENT_TYPE } from "@/lib/agent/content-negotiation"
import { articleHtmlToMarkdown } from "@/lib/agent/html-to-markdown"
import { AGENT_PAGES, findAgentPage, renderAgentPageMarkdown } from "@/lib/agent/page-index"
import { renderArticleTokens, usesCatalogueTokens } from "@/lib/article-tokens"
import { getCatalogueStats, EMPTY_CATALOGUE_STATS } from "@/lib/catalogue-stats"

/**
 * Serves the Markdown representation of a public URL.
 *
 * This is an internal endpoint: `middleware.ts` rewrites to it when a client
 * negotiates `Accept: text/markdown`, so the Markdown is served from the
 * original URL rather than from a parallel `.md` address. Agents therefore get
 * one canonical URL per resource, which is the point of content negotiation.
 *
 * Every response carries `Vary: Accept` so a CDN cannot hand the HTML variant
 * to a client that asked for Markdown, or the reverse.
 */

export const dynamic = "force-dynamic"

/** `Vary: Accept` is the contract; the rest is ordinary caching hygiene. */
function markdownResponse(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: {
      "Content-Type": MARKDOWN_CONTENT_TYPE,
      Vary: "Accept, Accept-Encoding",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "X-Robots-Tag": "noindex",
    },
  })
}

function notFoundMarkdown(pathname: string): string {
  const links = AGENT_PAGES.slice(0, 8)
    .map((p) => `- [${p.title}](${SITE_URL}${p.path === "/" ? "/" : p.path})`)
    .join("\n")

  return `# 404 — Not Found

No resource exists at \`${pathname}\` on ${SITE_URL}.

This is a genuine 404: the path does not exist. Do not treat it as a
temporary failure and do not retry the same URL.

## Where to look instead

${links}

## Machine-readable indexes

- [llms.txt](${SITE_URL}/llms.txt) — site summary, when to use us, and key routes
- [sitemap.xml](${SITE_URL}/sitemap.xml) — every canonical URL on the site
- [robots.txt](${SITE_URL}/robots.txt) — crawl rules

Every page on this site also serves Markdown via
\`Accept: text/markdown\` content negotiation.
`
}

async function blogIndexMarkdown(): Promise<string | null> {
  try {
    const blogs = await getAllPublishedBlogs(100)
    if (!blogs.length) return null

    const items = blogs
      .map((post: any) => {
        const date = new Date(post.publishedAt || post.createdAt).toISOString().slice(0, 10)
        return `- [${post.title}](${SITE_URL}/blogs/${post.slug}) — ${post.excerpt} _(${date}, ${post.readingTimeMinutes} min read)_`
      })
      .join("\n")

    return `# Leather Sourcing Guides & Insights

Long-form sourcing guidance for manufacturers and wholesale buyers. Every
article below is available as Markdown at its own URL via
\`Accept: text/markdown\`.

${items}

---

Site index: ${SITE_URL}/llms.txt · Full URL list: ${SITE_URL}/sitemap.xml
`
  } catch (error) {
    console.error("agent markdown: blog index unavailable", error)
    return null
  }
}

async function blogPostMarkdown(slug: string): Promise<string | null> {
  try {
    const post = await getPublishedPostBySlug(slug)
    if (!post) return null

    // Catalogue tokens must resolve before conversion, or `{{pg:...}}` would
    // leak into the Markdown exactly as it would have leaked into the HTML.
    let content = post.content
    if (usesCatalogueTokens(content)) {
      let stats = EMPTY_CATALOGUE_STATS
      try {
        stats = await getCatalogueStats()
      } catch (error) {
        console.error("agent markdown: catalogue stats unavailable", error)
      }
      content = renderArticleTokens(content, stats)
    }

    const body = articleHtmlToMarkdown(content, SITE_URL)
    // Cached reads already hand back ISO strings; fall back to "now" only if a
    // record somehow has neither date rather than throwing on an invalid Date.
    const day = (v?: string) => (v ? v.slice(0, 10) : new Date().toISOString().slice(0, 10))
    const published = day(post.publishedAt || post.createdAt)
    const modified = day(post.updatedAt || post.createdAt)

    const front = [
      `# ${post.title}`,
      "",
      `> ${post.seoDescription || post.excerpt}`,
      "",
      `**Author:** ${post.authorName}  `,
      `**Published:** ${published}  `,
      `**Updated:** ${modified}  `,
      `**Reading time:** ${post.readingTimeMinutes} min  `,
      `**Canonical URL:** ${SITE_URL}/blogs/${post.slug}`,
      post.tags?.length ? `**Tags:** ${post.tags.join(", ")}` : "",
      "",
      "---",
      "",
    ]
      .filter((l) => l !== undefined)
      .join("\n")

    return `${front}${body}\n`
  } catch (error) {
    console.error("agent markdown: blog post unavailable", error)
    return null
  }
}

export async function GET(req: NextRequest) {
  // Header first: after a middleware rewrite the handler's `nextUrl` is still
  // the client's original URL, so the query param the middleware appended is
  // not readable here. The param remains the fallback for direct calls.
  const requested =
    req.headers.get("x-agent-md-path") || req.nextUrl.searchParams.get("path") || "/"

  // The middleware always supplies an absolute, same-origin path; refuse
  // anything else rather than letting a crafted value reach the lookups.
  const pathname = requested.startsWith("/") ? requested.split("?")[0] : "/"

  const indexed = findAgentPage(pathname)
  if (indexed) {
    // The blog index is generated from live posts rather than the static entry.
    if (pathname === "/blogs") {
      const live = await blogIndexMarkdown()
      if (live) return markdownResponse(live)
    }
    return markdownResponse(renderAgentPageMarkdown(indexed))
  }

  const blogMatch = pathname.match(/^\/blogs\/([a-z0-9-]+)$/)
  if (blogMatch) {
    const md = await blogPostMarkdown(blogMatch[1])
    if (md) return markdownResponse(md)
    return markdownResponse(notFoundMarkdown(pathname), 404)
  }

  // Catalogue detail pages are Product-schema resources whose canonical
  // representation is the HTML page; point agents at it rather than inventing
  // a partial Markdown copy of live inventory.
  if (/^\/catalog\/(raw-leather|finished-products)\/[^/]+$/.test(pathname)) {
    return markdownResponse(
      `# Catalogue item

This URL is a catalogue detail page. Its authoritative representation is the
HTML page, which carries Product structured data (JSON-LD) with the current
specification, price and minimum order quantity.

- Canonical URL: ${SITE_URL}${pathname}
- Parent catalogue: ${SITE_URL}${pathname.split("/").slice(0, 3).join("/")}
- Request a sample: ${SITE_URL}/sample-request
- Request a quote: ${SITE_URL}/quote-request
`
    )
  }

  return markdownResponse(notFoundMarkdown(pathname), 404)
}
