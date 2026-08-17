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
  Quote,
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
  CountUp,
  Reveal,
  SectionHeading,
  Stagger,
  StaggerItem,
} from "@/components/landing/primitives"
import type { IRawLeather, IRawLeatherType } from "@/types/rawLeather"
import type { IProduct } from "@/types/product"

/* -------------------------------------------------------------------------- */
/* Static content                                                             */
/* -------------------------------------------------------------------------- */

const HERO_SLIDES: HeroSlide[] = [
  {
    image: "/hero-leather-warm.jpg",
    imageAlt: "Full-grain leather hide with a warm natural finish",
    label: "Premium B2B Leather Supply",
    headline: "Premium Leather for Serious Manufacturers",
    description:
      "Source exceptional quality leather at scale. From full grain to custom finishes, we supply discerning brands with materials that define craftsmanship.",
    primaryCta: { label: "Explore Collection", href: "/catalog" },
    secondaryCta: { label: "Request Free Samples", href: "/sample-request" },
  },
  {
    image: "/hero-leather-tan.jpg",
    imageAlt: "Stacked tan leather hides showing consistent colour across a batch",
    label: "Artisan Craftsmanship",
    headline: "Exceptional Finishes, Unmatched Quality",
    description:
      "Vegetable-tanned, aniline-dyed and custom finishes, crafted for furniture, fashion and automotive applications — matched to your specification.",
    primaryCta: { label: "View Finishes", href: "/catalog/raw-leather" },
    secondaryCta: { label: "Contact Sales", href: "/contact" },
  },
  {
    image: "/hero-leather-espresso.jpg",
    imageAlt: "Dark espresso leather hide with a fine natural grain",
    label: "Global Leather Partner",
    headline: "Trusted by Manufacturers Worldwide",
    description:
      "25+ years of expertise and exports to 40+ countries. We deliver consistent quality leather that powers leading brands across industries.",
    primaryCta: { label: "Browse Catalog", href: "/catalog" },
    secondaryCta: { label: "Get a Quote", href: "/quote-request" },
  },
]

/**
 * Trust strip. `value` drives the count-up; credentials that aren't numbers
 * (ISO 9001) pass `display` instead and render statically — animating a
 * certification number would read as decorative rather than factual.
 */
const TRUST_STATS: Array<{
  value?: number
  suffix?: string
  display?: string
  label: string
  detail: string
}> = [
  { value: 25, suffix: "+", label: "Years Exporting", detail: "Continuous operation since 1999" },
  { value: 40, suffix: "+", label: "Countries Served", detail: "Across six continents" },
  { display: "ISO 9001", label: "Quality Certified", detail: "Audited quality management" },
  { value: 500, suffix: "K+", label: "Sq. Ft. Monthly", detail: "Sustained supply capacity" },
]

/**
 * The two ways a buyer can work with Pure Grain. This mirrors the real split in
 * the catalogue and the navigation ("Leather Hides" vs "Finished Products") and
 * matches the language used on the About page, so a first-time visitor can
 * self-select instead of guessing which half of the business they need.
 */
const SUPPLY_PATHS = [
  {
    eyebrow: "Bulk Material",
    title: "Leather Hides",
    description:
      "Full hides and sides supplied by the square foot for manufacturers running their own production. Specify thickness, finish and colour; we match it batch to batch.",
    points: ["Sold per sq ft", "Custom thickness & finish", "Consistent across large orders"],
    href: "/catalog/raw-leather",
    cta: "Browse Leather Hides",
    icon: Layers,
    image: "/hero-leather-tan.jpg",
    imageAlt: "Rolled and stacked leather hides ready for bulk despatch",
  },
  {
    eyebrow: "Wholesale Goods",
    title: "Finished Products",
    description:
      "Ready-made leather goods produced to wholesale order — bags, jackets, belts and accessories — manufactured in our partner units and shipped under your labelling.",
    points: ["Wholesale MOQ", "White-label ready", "Made to your specification"],
    href: "/catalog/finished-products",
    cta: "Browse Finished Products",
    icon: Scissors,
    image: "/hero-leather-espresso.jpg",
    imageAlt: "Finished leather goods showing stitching and edge detail",
  },
]

const WHY_CHOOSE_US = [
  {
    icon: Shield,
    title: "Consistent Quality at Scale",
    description:
      "Every batch meets exacting standards. Rigorous quality control ensures uniformity across large orders.",
  },
  {
    icon: Layers,
    title: "Custom Finishes & Thickness",
    description:
      "From embossing to specialised treatments, we tailor leather specifications to your exact requirements.",
  },
  {
    icon: CheckCircle2,
    title: "Ethical Sourcing",
    description:
      "Traceable supply chains with responsible tanning practices. Certified sustainable leather options available.",
  },
  {
    icon: Users,
    title: "Long-term Partnership Mindset",
    description:
      "We invest in relationships, not transactions. Dedicated account managers for consistent service.",
  },
  {
    icon: Truck,
    title: "Reliable Global Shipping",
    description:
      "Established logistics networks for timely delivery. Export documentation and customs expertise included.",
  },
  {
    icon: Globe2,
    title: "Industry Expertise",
    description:
      "Deep knowledge of footwear, furniture, automotive and fashion applications. We understand your needs.",
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

const TESTIMONIALS = [
  {
    quote:
      "PureGrain has been our primary leather supplier for over 8 years. Their consistency in quality across large orders is unmatched.",
    author: "Marco Bianchi",
    role: "Procurement Director",
    company: "Bellissimo Calzature",
    country: "Italy",
  },
  {
    quote:
      "The custom finishing options allowed us to create a signature leather for our furniture line that sets us apart in the market.",
    author: "Sarah Thompson",
    role: "Head of Materials",
    company: "Heritage Furnishings",
    country: "United Kingdom",
  },
  {
    quote:
      "From sample to bulk delivery, the process is seamless. Their automotive-grade leather meets our stringent quality requirements.",
    author: "Hans Weber",
    role: "Supply Chain Manager",
    company: "Precision Auto Interiors",
    country: "Germany",
  },
]

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
        const [typesRes, rawLeatherRes, featuredRawRes, featuredProductsRes] = await Promise.all([
          fetch("/api/raw-leather-types"),
          fetch("/api/raw-leather?limit=100&sortBy=createdAt&order=desc"),
          fetch("/api/raw-leather?isFeatured=true&limit=4&sortBy=createdAt&order=desc"),
          fetch("/api/finished-products?isFeatured=true&limit=4&sortBy=createdAt&order=desc"),
        ])

        if (!typesRes.ok || !rawLeatherRes.ok || !featuredRawRes.ok || !featuredProductsRes.ok) {
          throw new Error("Failed to load homepage data")
        }

        const [typesData, rawLeatherData, featuredRawData, featuredProductsData] = await Promise.all([
          typesRes.json(),
          rawLeatherRes.json(),
          featuredRawRes.json(),
          featuredProductsRes.json(),
        ])

        if (!isActive) return

        setRawLeatherTypes(Array.isArray(typesData.data) ? typesData.data : [])
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
      <Testimonials />
      <ClosingCta />

      <Footer />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Sections                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Numbers animate on arrival so they read as measured facts rather than
 * decoration, and each carries a one-line qualifier — an unexplained "500K+" is
 * a claim, "500K+ sq ft monthly, sustained supply capacity" is information.
 */
function TrustStrip() {
  return (
    <section className="border-y border-border bg-bone">
      <div className="container-wide py-12 lg:py-14">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4 lg:gap-4">
          {TRUST_STATS.map((stat, index) => (
            <Reveal
              key={stat.label}
              delay={index * 0.08}
              className="relative text-center lg:px-4 lg:text-left"
            >
              {/* Hairline separators between columns on desktop only. */}
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute -left-2 top-1 hidden h-[calc(100%-0.5rem)] w-px bg-border lg:block"
                />
              ) : null}
              <p className="font-serif text-4xl font-semibold text-leather dark:text-tan md:text-5xl">
                {stat.display ?? (
                  <CountUp value={stat.value ?? 0} suffix={stat.suffix ?? ""} />
                )}
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">{stat.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{stat.detail}</p>
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
          title="Two ways to work with us"
          lede="Pure Grain supplies bulk leather to manufacturers and wholesale finished goods to brands and distributors. Start with whichever fits your production."
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
            title="Leather Categories"
            lede="From traditional tanning to modern finishes, explore the full range of premium leather we hold."
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
          title="Built for Serious Buyers"
          lede="We understand B2B leather procurement. Our processes are designed for manufacturers who demand consistency, reliability and expertise."
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
          title="Popular Selections"
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
          title="Trusted Across Sectors"
          lede="We supply leading manufacturers across multiple industries, and we understand the specific demands of each application."
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
          title="From Inquiry to Delivery"
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
              title="Delivering Excellence Worldwide"
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

function Testimonials() {
  return (
    <section className="section-padding">
      <div className="container-wide">
        <SectionHeading
          align="center"
          eyebrow="Client Testimonials"
          title="Trusted by Leading Manufacturers"
        />

        <Stagger className="mt-14 grid gap-6 md:grid-cols-3 lg:gap-8">
          {TESTIMONIALS.map((testimonial) => (
            <StaggerItem key={testimonial.author} className="h-full">
              <figure className="flex h-full flex-col border border-border bg-bone p-7 transition-all duration-300 hover:border-brass/40 hover:shadow-card-hover lg:p-8">
                <Quote size={30} className="text-brass/35" strokeWidth={1} />
                <blockquote className="mt-5 flex-1 leading-relaxed text-foreground">
                  {testimonial.quote}
                </blockquote>
                <figcaption className="mt-7 border-t border-border pt-5">
                  <p className="font-serif text-base font-medium text-foreground">
                    {testimonial.author}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{testimonial.role}</p>
                  <p className="mt-1 text-sm font-medium text-brass-ink">
                    {testimonial.company}, {testimonial.country}
                  </p>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
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
