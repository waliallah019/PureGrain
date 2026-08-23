/**
 * Seeds / re-seeds the Phase 3 SEO article set into the `blogs` collection.
 *
 *   node scripts/seedBlogArticles.mjs            # upsert as published
 *   node scripts/seedBlogArticles.mjs --draft    # upsert as draft
 *   node scripts/seedBlogArticles.mjs --dry      # report only, write nothing
 *   node scripts/seedBlogArticles.mjs --only=slug-a,slug-b
 *
 * Content lives in scripts/blog-content/ — one <slug>.html per article plus
 * manifest.json for the metadata. Editing a file and re-running updates the
 * post in place, keeping its original createdAt/publishedAt so republishing
 * does not reset the article's age in Google's eyes.
 *
 * Prices and MOQs are deliberately NOT in the HTML. Articles carry {{pg:...}}
 * tokens that resolve against the live catalogue at render time, so a price
 * edit in the admin panel updates every article automatically.
 * See lib/article-tokens.ts.
 */

import mongoose from "mongoose"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = path.join(__dirname, "blog-content")
const PROJECT_ROOT = path.join(__dirname, "..")

const args = process.argv.slice(2)
const DRY = args.includes("--dry")
const STATUS = args.includes("--draft") ? "draft" : "published"
const ONLY = (args.find((a) => a.startsWith("--only=")) || "").replace("--only=", "")
const ONLY_SLUGS = ONLY ? ONLY.split(",").map((s) => s.trim()).filter(Boolean) : null

const AUTHOR = "Pure Grain Exports"

function readMongoUri() {
  if (process.env.MONGO_URI) return process.env.MONGO_URI
  const envPath = path.join(PROJECT_ROOT, ".env.local")
  if (!fs.existsSync(envPath)) throw new Error("MONGO_URI not set and .env.local not found")
  const match = fs.readFileSync(envPath, "utf8").match(/^MONGO_URI\s*=\s*(.+)$/m)
  if (!match) throw new Error("MONGO_URI not found in .env.local")
  return match[1].trim().replace(/^["']|["']$/g, "")
}

/** Mirrors BlogService.calculateReadingTimeMinutes so the badge matches the UI. */
function readingTime(html) {
  const words = html
    .replace(/\{\{pg:[^}]*\}\}/g, " ")
    .replace(/<[^>]*>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

/**
 * Fails loudly on the mistakes that are invisible until the page is public:
 * a token typo renders as an em dash, an over-length SEO field is silently
 * truncated by Google, and a heading level jump breaks the table of contents.
 */
function validate(entry, html) {
  const problems = []

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug)) problems.push("slug is not URL-safe")
  if ((entry.seoTitle || "").length > 70) problems.push(`seoTitle ${entry.seoTitle.length} chars (max 70)`)
  if ((entry.seoDescription || "").length > 160)
    problems.push(`seoDescription ${entry.seoDescription.length} chars (max 160)`)
  if ((entry.excerpt || "").length < 20) problems.push("excerpt shorter than 20 chars")
  if (html.trim().length < 40) problems.push("content shorter than 40 chars")
  if (!/^https?:\/\//.test(entry.coverImage || "")) problems.push("coverImage is not an absolute URL")

  // Unbalanced or malformed tokens never reach the reader as raw braces, but a
  // typo silently degrades to an em dash, so catch it here instead.
  const known = new Set([
    "price-from", "price-range", "moq-from", "moq-range", "count",
    "phrase-price", "phrase-moq", "total-products", "total-product-types",
    "total-hides", "total-hide-types", "moq-lowest", "list-hide-types",
    "list-hide-animals", "table-products",
  ])
  for (const m of html.matchAll(/\{\{pg:([a-z-]+)(?::([^}]*))?\}\}/gi)) {
    if (!known.has(m[1].toLowerCase())) problems.push(`unknown token {{pg:${m[1]}}}`)
  }
  const strays = html.match(/\{\{(?!pg:)[^}]*\}\}/g)
  if (strays) problems.push(`non-pg template braces present: ${strays.slice(0, 3).join(", ")}`)

  if (!/<h2[\s>]/i.test(html)) problems.push("no <h2> headings — table of contents will be empty")

  return problems
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, "manifest.json"), "utf8"))
  const entries = manifest.articles.filter(
    (a) => !ONLY_SLUGS || ONLY_SLUGS.includes(a.slug)
  )

  const loaded = []
  let missing = 0
  let invalid = 0

  for (const entry of entries) {
    const file = path.join(CONTENT_DIR, `${entry.slug}.html`)
    if (!fs.existsSync(file)) {
      console.log(`  SKIP   ${entry.slug} — no HTML file yet`)
      missing += 1
      continue
    }
    const html = fs.readFileSync(file, "utf8").trim()
    const problems = validate(entry, html)
    if (problems.length) {
      console.log(`  FAIL   ${entry.slug}`)
      problems.forEach((p) => console.log(`           - ${p}`))
      invalid += 1
      continue
    }
    loaded.push({ entry, html })
  }

  if (invalid) {
    console.error(`\n${invalid} article(s) failed validation — nothing was written.`)
    process.exitCode = 1
    return
  }

  console.log(
    `\n${loaded.length} article(s) ready${missing ? `, ${missing} not yet written` : ""}. ` +
      `Target status: ${STATUS}${DRY ? " (DRY RUN)" : ""}\n`
  )

  if (DRY) {
    for (const { entry, html } of loaded) {
      console.log(
        `  ${entry.slug.padEnd(52)} ${String(readingTime(html)).padStart(2)} min  ${(html.length / 1024).toFixed(1)} KB`
      )
    }
    return
  }

  await mongoose.connect(readMongoUri(), { serverSelectionTimeoutMS: 20000 })
  const blogs = mongoose.connection.collection("blogs")
  const now = new Date()

  for (const { entry, html } of loaded) {
    const existing = await blogs.findOne({ slug: entry.slug })

    const doc = {
      title: entry.title,
      slug: entry.slug,
      excerpt: entry.excerpt,
      content: html,
      coverImage: entry.coverImage,
      tags: entry.tags,
      status: STATUS,
      authorName: AUTHOR,
      seoTitle: entry.seoTitle,
      seoDescription: entry.seoDescription,
      readingTimeMinutes: readingTime(html),
      updatedAt: now,
    }

    if (existing) {
      // Keep the original dates: resetting publishedAt on every content edit
      // would make an established article look brand new to Google.
      await blogs.updateOne({ _id: existing._id }, { $set: doc })
      console.log(`  UPDATED  ${entry.slug}  (${doc.readingTimeMinutes} min read)`)
    } else {
      await blogs.insertOne({
        ...doc,
        createdAt: now,
        publishedAt: STATUS === "published" ? now : undefined,
      })
      console.log(`  CREATED  ${entry.slug}  (${doc.readingTimeMinutes} min read)`)
    }
  }

  await mongoose.disconnect()
  console.log(`\nDone. ${loaded.length} article(s) ${STATUS}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
