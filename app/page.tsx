"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion"
import {
  ArrowRight,
  Briefcase,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Footprints,
  Globe,
  Globe2,
  Layers,
  Scissors,
  Shield,
  Sofa,
  Truck,
  Users,
  Watch,
} from "lucide-react"

import PriceDisplay from "@/components/PriceDisplay"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { HeroSlider, type HeroSlide } from "@/components/landing/HeroSlider"
import {
  Reveal,
  SectionHeading,
  Stagger,
  StaggerItem,
} from "@/components/landing/primitives"
import type { IRawLeather, IRawLeatherType } from "@/types/rawLeather"
import type { IProduct } from "@/types/product"
import { getRawLeatherTypes } from "@/lib/taxonomy"
import { HOME_FAQS } from "@/lib/content/faqs"
import { JsonLd, faqPageSchema } from "@/lib/schema"

/* -------------------------------------------------------------------------- */
/* Static content                                                             */
/* -------------------------------------------------------------------------- */

// Single hero slide. The previous three-slide rotation carried two fabricated
// legacy claims ("25+ years of expertise", "exports to 40+ countries") that the
// Aug 2026 audit flagged as unverifiable — they cannot be replaced without
// inventing new copy, so the rotation collapses to the one defensible slide.
// HeroSlider suppresses autoplay when slides.length <= 1, so the counter and
// paging chrome degrade cleanly.
const HERO_SLIDES: HeroSlide[] = [
  {
    image: "/hero-leather-warm.jpg",
    imageAlt: "Full-grain leather hide with a warm natural finish",
    label: "B2B Wholesale Leather Supplier — Lahore, Pakistan",
    headline: "Wholesale Leather Hides & OEM Leather Goods Supplier from Pakistan",
    description:
      "Full-grain cowhide, buffalo hide, and goat skin sourced from vetted tanneries in Kasur, Sialkot, and Lahore. Custom finish, thickness, and color to your production specification. Finished leather goods produced under your label — wallets, belts, bags, jackets, backpacks. Free samples for verified trade buyers. DDP shipping to USA, UK, UAE, Canada, and beyond.",
    primaryCta: { label: "Request Free Leather Samples", href: "/sample-request" },
    secondaryCta: { label: "Browse Wholesale Catalog", href: "/catalog" },
  },
]

/**
 * Trust strip.
 *
 * The previous version rendered four count-ups — "25+ Years / 40+ Countries /
 * ISO 9001 / 500K+ Sq Ft" — every one of which the Aug 2026 audit flagged as
 * fabricated or unverifiable. Replaced with four qualitative pillars whose
 * every claim is defensible: sourcing regions we do use, documents we do
 * provide, a sample workflow we do run, and payment rails we do accept.
 */
const TRUST_PILLARS: Array<{ title: string; detail: string }> = [
  {
    title: "Direct Tannery Access",
    detail:
      "Vetted partners in Kasur, Sialkot, and Lahore — Pakistan's three leather production hubs.",
  },
  {
    title: "Full Export Documentation",
    detail:
      "Commercial invoice, packing list, certificate of origin, HTS classification — provided with every shipment.",
  },
  {
    title: "Sample-First Approach",
    detail:
      "Physical swatches shipped for approval before you commit to production.",
  },
  {
    title: "Multiple Payment Terms",
    detail:
      "Letter of Credit for wholesale orders. PayPal for samples. TT for established buyers.",
  },
]

/**
 * The two ways a buyer can work with Pure Grain — bulk hides sold by the sq ft,
 * or OEM private-label goods produced under the buyer's brand. Copy matches the
 * Aug 2026 SEO strategy's "What We Supply" section verbatim so search-intent and
 * on-page language align. Card 2 routes to /custom-manufacturing (the OEM
 * landing page) rather than the finished-products catalogue, because the CTA
 * intent shifted from "browse ready-made SKUs" to "commission your own line".
 */
const SUPPLY_PATHS = [
  {
    eyebrow: "Bulk Material",
    title: "Wholesale Leather Hides",
    description:
      "Full hides and sides supplied by the square foot for manufacturers running their own production. Cowhide, buffalo hide, and goat skin. Specify your thickness (1.0mm to 4.5mm), finish (aniline, semi-aniline, pigmented, pull-up, crazy horse, waxed, nappa, embossed), and color — we source to match your specification and dispatch samples for approval before bulk.",
    points: [
      "Sold per square foot",
      "Custom thickness, finish, color to your production spec",
      "Minimum order 100 sq ft to start",
      "FOB Karachi or DDP to your address",
    ],
    href: "/catalog/raw-leather",
    cta: "Browse Wholesale Leather Hides",
    icon: Layers,
    image: "/hero-leather-tan.jpg",
    imageAlt:
      "Stacked tan leather hides showing consistent color across a batch - wholesale leather export Pakistan",
  },
  {
    eyebrow: "Private Label",
    title: "OEM / Private-Label Leather Goods",
    description:
      "Finished leather goods manufactured under your brand — wallets, belts, bags, jackets, backpacks, small leather goods. From your designs and specifications, produced in our vetted production units and shipped under your labeling. Custom hardware, branded packaging, and logo embossing/debossing included as standard capabilities.",
    points: [
      "Wholesale MOQ from 50-100 units per SKU",
      "Full private-label — your brand, your packaging",
      "Sample-first: approve before bulk",
    ],
    href: "/custom-manufacturing",
    cta: "Explore OEM Manufacturing",
    icon: Scissors,
    image: "/hero-leather-espresso.jpg",
    imageAlt:
      "Dark espresso brown leather hide with fine natural grain - premium full-grain cowhide wholesale",
  },
]

const WHY_CHOOSE_US = [
  {
    icon: Layers,
    title: "Direct Tannery Sourcing",
    description:
      "No middlemen. We source hides directly from tannery partners in Kasur, Sialkot, and Lahore, giving you consistent grain and color across batches.",
  },
  {
    icon: Scissors,
    title: "Custom Specifications",
    description:
      "Thickness, finish, and color matched to your production spec. If we haven't worked with your exact specification before, we source samples first for your approval before committing to bulk.",
  },
  {
    icon: Shield,
    title: "Transparent Trade Terms",
    description:
      "LC (Letter of Credit) for wholesale orders — bank-guaranteed protection for new buyers. PayPal accepted for sample orders. TT for established buyers.",
  },
  {
    icon: Briefcase,
    title: "Full Export Documentation",
    description:
      "Every shipment includes commercial invoice, packing list, certificate of origin, and HTS classification for smooth customs clearance in your destination country.",
  },
  {
    icon: Truck,
    title: "DDP Shipping to Key Markets",
    description:
      "Delivered Duty Paid to USA, UK, Canada, UAE, and Europe — we handle freight, customs clearance, duties, and final delivery. FOB Karachi also available.",
  },
  {
    icon: FlaskConical,
    title: "Sample-First Approach",
    description:
      "Physical leather swatches or product samples shipped for your approval before you commit to production. You evaluate real material, not a promise.",
  },
]

const INDUSTRIES = [
  { icon: Footprints, name: "Footwear", description: "Premium leather for luxury shoes, boots and athletic footwear." },
  { icon: Sofa, name: "Furniture", description: "Durable upholstery leather for sofas, chairs and interior design." },
  { icon: Car, name: "Automotive", description: "High-performance leather for vehicle interiors and marine applications." },
  { icon: Briefcase, name: "Fashion & Bags", description: "Supple leather for handbags, jackets and fashion accessories." },
  { icon: Watch, name: "Accessories", description: "Fine leather for watch straps, belts and small leather goods." },
]

const PROCESS_STEPS = [
  {
    number: "01",
    title: "Browse & Shortlist",
    description: "Explore the collection and identify materials that match your specification.",
  },
  {
    number: "02",
    title: "Request Samples",
    description: "Order physical samples to evaluate quality, texture and colour in your own environment.",
  },
  {
    number: "03",
    title: "Discuss Requirements",
    description: "Work with our team to finalise specifications, customisations and quantities.",
  },
  {
    number: "04",
    title: "Production & QC",
    description: "Your order enters production with quality control checks at every stage.",
  },
  {
    number: "05",
    title: "Global Delivery",
    description: "Reliable logistics ensures timely delivery with full export documentation.",
  },
]

const GLOBAL_REGIONS = [
  { name: "North America", countries: "USA, Canada, Mexico" },
  { name: "Europe", countries: "UK, Germany, Italy, France, Spain" },
  { name: "Asia Pacific", countries: "Japan, South Korea, Australia" },
  { name: "Middle East", countries: "UAE, Saudi Arabia, Qatar" },
  { name: "South America", countries: "Brazil, Argentina, Chile" },
  { name: "Africa", countries: "South Africa, Nigeria, Kenya" },
]

/*
 * Testimonials removed.
 *
 * The three prior quotes attributed to Marco Bianchi (Bellissimo Calzature),
 * Sarah Thompson (Heritage Furnishings) and Hans Weber (Precision Auto
 * Interiors) were fabricated — none of those companies exist. The Aug 2026
 * audit flagged them as the single most trust-damaging item on the page,
 * because a B2B buyer running due diligence verifies every named reference.
 * The section is removed rather than replaced; a substitute will only be
 * reintroduced once written client permission is on file for each quote.
 */

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function PureGrainLanding() {
  const reduce = useReducedMotion()

  const [rawLeatherTypes, setRawLeatherTypes] = useState<IRawLeatherType[]>([])
  const [featuredRawLeather, setFeaturedRawLeather] = useState<IRawLeather[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<IProduct[]>([])
  const [rawLeatherSamplePool, setRawLeatherSamplePool] = useState<IRawLeather[]>([])
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    const fetchLandingData = async () => {
      setIsCatalogLoading(true)
      try {
        // The taxonomy comes from the shared cache (lib/taxonomy) — the Header
        // has already requested it, so this reuses that in-flight promise
        // instead of making a fourth identical call.
        const [types, rawLeatherRes, featuredRawRes, featuredProductsRes] = await Promise.all([
          getRawLeatherTypes(),
          fetch("/api/raw-leather?limit=100&sortBy=createdAt&order=desc"),
          fetch("/api/raw-leather?isFeatured=true&limit=4&sortBy=createdAt&order=desc"),
          fetch("/api/finished-products?isFeatured=true&limit=4&sortBy=createdAt&order=desc"),
        ])

        if (!rawLeatherRes.ok || !featuredRawRes.ok || !featuredProductsRes.ok) {
          throw new Error("Failed to load homepage data")
        }

        const [rawLeatherData, featuredRawData, featuredProductsData] = await Promise.all([
          rawLeatherRes.json(),
          featuredRawRes.json(),
          featuredProductsRes.json(),
        ])

        if (!isActive) return

        setRawLeatherTypes(types as IRawLeatherType[])
        setRawLeatherSamplePool(Array.isArray(rawLeatherData.data) ? rawLeatherData.data : [])
        setFeaturedRawLeather(Array.isArray(featuredRawData.data) ? featuredRawData.data : [])
        setFeaturedProducts(Array.isArray(featuredProductsData.data) ? featuredProductsData.data : [])
        setDataError(null)
      } catch (error) {
        if (!isActive) return
        console.error("Error loading homepage data:", error)
        setDataError("Unable to load live catalog data right now.")
      } finally {
        if (isActive) setIsCatalogLoading(false)
      }
    }

    fetchLandingData()
    return () => {
      isActive = false
    }
  }, [])

  const leatherCategoryCards = useMemo(() => {
    if (!rawLeatherTypes.length) return []
    const sampleByType = new Map<string, IRawLeather>()
    rawLeatherSamplePool.forEach((item) => {
      if (!sampleByType.has(item.leatherType)) sampleByType.set(item.leatherType, item)
    })

    return rawLeatherTypes
      .filter((type) => sampleByType.has(type.name))
      .map((type) => {
        const sample = sampleByType.get(type.name)
        return {
          id: type._id,
          title: type.name,
          count: rawLeatherSamplePool.filter((item) => item.leatherType === type.name).length,
          image: sample?.images?.[0] ?? "/placeholder.svg?height=800&width=800",
          // Carry the type through as a filter so clicking a category lands on
          // that category's results, not the unfiltered catalogue.
          href: `/catalog/raw-leather?type=${encodeURIComponent(type.name)}`,
        }
      })
  }, [rawLeatherSamplePool, rawLeatherTypes])

  return (
    <div className="min-h-screen bg-background">
      {/* Organization + WebSite already come from the root layout; this adds the
          homepage's own FAQPage, built from the same array the section renders. */}
      <JsonLd data={faqPageSchema(HOME_FAQS)} />
      <Header />

      <HeroSlider slides={HERO_SLIDES} />

      <TrustStrip />
      <SupplyPaths />
      <LeatherCategories
        cards={leatherCategoryCards}
        isLoading={isCatalogLoading}
        error={dataError}
      />
      <WhyChooseUs />
      <FeaturedMaterials
        hides={featuredRawLeather}
        products={featuredProducts}
        isLoading={isCatalogLoading}
      />
      <Industries />
      <Process reduce={Boolean(reduce)} />
      <GlobalReach />
      <HomeFaq />
      <ClosingCta />

      <Footer />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Sections                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Trust strip — four qualitative pillars. Every claim below is verifiable and
 * defensible; the previous count-up version carried four figures the Aug 2026
 * audit found either fabricated ("25+ Years / since 1999") or unverifiable
 * ("40+ Countries", "ISO 9001", "500K+ Sq Ft Monthly").
 */
function TrustStrip() {
  return (
    <section className="border-y border-border bg-bone">
      <div className="container-wide py-12 lg:py-14">
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {TRUST_PILLARS.map((pillar, index) => (
            <Reveal
              key={pillar.title}
              delay={index * 0.08}
              className="relative lg:px-4"
            >
              {/* Hairline separators between columns on desktop only. */}
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute -left-2 top-1 hidden h-[calc(100%-0.5rem)] w-px bg-border lg:block"
                />
              ) : null}
              <p className="font-serif text-lg font-medium text-leather dark:text-tan md:text-xl">
                {pillar.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.detail}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * Homepage FAQ.
 *
 * The homepage is the URL that both search engines and AI assistants resolve
 * the "Pure Grain Exports" entity to, and it was the only major page with no
 * question-based heading and no FAQPage markup — /about and /quality both had
 * them. Questions and answers come from `HOME_FAQS` so the rendered copy and
 * the structured data cannot drift, which is a requirement of the FAQPage spec.
 *
 * Native <details> rather than an animated accordion: the answers are then in
 * the DOM whether or not JavaScript runs, which matters because none of the AI
 * crawlers execute it.
 */
function HomeFaq() {
  return (
    <section className="section-padding border-t border-border">
      <div className="container-wide">
        <SectionHeading
          eyebrow="Common Questions"
          title="Frequently Asked Questions About Wholesale Leather Sourcing"
          lede="Short answers to the questions wholesale buyers ask before their first order — MOQs, samples, payment terms, DDP shipping, and documentation. For grading, testing and compliance detail, see Quality & Process."
        />
        <div className="mt-12 grid gap-x-12 lg:grid-cols-2">
          {HOME_FAQS.map((faq, index) => (
            <Reveal key={faq.q} delay={Math.min(index, 3) * 0.06}>
              <details className="group border-b border-border py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-serif text-lg font-medium text-foreground md:text-xl">
                  <h3 className="font-serif text-lg font-medium md:text-xl">{faq.q}</h3>
                  <span
                    aria-hidden="true"
                    /* Arbitrary value: Tailwind ships no `rotate-135` utility,
                       so the named class compiled to nothing and the caret
                       never flipped on open. */
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rotate-45 border-b-2 border-r-2 border-brass transition-transform duration-300 group-open:rotate-[225deg]"
                  />
                </summary>
                <p className="mt-3 leading-relaxed text-muted-foreground">{faq.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * Path selection. The single most useful thing this page can do for a new B2B
 * visitor is tell them which half of the business they need.
 */
function SupplyPaths() {
  return (
    <section className="section-padding">
      <div className="container-wide">
        <SectionHeading
          eyebrow="What We Supply"
          title="Wholesale Leather Hides and Finished Leather Goods"
          /* Self-contained definition of the business, straight from the Aug
             2026 SEO strategy. Names the geographic sourcing clusters (Kasur,
             Sialkot, Lahore) so entity-resolution systems have a concrete
             anchor for where the company actually operates. */
          lede="Pure Grain Exports is a Pakistan-registered B2B leather sourcing and private-label manufacturing partner. We supply two things to international buyers: bulk leather hides sold by the square foot to manufacturers running their own production, and finished leather goods produced under your brand label. Every hide is sourced directly from vetted tannery partners in Kasur, Sialkot, and Lahore — Pakistan's three most established leather production clusters."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {SUPPLY_PATHS.map((path, index) => (
            <Reveal key={path.title} delay={index * 0.1}>
              <Link
                href={path.href}
                className="group relative flex h-full flex-col overflow-hidden border border-border bg-card shadow-card transition-all duration-300 hover:border-brass/50 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2"
              >
                <div className="relative h-52 overflow-hidden sm:h-60">
                  <img
                    src={path.image}
                    alt={path.imageAlt}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-leather/90 via-leather/40 to-transparent"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
                    <div>
                      <p className="text-eyebrow-on-dark">{path.eyebrow}</p>
                      <h3 className="heading-subsection mt-2 text-leather-foreground">{path.title}</h3>
                    </div>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-brass/50 bg-leather/40 text-brass backdrop-blur-sm">
                      <path.icon size={22} strokeWidth={1.5} />
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <p className="text-sm leading-relaxed text-muted-foreground">{path.description}</p>

                  <ul className="mt-6 space-y-2.5">
                    {path.points.map((point) => (
                      <li key={point} className="flex items-center gap-3 text-sm text-foreground/90">
                        <CheckCircle2 size={16} className="shrink-0 text-brass-ink" strokeWidth={2} />
                        {point}
                      </li>
                    ))}
                  </ul>

                  <span className="mt-8 flex items-center gap-2 border-t border-border pt-6 text-sm font-semibold uppercase tracking-wide text-brass-ink">
                    {path.cta}
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
      </div>
    </section>
  )
}

type CategoryCard = {
  id: string
  title: string
  count: number
  image: string
  href: string
}

/**
 * Horizontal rail of leather categories.
 *
 * This replaced a hand-built infinite carousel that cloned the card array three
 * times and coordinated six effects to fake the wrap-around. A scroll-snap rail
 * gets native momentum scrolling and touch handling on mobile for none of that
 * state, and the arrows just call scrollBy().
 */
function LeatherCategories({
  cards,
  isLoading,
  error,
}: {
  cards: CategoryCard[]
  isLoading: boolean
  error: string | null
}) {
  const railRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const syncArrows = () => {
    const el = railRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 8)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8)
  }

  useEffect(() => {
    syncArrows()
  }, [cards.length])

  const scrollByCard = (direction: 1 | -1) => {
    const el = railRef.current
    if (!el) return
    const card = el.querySelector<HTMLElement>("[data-rail-card]")
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.8
    el.scrollBy({ left: direction * step, behavior: "smooth" })
  }

  return (
    <section className="section-padding bg-bone">
      <div className="container-wide">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow="Our Collection"
            title="Full-Grain Cowhide, Buffalo Hide, and Goat Skin — Leather Types We Wholesale"
            lede="Every category below is stocked in full-grain cowhide, buffalo hide, or goat skin, with custom thickness, finish, and color available on request."
          />

          <Reveal delay={0.2} className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              disabled={atStart}
              aria-label="Previous categories"
              className="flex h-11 w-11 items-center justify-center border border-border text-foreground transition-colors hover:border-brass hover:text-brass-ink disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              disabled={atEnd}
              aria-label="Next categories"
              className="flex h-11 w-11 items-center justify-center border border-border text-foreground transition-colors hover:border-brass hover:text-brass-ink disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
            >
              <ChevronRight size={18} />
            </button>
          </Reveal>
        </div>

        <div className="mt-12">
          {error ? (
            <div className="border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`cat-skel-${index}`} className="border border-border bg-card">
                  <div className="aspect-[4/5] animate-pulse bg-secondary" />
                  <div className="p-5">
                    <div className="h-5 w-2/3 animate-pulse bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              ref={railRef}
              onScroll={syncArrows}
              className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {cards.map((category) => (
                <Link
                  key={category.id}
                  data-rail-card
                  href={category.href}
                  className="group relative w-[74vw] shrink-0 snap-start overflow-hidden border border-border bg-card shadow-card transition-all duration-300 hover:border-brass/50 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 sm:w-[46%] lg:w-[31%] xl:w-[23.5%]"
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img
                      src={category.image}
                      alt={`${category.title} leather`}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Permanent bottom scrim. The previous version faded in a
                        transparent overlay on hover, so the "View Collection"
                        label appeared directly on the photograph with nothing
                        behind it and was frequently unreadable. */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-leather/85 via-leather/20 to-transparent"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <h3 className="font-serif text-xl font-medium text-leather-foreground">
                        {category.title}
                      </h3>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <p className="text-xs text-leather-foreground/70">
                          {category.count} {category.count === 1 ? "material" : "materials"}
                        </p>
                        <span className="inline-flex translate-y-1 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brass opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                          View <ArrowRight size={13} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function WhyChooseUs() {
  return (
    <section className="section-padding relative overflow-hidden bg-primary text-primary-foreground dark:bg-background dark:text-foreground">
      <div aria-hidden="true" className="texture-grain absolute inset-0" />
      <div className="container-wide relative">
        <SectionHeading
          eyebrow="Why PureGrain"
          title="Why B2B Buyers Choose Pure Grain Exports for Leather Sourcing"
          lede="Six commitments a wholesale buyer can check. Each is verifiable at quotation stage — payment terms, documentation, and the sample workflow are all defined in writing before the first order."
          onDark
        />

        <Stagger className="mt-16 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-12">
          {WHY_CHOOSE_US.map((feature) => (
            <StaggerItem key={feature.title} className="group">
              <span className="inline-flex h-12 w-12 items-center justify-center border border-brass/35 text-brass transition-colors duration-300 group-hover:border-brass group-hover:bg-brass/10">
                <feature.icon size={22} strokeWidth={1.5} />
              </span>
              <h3 className="mt-5 font-serif text-xl font-medium">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-primary-foreground/65 dark:text-muted-foreground">
                {feature.description}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}

/** One card shape for both hides and finished products, so the two rows below
 *  the same heading don't look like they came from different sites. */
function MaterialCard({
  href,
  image,
  eyebrow,
  title,
  facts,
  chips,
  price,
}: {
  href: string
  image: string
  eyebrow: string
  title: string
  facts: Array<{ label: string; value?: string | number }>
  chips: string[]
  price: { amount?: number; unit?: string }
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col border border-border bg-card shadow-card transition-all duration-300 hover:border-brass/50 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass-ink">{eyebrow}</p>
        <h4 className="mt-1.5 line-clamp-1 font-serif text-lg font-medium leading-snug text-foreground transition-colors group-hover:text-leather dark:group-hover:text-tan">
          {title}
        </h4>

        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          {facts.map((fact) => (
            <div key={fact.label} className="min-w-0">
              <span className="block text-muted-foreground">{fact.label}</span>
              <span className="block truncate text-foreground/90">{fact.value ?? "—"}</span>
            </div>
          ))}
        </div>

        {chips.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {chips.slice(0, 3).map((chip) => (
              <span
                key={chip}
                className="bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground"
              >
                {chip}
              </span>
            ))}
          </div>
        ) : null}

        {price.amount ? (
          <div className="mt-auto flex items-baseline gap-1 border-t border-border pt-3">
            <PriceDisplay
              usdAmount={price.amount}
              className="text-sm font-semibold text-foreground"
            />
            <span className="text-xs text-muted-foreground">/ {price.unit}</span>
          </div>
        ) : null}
      </div>
    </Link>
  )
}

function MaterialSkeleton() {
  return (
    <div className="border border-border bg-card">
      <div className="aspect-[4/3] animate-pulse bg-secondary" />
      <div className="space-y-3 p-4 sm:p-5">
        <div className="h-3 w-1/3 animate-pulse bg-secondary" />
        <div className="h-5 w-3/4 animate-pulse bg-secondary" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-4 w-full animate-pulse bg-secondary" />
          <div className="h-4 w-full animate-pulse bg-secondary" />
        </div>
        <div className="h-4 w-1/2 animate-pulse bg-secondary" />
      </div>
    </div>
  )
}

function FeaturedMaterials({
  hides,
  products,
  isLoading,
}: {
  hides: IRawLeather[]
  products: IProduct[]
  isLoading: boolean
}) {
  const groups = [
    {
      key: "hides",
      title: "Featured Leather Hides",
      href: "/catalog/raw-leather",
      linkLabel: "View all hides",
      empty: "No featured hides published yet.",
      items: hides.slice(0, 4).map((item) => ({
        id: item._id,
        href: `/catalog/raw-leather/${item._id}`,
        image: item.images?.[0] ?? "/placeholder.svg?height=800&width=600",
        eyebrow: item.leatherType,
        title: item.name,
        facts: [
          { label: "Thickness", value: item.thickness },
          { label: "Finish", value: item.finish },
        ],
        chips: item.colors ?? [],
        price: { amount: item.pricePerSqFt, unit: "sq ft" },
      })),
    },
    {
      key: "products",
      title: "Featured Finished Products",
      href: "/catalog/finished-products",
      linkLabel: "View all products",
      empty: "No featured products published yet.",
      items: products.slice(0, 4).map((item) => ({
        id: item._id,
        href: `/catalog/finished-products/${item._id}`,
        image: item.images?.[0] ?? "/placeholder.svg?height=800&width=600",
        eyebrow: item.productType,
        title: item.name,
        facts: [
          { label: "Material", value: item.materialUsed },
          { label: "Availability", value: item.availability },
        ],
        chips: item.tags ?? [],
        price: { amount: item.pricePerUnit, unit: item.priceUnit },
      })),
    },
  ]

  return (
    <section className="section-padding">
      <div className="container-wide">
        <SectionHeading
          eyebrow="Featured Materials"
          title="Featured Leather Hides and Finished Products in Stock"
          lede="A live view of what buyers are specifying most this season, straight from the catalogue."
        />

        <div className="mt-14 space-y-16">
          {groups.map((group) => (
            <div key={group.key}>
              <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-4">
                <h3 className="font-serif text-xl font-medium text-foreground">{group.title}</h3>
                <Link
                  href={group.href}
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-brass-ink transition-colors hover:text-brass"
                >
                  {group.linkLabel}
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <MaterialSkeleton key={`${group.key}-skel-${index}`} />
                  ))}
                </div>
              ) : group.items.length ? (
                <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {group.items.map((item) => (
                    <StaggerItem key={item.id} className="h-full">
                      <MaterialCard {...item} />
                    </StaggerItem>
                  ))}
                </Stagger>
              ) : (
                <p className="border border-dashed border-border p-6 text-sm text-muted-foreground">
                  {group.empty}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Industries() {
  return (
    <section className="section-padding bg-bone">
      <div className="container-wide">
        <SectionHeading
          align="center"
          eyebrow="Industries"
          title="Industries We Supply — Footwear, Bags, Belts, Jackets, Furniture, Automotive"
          lede="Each industry we supply has its own substance, thickness, and grade requirements. Pick your sector to see the specifications we most commonly ship into it."
        />

        <Stagger className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-5">
          {INDUSTRIES.map((industry) => (
            <StaggerItem key={industry.name} className="h-full">
              <Link
                href="/industries"
                className="group flex h-full flex-col items-center border border-border bg-background p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-brass/50 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2"
              >
                <span className="flex h-14 w-14 items-center justify-center border border-border text-leather transition-colors duration-300 group-hover:border-brass group-hover:bg-brass/10 group-hover:text-brass-ink dark:text-tan">
                  <industry.icon size={26} strokeWidth={1.5} />
                </span>
                <h3 className="mt-4 font-serif text-lg font-medium text-foreground">{industry.name}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {industry.description}
                </p>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.3} className="mt-12 text-center">
          <Link href="/industries" className="btn-secondary">
            Explore Industry Solutions
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

/**
 * The connecting line draws itself as the section scrolls past, which makes the
 * five steps read as one sequence rather than five unrelated cards.
 */
function Process({ reduce }: { reduce: boolean }) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 75%", "end 65%"],
  })
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 28, mass: 0.4 })

  return (
    <section className="section-padding relative">
      <div className="container-wide">
        <SectionHeading
          eyebrow="How It Works"
          title="How to Source Leather from Pure Grain Exports — From Sample to Shipment"
          lede="Five steps, the same every time — so you always know where your order stands."
        />

        <div ref={sectionRef} className="relative mt-16">
          {/* Desktop: horizontal rail behind the step markers. Inset to 10% so
              it starts and ends at the centre of the first/last marker (five
              equal columns put those centres at 10% and 90%) rather than
              running off to the container edges. */}
          <div
            aria-hidden="true"
            className="absolute left-[10%] right-[10%] top-8 hidden h-px bg-border lg:block"
          >
            <motion.div
              className="h-full origin-left bg-brass"
              style={{ scaleX: reduce ? 1 : progress }}
            />
          </div>
          {/* Mobile: vertical rail down the left of the stacked steps. */}
          <div
            aria-hidden="true"
            className="absolute bottom-8 left-8 top-8 w-px bg-border md:hidden"
          >
            <motion.div
              className="h-full w-full origin-top bg-brass"
              style={{ scaleY: reduce ? 1 : progress }}
            />
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-5">
            {PROCESS_STEPS.map((step, index) => (
              <Reveal
                key={step.number}
                delay={index * 0.08}
                className="relative flex gap-5 md:block"
              >
                <span className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center border border-border bg-background font-serif text-2xl font-semibold text-leather transition-colors duration-300 dark:text-tan">
                  {step.number}
                </span>
                <div className="md:mt-6">
                  <h3 className="font-serif text-lg font-medium text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function GlobalReach() {
  const reduce = useReducedMotion()

  return (
    <section className="section-padding relative overflow-hidden bg-leather text-leather-foreground">
      <div aria-hidden="true" className="texture-grain absolute inset-0" />
      <div className="container-wide relative">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Global Export"
              title="Global Wholesale Leather Export — Markets We Ship To"
              onDark
              className="!max-w-none"
            />
            <Reveal delay={0.24}>
              <p className="mt-6 text-base leading-relaxed text-leather-foreground/70 md:text-lg">
                With established logistics networks across six continents, we deliver premium leather
                on schedule. Our export team handles documentation, customs and compliance so your
                production line is never waiting on paperwork.
              </p>
            </Reveal>

            <Stagger className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {GLOBAL_REGIONS.map((region) => (
                <StaggerItem key={region.name}>
                  <div className="border border-leather-foreground/10 p-4 transition-colors duration-300 hover:border-brass/45 hover:bg-leather-foreground/5">
                    <h4 className="font-serif text-base font-medium">{region.name}</h4>
                    <p className="mt-1 text-xs text-leather-foreground/65">{region.countries}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>

          <Reveal y={0} className="flex items-center justify-center">
            <div className="relative aspect-square w-full max-w-[22rem] lg:max-w-[26rem]">
              {/* Concentric rings, counter-rotating slowly. Purely atmospheric,
                  so it is disabled entirely under reduced-motion. */}
              {[0, 1, 2].map((ring) => (
                <motion.div
                  key={ring}
                  className="absolute rounded-full border border-leather-foreground/10"
                  style={{ inset: `${ring * 1.75}rem` }}
                  animate={reduce ? undefined : { rotate: ring % 2 === 0 ? 360 : -360 }}
                  transition={{ duration: 60 + ring * 20, repeat: Infinity, ease: "linear" }}
                >
                  <span
                    className="absolute h-2 w-2 rounded-full bg-brass"
                    style={{ top: "-4px", left: "50%" }}
                  />
                </motion.div>
              ))}

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-32 w-32 items-center justify-center rounded-full border border-brass/25 bg-brass/10 lg:h-36 lg:w-36">
                  <Globe size={48} className="text-brass" strokeWidth={1} />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function ClosingCta() {
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
              Looking for a Reliable Leather Supplier?
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
              Tell us what you are producing and we will send matching samples. From first swatch to
              bulk despatch, you deal with the same team throughout.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
              <Link href="/sample-request" className="btn-brass group">
                <FlaskConical size={16} className="mr-2" />
                Request Free Samples
              </Link>
              <Link href="/contact" className="btn-secondary">
                Contact Sales
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.32}>
            <p className="mt-6 text-xs text-muted-foreground">
              Samples despatched worldwide · No obligation · Typical reply within one business day
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
