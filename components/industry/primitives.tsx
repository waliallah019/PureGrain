import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ChevronRight } from "lucide-react"
import type { Faq } from "@/lib/content/faqs"
import type { HideAnimalStat } from "@/lib/catalogue-stats"

/**
 * Small shared pieces for the industry landing pages.
 *
 * Deliberately primitives rather than a page shell: each industry page composes
 * its own sections in its own file, because a shared template with the industry
 * name swapped in is exactly what makes a set of landing pages read as
 * boilerplate to both readers and search engines.
 *
 * All server components — the FAQ uses native <details>, so these pages ship no
 * client JavaScript of their own.
 */

export function IndustryBreadcrumb({ label }: { label: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link href="/" className="hover:text-brass-ink transition-colors">
            Home
          </Link>
        </li>
        <ChevronRight aria-hidden className="h-3.5 w-3.5 shrink-0" />
        <li>
          <Link href="/industries" className="hover:text-brass-ink transition-colors">
            Industries
          </Link>
        </li>
        <ChevronRight aria-hidden className="h-3.5 w-3.5 shrink-0" />
        <li aria-current="page" className="font-medium text-foreground">
          {label}
        </li>
      </ol>
    </nav>
  )
}

/**
 * Page hero: H1, positioning line and the industry's own first-party image.
 *
 * The image is next/image so it is served in AVIF/WebP at the right size —
 *
 * Sized with explicit width/height rather than `fill`. Under Next 15.3.8 a
 * `fill` image on the industries hub produced a bundle whose shared chunk
 * failed to resolve at runtime, 500-ing unrelated routes (/blogs and the
 * 404 page) while building cleanly. width/height renders identically here
 * because the wrapper already fixes the aspect ratio.
 * these pages are the SEO landing surface, so LCP matters. `priority` because
 * on every industry page this is the largest element above the fold.
 */
export function IndustryHero({
  h1,
  positioning,
  image,
  imageAlt,
}: {
  h1: string
  positioning: string
  image: string
  imageAlt: string
}) {
  return (
    <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
      <div>
        <p className="text-eyebrow mb-3">Industry supply</p>
        <h1 className="heading-display text-foreground">{h1}</h1>
        <p className="text-body mt-5">{positioning}</p>
      </div>
      <div className="aspect-[4/3] w-full overflow-hidden border border-border bg-muted">
        <Image
          src={image}
          alt={imageAlt}
          width={800}
          height={600}
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="h-full w-full object-cover"
        />
      </div>
    </section>
  )
}

/** Section wrapper so heading rhythm is consistent without templating content. */
export function IndustrySection({
  id,
  eyebrow,
  heading,
  children,
}: {
  id?: string
  eyebrow?: string
  heading: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="mt-16 scroll-mt-28">
      {eyebrow ? <p className="text-eyebrow mb-3">{eyebrow}</p> : null}
      <h2 className="heading-section text-foreground">{heading}</h2>
      <div className="divider-brass mt-4 mb-6" />
      {children}
    </section>
  )
}

/**
 * Live substance table.
 *
 * Reads from the catalogue snapshot rather than hardcoded figures, so a page
 * cannot keep advertising a substance range after the stock behind it changes.
 */
export function HideSpecTable({
  animals,
  only,
  emptyNote,
}: {
  animals: HideAnimalStat[]
  only: string[]
  emptyNote: string
}) {
  const rows = only
    .map((name) => animals.find((a) => a.animal.toLowerCase() === name.toLowerCase()))
    .filter((a): a is HideAnimalStat => Boolean(a && a.count > 0))

  if (!rows.length) {
    return <p className="text-body">{emptyNote}</p>
  }

  const mm = (a: HideAnimalStat) =>
    a.thicknessMin > 0
      ? a.thicknessMin === a.thicknessMax
        ? `${a.thicknessMin}mm`
        : `${a.thicknessMin}–${a.thicknessMax}mm`
      : "On request"

  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full border-collapse text-left text-[0.9375rem]">
        <caption className="sr-only">
          Leather substance and finish availability by animal, read from the live catalogue
        </caption>
        <thead className="bg-bone dark:bg-muted/30">
          <tr>
            <th scope="col" className="whitespace-nowrap border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em]">
              Hide
            </th>
            <th scope="col" className="whitespace-nowrap border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em]">
              Substance
            </th>
            <th scope="col" className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em]">
              Types stocked
            </th>
            <th scope="col" className="whitespace-nowrap border-b border-border px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em]">
              Options
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.animal} className="last:[&>td]:border-b-0">
              <td className="border-b border-border px-4 py-3 font-medium text-foreground">
                {a.animal === "Cow" ? "Cowhide" : a.animal}
              </td>
              <td className="whitespace-nowrap border-b border-border px-4 py-3 text-muted-foreground tabular-nums">
                {mm(a)}
              </td>
              <td className="border-b border-border px-4 py-3 text-muted-foreground">
                {a.types.join(", ") || "—"}
              </td>
              <td className="border-b border-border px-4 py-3 text-right text-foreground tabular-nums">
                {a.count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Native disclosure list — no client JS, and crawlable with the answers in the DOM. */
export function IndustryFaqList({ faqs }: { faqs: readonly Faq[] }) {
  return (
    <div className="border-t border-border">
      {faqs.map((faq) => (
        <details key={faq.q} className="group border-b border-border py-4">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-serif text-lg font-medium text-foreground md:text-xl">
            {faq.q}
            <ChevronRight
              aria-hidden
              className="mt-1 h-4 w-4 shrink-0 text-brass-ink transition-transform duration-300 group-open:rotate-90"
            />
          </summary>
          <p className="mt-3 text-muted-foreground">{faq.a}</p>
        </details>
      ))}
    </div>
  )
}

export function IndustryCta({
  title,
  body,
  sampleLabel = "Request samples",
}: {
  title: string
  body: string
  sampleLabel?: string
}) {
  return (
    <section className="mt-16 border border-border bg-leather p-7 md:p-10">
      <h2 className="heading-subsection text-primary-foreground">{title}</h2>
      <p className="mt-3 max-w-2xl text-primary-foreground/85">{body}</p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link href="/sample-request" className="btn-brass">
          {sampleLabel}
        </Link>
        <Link
          href="/quote-request"
          className="inline-flex items-center justify-center rounded-none border border-primary-foreground/35 px-8 py-4 text-sm font-medium uppercase tracking-wide text-primary-foreground transition-colors duration-300 hover:bg-primary-foreground/10"
        >
          Request a quote
        </Link>
      </div>
    </section>
  )
}

/**
 * Mid-page call to action, used to close a secondary section.
 *
 * These sections previously trailed off into a sentence with two links buried
 * in it ("Read the full process in our ... guide, or see custom manufacturing
 * for bespoke development"). That reads as a footnote, not an offer: there is
 * nothing to click that looks clickable, and no reason given to act now.
 *
 * This gives the section a real close — a short value line and one primary
 * action — while keeping the page's single main CTA at the bottom as the
 * strongest one. `tone="quiet"` is the on-page variant that sits inside a
 * section without competing with that final CTA.
 */
export function IndustryInlineCta({
  heading,
  body,
  primary,
  secondary,
}: {
  heading: string
  body: string
  primary: { href: string; label: string }
  secondary?: { href: string; label: string }
}) {
  return (
    <div className="mt-8 border border-border bg-bone/50 p-6 dark:bg-muted/20 md:p-7">
      <h3 className="font-serif text-xl font-medium text-foreground md:text-2xl">{heading}</h3>
      <p className="mt-2 max-w-2xl text-muted-foreground">{body}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href={primary.href}
          className="inline-flex items-center justify-center gap-2 rounded-none bg-brass px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-brass-foreground transition-colors duration-300 hover:bg-brass/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {primary.label}
          <ArrowRight aria-hidden className="h-4 w-4 shrink-0" />
        </Link>
        {secondary ? (
          <Link
            href={secondary.href}
            className="inline-flex items-center justify-center gap-2 rounded-none border border-border px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-foreground transition-colors duration-300 hover:border-brass/50 hover:text-brass-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </div>
  )
}

/** Onward links to the long-form guides, with descriptive anchor text. */
export function RelatedGuides({
  guides,
}: {
  guides: Array<{ href: string; label: string }>
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {guides.map((g) => (
        <li key={g.href}>
          <Link
            href={g.href}
            className="group flex h-full items-start justify-between gap-4 border border-border bg-card p-5 transition-all duration-300 hover:border-brass/50 hover:shadow-card-hover"
          >
            <span className="font-medium text-foreground">{g.label}</span>
            <ArrowRight
              aria-hidden
              className="mt-0.5 h-4 w-4 shrink-0 text-brass-ink transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </li>
      ))}
    </ul>
  )
}
