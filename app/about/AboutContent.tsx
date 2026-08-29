"use client"

import Image from "next/image"
import Link from "next/link"
import { useRef } from "react"
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion"
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  FileCheck2,
  Fingerprint,
  Globe2,
  Layers,
  Linkedin,
  Repeat2,
  ScrollText,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import { ABOUT_FAQS as FAQS } from "@/lib/content/faqs"
import { Reveal, SectionHeading, Stagger, StaggerItem } from "@/components/landing/primitives"
import { SITE } from "@/lib/site"

/* -------------------------------------------------------------------------- */
/* Content                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * NOTE ON FIGURES: these are the About page's own long-standing claims. They do
 * NOT agree with the landing page's trust strip (which says 25+ years and 40+
 * countries). Both cannot be true — see DESIGN_SYSTEM.md; the business needs to
 * reconcile them. They are left untouched here rather than silently harmonised
 * to a number nobody has verified.
 */
const HERO_STATS = [
  { value: "10+", label: "Years of leather industry expertise" },
  { value: "40+", label: "Countries supplied worldwide" },
  { value: "500+", label: "Wholesale orders fulfilled" },
  { value: "100%", label: "Export documentation compliance" },
]

const AT_A_GLANCE = [
  "Founded to bring transparent, dependable leather supply to international buyers.",
  `Head office in ${SITE.address.city}, ${SITE.address.region} — with sourcing across Pakistan's established leather clusters.`,
  "Serving wholesale buyers across Europe, North America, Asia, and the Middle East.",
  "Focused on long-term supply partnerships, not one-off transactions.",
]

const POSITION_CARDS = [
  {
    icon: Building2,
    title: `Based in ${SITE.address.city}`,
    body: "Commercial, quality and export operations run from our Lahore head office, close to the trade and logistics infrastructure buyers depend on.",
  },
  {
    icon: Globe2,
    title: "Global Reach",
    body: "Exporting to manufacturers, brands, and importers across multiple continents, with documentation matched to each destination market.",
  },
  {
    icon: Fingerprint,
    title: "Responsibly Sourced",
    body: "Hides selected from trusted partner tanneries with documented traceability and ethical processing practices.",
  },
]

const BUYER_FRICTIONS = [
  { n: "01", text: "Inconsistent grading between samples and bulk orders." },
  { n: "02", text: "Unclear specifications and vague communication." },
  { n: "03", text: "Limited transparency around sourcing and processing." },
  { n: "04", text: "Risk-heavy payments with little buyer protection." },
]

const STORY = [
  {
    chapter: "Chapter 01 · Who We Are",
    title: "A clearer path to Pakistan's leather",
    body: "Pure Grain Exports was founded to create a clearer, more dependable path — connecting serious international buyers with carefully selected leather that meets and exceeds global expectations.",
    image: "/local/cutting-detail.jpg",
    alt: "Close-up of leather being cut to a pattern",
  },
  {
    chapter: "Chapter 02 · The Heritage",
    title: "A craft tradition the world overlooks",
    body: "Pakistan has long been one of the world's major leather-producing regions, yet many buyers struggle to access its true potential due to fragmented supply chains and inconsistent export practices. We exist to bridge that gap.",
    image: "/leather-artisan-crafting-premium-leather-in-worksh.jpg",
    alt: "A leatherworker shaping a piece by hand at the workbench",
  },
  {
    chapter: "Chapter 03 · Our Tannery Network",
    title: "Vetted partners, not anonymous suppliers",
    body: "We work exclusively with a carefully vetted network of Pakistan's leading tanneries — facilities that operate to international production standards, maintain documented quality processes, and consistently deliver leather that meets the expectations of buyers in Europe, North America, and beyond.",
    image: "/local/hide-inspection.jpg",
    alt: "Tannery interior with processing drums and hides in production",
  },
  {
    chapter: "Chapter 04 · Where the Craft Lives",
    title: "How we choose who we work with",
    body: "These are not general-purpose suppliers. They are specialists — tanneries where the craft of leather production is taken seriously at every stage, from raw hide selection through to final finishing. Sialkot, Kasur and Karachi sit at the heart of one of the world's oldest leather industries, and our partners represent its finest output.",
    image: "/local/cutting-leather.jpg",
    alt: "A craftsman cutting leather to a pattern by hand",
  },
  {
    chapter: "Chapter 05 · The Result",
    title: "Heritage delivered with documentation",
    body: "The result is leather that carries the heritage and skill of Pakistan's finest production, delivered with the documentation, grading transparency, and reliability that serious international buyers require.",
    image: "/local/finishing-goods.jpg",
    alt: "Finished leather goods ready for despatch",
  },
]

const TANNERY_CRITERIA = [
  {
    icon: Layers,
    title: "Grain Consistency",
    body: "Consistent natural grain quality and fibre integrity across every hide in a batch — not just the samples.",
  },
  {
    icon: ShieldCheck,
    title: "International Standards",
    body: "Adherence to international chemical and finish standards including REACH compliance for European market entry.",
  },
  {
    icon: Fingerprint,
    title: "Full Traceability",
    body: "Documented traceability of raw hide sourcing from abattoir through tanning, finishing, and grading.",
  },
  {
    icon: Repeat2,
    title: "Repeat Order Reliability",
    body: "Proven ability to reproduce specifications consistently across multiple production runs — not just one-off orders.",
  },
]

const VALUES = [
  {
    title: "Natural Quality",
    body: "Leather selected for its true grain, fibre strength, and character — never artificially corrected surfaces.",
  },
  {
    title: "Transparency",
    body: "Clear specifications, honest grading, and upfront communication at every step of the buying journey.",
  },
  {
    title: "Consistency",
    body: "Samples that genuinely reflect bulk orders. Processes designed for repeatability, not surprises.",
  },
  {
    title: "Respect for Craft",
    body: "Leather treated as a foundation material with a centuries-long tradition — not a commodity.",
  },
]

const SCOPE = [
  {
    title: "Leather Hides (Bulk Supply)",
    image: "/premium-raw-leather-hide-texture.jpg",
    alt: "Close-up of a premium raw leather hide showing natural grain",
    items: [
      "Full-grain leather hides",
      "Suede and specialty finishes",
      "Cow, buffalo, goat hides",
      "Custom thickness and finishes",
      "MOQ-based wholesale supply",
    ],
    href: "/catalog/raw-leather",
    cta: "Browse Leather Hides",
  },
  {
    title: "Finished Leather Goods (Wholesale)",
    image: "/local/finishing-goods.jpg",
    alt: "A selection of finished leather goods",
    items: ["Wallets", "Belts", "Small leather accessories", "Custom designs on request"],
    href: "/catalog/finished-products",
    cta: "Browse Finished Products",
  },
]

const PROCESS = [
  { n: "01", title: "Inquiry and Requirements", body: "You share specifications, volume, and intended end-use." },
  { n: "02", title: "Sampling", body: "Verified samples provided where applicable — shipping charged at cost." },
  { n: "03", title: "Quotation", body: "Transparent pricing based on grade, quantity, and logistics." },
  { n: "04", title: "Order Confirmation", body: "Payment via bank transfer or irrevocable Letter of Credit (LC)." },
  { n: "05", title: "Production and Dispatch", body: "Quality-checked, fully documented, and shipped with end-to-end tracking." },
]

const COMPLIANCE = [
  {
    icon: FileCheck2,
    title: "Incorporated Business",
    body: "Officially registered and incorporated in Pakistan. Incorporation letter available for your records.",
  },
  {
    icon: BadgeCheck,
    title: "TDAP Registered Exporter",
    body: "Registered with the Trade Development Authority of Pakistan (TDAP) for international export compliance.",
  },
  {
    icon: ScrollText,
    title: "Export Licensed",
    body: "Fully licensed for leather hide and finished goods export under Pakistani trade regulations.",
  },
]

const AUDIENCES = [
  { title: "Footwear Manufacturers", body: "Consistent full-grain hides for production-scale footwear programs." },
  { title: "Fashion & Apparel Brands", body: "Premium leather for seasonal collections and private label lines." },
  { title: "Private Label Producers", body: "Custom specifications, grading, and full export documentation." },
  { title: "Designers & Ateliers", body: "Small-batch specialty leather with natural grain character." },
  { title: "Importers & Distributors", body: "Reliable wholesale supply with full LC payment support." },
  { title: "Furniture & Upholstery", body: "Buffalo and cow hides for commercial upholstery programs." },
]

const EXPORT_REGIONS = [
  { region: "Europe", countries: "Germany, UK, France, Italy, Netherlands, Spain" },
  { region: "North America", countries: "USA, Canada" },
  { region: "Asia Pacific", countries: "China, Japan, India, Australia" },
  { region: "Middle East", countries: "UAE, Saudi Arabia" },
  { region: "Africa", countries: "South Africa, Nigeria, Kenya" },
]

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AboutContent() {
  return (
    <>
      <AboutHero />
      <Positioning />
      <BuyerFriction />
      <Story />
      <TanneryCriteria />
      <Values />
      <Founder />
      <ProductScope />
      <Process />
      <Compliance />
      <Audiences />
      <ExportMap />
      <Faq />
      <AboutCta />
    </>
  )
}

function AboutHero() {
  return (
    <section className="relative flex min-h-[86svh] items-center overflow-hidden bg-leather pb-20 pt-28 md:pt-32">
      {/*
        Tannery interior — drums, hides in process, working plant floor.
        This is a real working tannery, but it is NOT a photograph of a Pakistani
        tannery and is not captioned as one: no freely-licensed photograph of a
        Pakistani tannery exists (searches for "tannery Pakistan", "Punjab
        tannery", "leather factory Pakistan" all return zero results; "Kasur"
        returns only mosques and electoral maps). Swap this file for your own
        Kasur/Sialkot plant photography when you have it — no copy changes needed.
      */}
      <div className="absolute inset-0">
        <Image
          src="/local/hide-preparation.jpg"
          alt="Inside a working tannery — stacked hides and tanning drums on the plant floor"
          fill
          sizes="100vw"
          quality={80}
          priority
          className="object-cover object-center"
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-leather/95 via-leather/85 to-leather/45"
      />
      {/* Vertical scrim. Without it the fixed header sits over the bright sky in
          the upper right of the photograph and the nav links wash out. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-leather/85 via-transparent to-leather/60"
      />
      <div aria-hidden="true" className="texture-grain absolute inset-0" />

      <div className="container-wide relative z-10 w-full">
        <div className="max-w-3xl lg:max-w-4xl">
          <Reveal y={16}>
            <p className="flex items-center gap-3 text-eyebrow-on-dark">
              <span aria-hidden="true" className="h-px w-8 bg-brass" />
              About Pure Grain Exports
            </p>
          </Reveal>
          <Reveal y={16} delay={0.08}>
            <h1 className="heading-display mt-5 text-balance text-leather-foreground">
              Premium Leather, Sourced with Integrity.
            </h1>
          </Reveal>
          <Reveal y={16} delay={0.16}>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-leather-foreground/80 md:text-lg">
              We supply high-grade leather sheets and hides to international manufacturers,
              designers and brands — with transparency, consistency, and an enduring respect for the
              natural grain.
            </p>
          </Reveal>
          <Reveal y={16} delay={0.24}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link href="/sample-request" className="btn-brass group">
                Request Free Samples
                <ArrowRight
                  size={16}
                  className="ml-2 transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center rounded-none border border-leather-foreground/45 px-8 py-4 text-sm font-medium uppercase tracking-wide text-leather-foreground transition-colors duration-300 hover:bg-leather-foreground hover:text-leather focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-leather"
              >
                View Full Catalog
              </Link>
            </div>
          </Reveal>
        </div>

        <Stagger className="mt-14 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-leather-foreground/20 pt-8 lg:grid-cols-4">
          {HERO_STATS.map((stat) => (
            <StaggerItem key={stat.label}>
              <p className="font-serif text-3xl font-semibold text-brass md:text-4xl">{stat.value}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-leather-foreground/75 sm:text-sm">
                {stat.label}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

function Positioning() {
  return (
    <section className="section-padding">
      <div className="container-wide">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <div>
            <SectionHeading eyebrow="At a Glance" title="Who you are dealing with" />
            <Stagger className="mt-8 space-y-3">
              {AT_A_GLANCE.map((item) => (
                <StaggerItem key={item}>
                  <p className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brass-ink" strokeWidth={2} />
                    {item}
                  </p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-5">
            {POSITION_CARDS.map((card) => (
              <StaggerItem key={card.title}>
                <div className="flex h-full gap-4 border border-border bg-card p-6 shadow-card transition-all duration-300 hover:border-brass/50 hover:shadow-card-hover">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-brass/35 text-brass-ink">
                    <card.icon size={20} strokeWidth={1.5} />
                  </span>
                  <div>
                    <h3 className="font-serif text-lg font-medium text-foreground">{card.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  )
}

function BuyerFriction() {
  return (
    <section className="section-padding relative overflow-hidden bg-primary text-primary-foreground dark:bg-background dark:text-foreground">
      <div aria-hidden="true" className="texture-grain absolute inset-0" />
      <div className="container-wide relative">
        <SectionHeading
          eyebrow="The Problem"
          title="Why sourcing leather shouldn't be complicated"
          lede="International buyers sourcing leather often face operational friction that slows timelines and adds risk. Pure Grain Exports was built to remove these uncertainties."
          onDark
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <Stagger className="space-y-px">
            {BUYER_FRICTIONS.map((f) => (
              <StaggerItem key={f.n}>
                <div className="flex items-start gap-5 border-b border-primary-foreground/12 py-5 dark:border-border">
                  <span className="font-serif text-2xl font-semibold text-brass">{f.n}</span>
                  <p className="pt-1 text-sm leading-relaxed text-primary-foreground/70 dark:text-muted-foreground md:text-base">
                    {f.text}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal delay={0.15}>
            <div className="h-full border border-brass/30 bg-brass/5 p-8">
              <span className="flex h-12 w-12 items-center justify-center border border-brass/40 text-brass">
                <Sparkles size={22} strokeWidth={1.5} />
              </span>
              <h3 className="mt-6 font-serif text-2xl font-medium">Built for Clarity</h3>
              <p className="mt-3 text-sm leading-relaxed text-primary-foreground/70 dark:text-muted-foreground">
                We reduce buyer-side risk through structured grading, documented specifications, and
                repeatable processes.
              </p>
              <ul className="mt-6 space-y-2.5">
                {["Clear specs", "Verified grading", "Sample-to-bulk alignment"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 size={16} className="shrink-0 text-brass" strokeWidth={2} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Story() {
  return (
    <section className="section-padding">
      <div className="container-wide">
        <SectionHeading
          eyebrow="Our Story"
          title="From founding mission to a vetted network"
          lede="The chapters that built Pure Grain Exports — and the standards we hold our partners to."
        />

        {/* 3:2 images and tighter rhythm — at 4:3 with space-y-24 the five
            chapters alone pushed the page past 13,000px. */}
        <div className="mt-14 space-y-14 lg:space-y-16">
          {STORY.map((chapter, index) => (
            <div
              key={chapter.title}
              className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14"
            >
              {/* Alternate sides on desktop; images always lead on mobile. */}
              <Reveal
                y={20}
                className={index % 2 === 1 ? "lg:order-2" : undefined}
              >
                <div className="relative overflow-hidden border border-border shadow-card">
                  <img
                    src={chapter.image}
                    alt={chapter.alt}
                    className="aspect-[3/2] w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </Reveal>

              <Reveal y={20} delay={0.1} className={index % 2 === 1 ? "lg:order-1" : undefined}>
                <p className="text-eyebrow">{chapter.chapter}</p>
                <h3 className="heading-subsection mt-4 text-foreground">{chapter.title}</h3>
                <div className="divider-brass mt-5" />
                <p className="mt-6 text-base leading-relaxed text-muted-foreground">{chapter.body}</p>
              </Reveal>
            </div>
          ))}
        </div>

        <Reveal delay={0.1} className="mt-16">
          <blockquote className="mx-auto max-w-3xl border-l-2 border-brass bg-bone p-8 text-center">
            <p className="font-serif text-xl font-medium leading-relaxed text-foreground md:text-2xl">
              This is not a trading operation built on price. It is a sourcing partnership built on
              standards.
            </p>
            <footer className="mt-4 text-sm text-muted-foreground">
              Our focus is simple: offer leather we would confidently use ourselves.
            </footer>
          </blockquote>
        </Reveal>
      </div>
    </section>
  )
}

function TanneryCriteria() {
  return (
    <section className="section-padding bg-bone">
      <div className="container-wide">
        <SectionHeading
          align="center"
          eyebrow="Partner Standards"
          title="Four criteria, checked continuously"
          lede="Every tannery is evaluated against these — before the partnership starts and throughout it."
        />

        <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TANNERY_CRITERIA.map((c) => (
            <StaggerItem key={c.title} className="h-full">
              <div className="flex h-full flex-col border border-border bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brass/50 hover:shadow-card-hover">
                <span className="flex h-12 w-12 items-center justify-center border border-border text-brass-ink">
                  <c.icon size={22} strokeWidth={1.5} />
                </span>
                <h3 className="mt-5 font-serif text-lg font-medium text-foreground">{c.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

function Values() {
  return (
    <section className="section-padding">
      <div className="container-wide">
        <SectionHeading
          eyebrow="Our Values"
          title={<>What &ldquo;Pure Grain&rdquo; stands for</>}
        />
        <Stagger className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v, i) => (
            <StaggerItem key={v.title}>
              <p className="font-serif text-3xl font-semibold text-brass/40">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 font-serif text-xl font-medium text-foreground">{v.title}</h3>
              <div className="divider-brass mt-4" />
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

function Founder() {
  return (
    <section className="section-padding bg-bone">
      <div className="container-wide">
        <Reveal>
          <div className="mx-auto grid max-w-4xl gap-8 border border-border bg-background p-8 shadow-card sm:grid-cols-[auto_1fr] sm:items-start md:p-10">
            <span
              aria-hidden="true"
              className="flex h-20 w-20 items-center justify-center border border-brass/40 bg-brass/10 font-serif text-2xl font-semibold text-brass-ink"
            >
              AH
            </span>
            <div>
              <p className="text-eyebrow">The People Behind Pure Grain</p>
              <h3 className="heading-subsection mt-3 text-foreground">
                Ahmad Hassan — Founder &amp; Director
              </h3>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                With over a decade of experience in Pakistan&apos;s leather export industry, Ahmad
                established Pure Grain Exports to bring structure, transparency, and global
                standards to a fragmented market. A firm believer in material integrity, he
                personally oversees quality grading and client relationships across every wholesale
                engagement.
              </p>
              <a
                href={SITE.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brass-ink transition-colors hover:text-brass"
              >
                <Linkedin size={15} />
                Connect on LinkedIn
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function ProductScope() {
  return (
    <section className="section-padding">
      <div className="container-wide">
        <SectionHeading
          eyebrow="Our Product Scope"
          title="A focused lineup for wholesale buyers"
          lede="Built for buyers who need consistent quality, reliable grading, and export-ready documentation."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {SCOPE.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1}>
              <Link
                href={s.href}
                className="group flex h-full flex-col overflow-hidden border border-border bg-card shadow-card transition-all duration-300 hover:border-brass/50 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2"
              >
                <div className="relative h-52 overflow-hidden sm:h-60">
                  <img
                    src={s.image}
                    alt={s.alt}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-leather/90 via-leather/35 to-transparent"
                  />
                  <h3 className="heading-subsection absolute inset-x-0 bottom-0 p-6 text-leather-foreground">
                    {s.title}
                  </h3>
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <ul className="space-y-2.5">
                    {s.items.map((item) => (
                      <li key={item} className="flex items-center gap-3 text-sm text-foreground/90">
                        <CheckCircle2 size={16} className="shrink-0 text-brass-ink" strokeWidth={2} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-8 flex items-center gap-2 border-t border-border pt-6 text-sm font-semibold uppercase tracking-wide text-brass-ink">
                    {s.cta}
                    <ArrowRight
                      size={16}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <p className="mt-8 border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
            All pricing is quote-based to match your exact specifications, quality grade, and order
            volume.
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function Process() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 65%"] })
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 28, mass: 0.4 })

  return (
    <section className="section-padding bg-bone relative">
      <div className="container-wide">
        <SectionHeading
          eyebrow="How It Works"
          title="Our sourcing and order process"
          lede="From first inquiry to delivered shipment — a clear, documented path built for international wholesale buyers."
        />

        <div ref={ref} className="relative mt-16">
          <div aria-hidden="true" className="absolute left-[10%] right-[10%] top-8 hidden h-px bg-border lg:block">
            <motion.div className="h-full origin-left bg-brass" style={{ scaleX: reduce ? 1 : progress }} />
          </div>
          <div aria-hidden="true" className="absolute bottom-8 left-8 top-8 w-px bg-border md:hidden">
            <motion.div className="h-full w-full origin-top bg-brass" style={{ scaleY: reduce ? 1 : progress }} />
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-5">
            {PROCESS.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.08} className="relative flex gap-5 md:block">
                <span className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center border border-border bg-background font-serif text-2xl font-semibold text-leather dark:text-tan">
                  {step.n}
                </span>
                <div className="md:mt-6">
                  <h3 className="font-serif text-lg font-medium text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.2} className="mt-14 text-center">
          <Link href="/quote-request" className="btn-brass group">
            Get a Custom Quote
            <ArrowRight size={16} className="ml-2 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <p className="mt-4 text-xs text-muted-foreground">Typical response within 1 business day.</p>
        </Reveal>
      </div>
    </section>
  )
}

function Compliance() {
  return (
    <section className="section-padding relative overflow-hidden bg-leather text-leather-foreground">
      <div aria-hidden="true" className="texture-grain absolute inset-0" />
      <div className="container-wide relative">
        <SectionHeading
          eyebrow="Verified &amp; Compliant"
          title="Secure and professional trade practices"
          lede="We align documentation, invoicing and export processes with global trade standards — protecting both parties at every stage."
          onDark
          className="!max-w-3xl"
        />

        <Stagger className="mt-14 grid gap-6 md:grid-cols-3">
          {COMPLIANCE.map((c) => (
            <StaggerItem key={c.title} className="h-full">
              <div className="flex h-full flex-col border border-leather-foreground/15 p-6 transition-colors duration-300 hover:border-brass/45 hover:bg-leather-foreground/5">
                <span className="flex h-12 w-12 items-center justify-center border border-brass/35 text-brass">
                  <c.icon size={22} strokeWidth={1.5} />
                </span>
                <h3 className="mt-5 font-serif text-lg font-medium">{c.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-leather-foreground/70">{c.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.2}>
          <Link
            href="/payments-and-trade-terms"
            className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-brass transition-colors hover:text-leather-foreground"
          >
            Full payment terms and trade conditions
            <ArrowRight size={15} />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

function Audiences() {
  return (
    <section className="section-padding">
      <div className="container-wide">
        <SectionHeading
          align="center"
          eyebrow="Who We Serve"
          title="Built for buyers who plan ahead"
          lede="From manufacturers running production-scale lines to designers working in small batches."
        />
        <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCES.map((a) => (
            <StaggerItem key={a.title} className="h-full">
              <div className="h-full border border-border bg-card p-6 shadow-card transition-all duration-300 hover:border-brass/50 hover:shadow-card-hover">
                <h3 className="font-serif text-lg font-medium text-foreground">{a.title}</h3>
                <div className="divider-brass mt-3" />
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

function ExportMap() {
  return (
    <section className="section-padding bg-bone">
      <div className="container-wide">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Where We Export"
              title="Shipping to buyers on five continents"
              lede="Documentation is matched to the destination market, so shipments clear customs without surprises."
            />
            <Reveal delay={0.25}>
              <div className="mt-8 overflow-hidden border border-border shadow-card">
                <img
                  src="/local/sialkot-city.jpg"
                  alt="Sialkot, Punjab — one of the leather clusters Pure Grain sources from"
                  className="aspect-[16/10] w-full object-cover"
                  loading="lazy"
                />
                <p className="border-t border-border bg-background p-4 text-xs text-muted-foreground">
                  Sialkot, Punjab — one of the established leather clusters our partner tanneries
                  operate in, alongside Kasur and Karachi.
                </p>
              </div>
            </Reveal>
          </div>

          <Stagger className="grid gap-4 sm:grid-cols-2 lg:content-start">
            {EXPORT_REGIONS.map((r) => (
              <StaggerItem key={r.region}>
                <div className="h-full border border-border bg-background p-5 transition-colors duration-300 hover:border-brass/50">
                  <div className="flex items-center gap-2.5">
                    <Globe2 size={16} className="text-brass-ink" strokeWidth={1.6} />
                    <h3 className="font-serif text-lg font-medium text-foreground">{r.region}</h3>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{r.countries}</p>
                </div>
              </StaggerItem>
            ))}
            <StaggerItem className="sm:col-span-2">
              <p className="border border-dashed border-border p-5 text-sm text-muted-foreground">
                Don&apos;t see your country?{" "}
                <Link href="/contact" className="font-semibold text-brass-ink hover:text-brass">
                  Contact us
                </Link>{" "}
                — we ship worldwide.
              </p>
            </StaggerItem>
          </Stagger>
        </div>
      </div>
    </section>
  )
}

function Faq() {
  return (
    <section className="section-padding">
      <div className="container-wide">
        <SectionHeading align="center" eyebrow="FAQ" title="Frequently asked questions" />

        <div className="mx-auto mt-14 max-w-3xl divide-y divide-border border-y border-border">
          {FAQS.map((item, i) => (
            <Reveal key={item.q} delay={i * 0.04}>
              {/* Native <details> keeps this keyboard-accessible and functional
                  without JS, which matters for a page buyers may print or read
                  on a poor connection. */}
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left font-medium text-foreground transition-colors hover:text-brass-ink [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="relative h-4 w-4 shrink-0 text-brass-ink before:absolute before:left-0 before:top-1/2 before:h-px before:w-4 before:-translate-y-1/2 before:bg-current after:absolute after:left-1/2 after:top-0 after:h-4 after:w-px after:-translate-x-1/2 after:bg-current after:transition-transform after:duration-300 group-open:after:rotate-90 group-open:after:opacity-0"
                  />
                </summary>
                <p className="pb-6 pr-8 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function AboutCta() {
  return (
    <section className="relative overflow-hidden border-y border-border bg-bone py-24 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 30%, hsl(var(--leather)) 0%, transparent 45%), radial-gradient(circle at 75% 70%, hsl(var(--accent)) 0%, transparent 50%)",
        }}
      />
      <div aria-hidden="true" className="rule-brass-fade absolute inset-x-0 top-0 h-px" />
      <div className="container-wide relative">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="text-eyebrow">Next Step</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="heading-display mt-4 text-balance text-foreground">
              Let&apos;s talk about your specification
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
              Send us what you are producing and we will match it to the right hide, finish and
              grade — with samples before you commit to volume.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
              <Link href="/sample-request" className="btn-brass">
                Request Free Samples
              </Link>
              <Link href="/contact" className="btn-secondary">
                Contact Sales
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
