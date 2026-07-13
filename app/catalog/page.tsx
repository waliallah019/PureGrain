"use client"

/**
 * /catalog — landing & routing layer (refactored).
 *
 * This page is intentionally NOT an inventory page. It exists to:
 *   1. Establish credibility (Hero)
 *   2. Route the buyer to the correct path in one click (Buying Paths)
 *   3. Let material-led buyers self-identify (Material Quick Tiles)
 *   4. Prove inventory exists (Featured Inventory, split by type)
 *   5. Explain the actual sourcing flow per path (How Sourcing Works)
 *   6. Capture undecided buyers via a 4-field assisted-sales form
 *
 * Featured-inventory data comes from the same APIs used previously:
 *   GET /api/raw-leather?isFeatured=true&limit=8&page=1
 *   GET /api/finished-products?isFeatured=true&limit=8&page=1
 *
 * The form posts to /api/contact (the project's existing inquiry pattern)
 * with inquiryType="general_information" and safe defaults for the
 * fields that aren't asked here (companyName, industry) so we don't add
 * a new model/route just for this surface.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowDown,
  ArrowRight,
  Award,
  Boxes,
  CheckCircle2,
  FileCheck2,
  Layers,
  Loader2,
  LucideIcon,
  Package,
  Scissors,
} from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { countries } from "@/lib/config/shippingConfig"
import { IProduct } from "@/types/product"
import { IRawLeather } from "@/types/rawLeather"
import PriceDisplay from "@/components/PriceDisplay"
import "./catalog.css"

const FALLBACK_IMAGE = "/placeholder-image.jpg"
const INQUIRY_NOTES_MAX = 300

const trustBar = [
  "500,000+ Hides Exported",
  "30+ Countries Served",
  "LC & PayPal Accepted",
  "REACH Documentation Available",
] as const

// TODO: /raw-leather and /finished-products pages currently support
// ?type, ?material, ?q query params. They do NOT yet read ?grade,
// ?tanning, or ?category. The tile links below already use the spec'd
// URLs so that filtering will activate as soon as those listing pages
// are extended to honour the additional params.
type MaterialTile = {
  label: string
  href: string
  icon: LucideIcon
  service?: boolean
}

const materialTiles: MaterialTile[] = [
  { label: "Cowhide", href: "/catalog/raw-leather?type=cowhide", icon: Layers },
  { label: "Buffalo Hide", href: "/catalog/raw-leather?type=buffalo", icon: Layers },
  { label: "Goat Skin", href: "/catalog/raw-leather?type=goat", icon: Layers },
  { label: "Full-Grain Leather", href: "/catalog/raw-leather?grade=full-grain", icon: Award },
  { label: "Vegetable Tanned", href: "/catalog/raw-leather?tanning=vegetable", icon: Scissors },
  { label: "Finished Garments", href: "/catalog/finished-products?category=garments", icon: Package },
  { label: "Bags & Luggage", href: "/catalog/finished-products?category=bags", icon: Boxes },
  { label: "Custom Order", href: "/custom-manufacturing", icon: FileCheck2, service: true },
]

const sourcingPaths = [
  {
    label: "Leather Hides",
    accent: "gold" as const,
    steps: [
      "Browse available hides by type and grade",
      "Request sample hides — pay shipping only via PayPal",
      "Approve samples and request a formal quote",
      "We issue a proforma invoice",
      "Open an LC with your bank",
      "We ship FOB Karachi with full documentation",
    ],
  },
  {
    label: "Finished Products",
    accent: "tan" as const,
    steps: [
      "Browse finished leather goods by category",
      "Request a sample unit — pay shipping only",
      "Approve sample and confirm wholesale quantity",
      "We issue a proforma invoice",
      "Payment via LC or agreed trade terms",
      "Goods shipped with full export documentation",
    ],
  },
  {
    label: "Custom Manufacturing",
    accent: "neutral" as const,
    steps: [
      "Upload your design, tech pack, or reference images",
      "Share material spec, quantity, and delivery requirement",
      "We review and issue a detailed manufacturing quote",
      "You approve the quote and a pre-production sample",
      "Full production begins after approval",
      "Finished goods exported with full documentation",
    ],
  },
] as const

function renderPrice(amount: number | undefined, unit?: string) {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return "On request"
  }
  return (
    <>
      <PriceDisplay usdAmount={amount} />
      {unit ? <span className="catalogFeatureCard__priceUnit"> / {unit}</span> : null}
    </>
  )
}

type InquiryFormState = {
  fullName: string
  email: string
  country: string
  message: string
}

const INITIAL_INQUIRY: InquiryFormState = {
  fullName: "",
  email: "",
  country: "",
  message: "",
}

export default function CatalogPage() {
  const [featuredProducts, setFeaturedProducts] = useState<IProduct[]>([])
  const [featuredRawLeather, setFeaturedRawLeather] = useState<IRawLeather[]>([])
  const [loading, setLoading] = useState(true)
  // Featured sections are merchandising — surface load failures only in the
  // console; sections hide themselves when empty (per spec).
  const [, setError] = useState<string | null>(null)

  const [inquiry, setInquiry] = useState<InquiryFormState>(INITIAL_INQUIRY)
  const [inquirySubmitting, setInquirySubmitting] = useState(false)
  const [inquiryState, setInquiryState] = useState<"idle" | "success" | "error">("idle")
  const [inquiryMessage, setInquiryMessage] = useState("")

  useEffect(() => {
    const fetchFeaturedItems = async () => {
      setLoading(true)
      setError(null)

      try {
        const [productsRes, rawLeatherRes] = await Promise.all([
          fetch("/api/finished-products?isFeatured=true&limit=8&page=1"),
          fetch("/api/raw-leather?isFeatured=true&limit=8&page=1"),
        ])
        if (!productsRes.ok || !rawLeatherRes.ok) throw new Error("Failed to load featured items")

        const [productsData, rawLeatherData] = await Promise.all([
          productsRes.json(),
          rawLeatherRes.json(),
        ])

        setFeaturedProducts(productsData.data || [])
        setFeaturedRawLeather(rawLeatherData.data || [])
      } catch (err: any) {
        setError(err?.message || "Failed to load featured items")
        console.error("Error fetching featured items:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedItems()
  }, [])

  const handleScrollToPaths = () => {
    if (typeof window === "undefined") return
    const target = document.getElementById("buying-paths")
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const handleInquiryChange = (
    field: keyof InquiryFormState,
    value: string,
  ) => {
    setInquiry((prev) => ({ ...prev, [field]: value }))
    if (inquiryState !== "idle") {
      setInquiryState("idle")
      setInquiryMessage("")
    }
  }

  const handleInquirySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (inquirySubmitting) return

    setInquirySubmitting(true)
    setInquiryState("idle")
    setInquiryMessage("")

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: inquiry.fullName,
          // contactValidator requires companyName (>=2 chars) and industry
          // (>=1 char). The catalog inquiry form intentionally collects
          // only 4 fields, so we send safe defaults to satisfy validation
          // without adding a new schema or DB model.
          companyName: "Catalog Inquiry",
          email: inquiry.email,
          country: inquiry.country,
          industry: "Catalog Inquiry",
          inquiryType: "general_information",
          message: inquiry.message,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.success) {
        setInquiryState("error")
        setInquiryMessage(
          "Something went wrong. Please email us directly at trade@puregrainexports.com",
        )
        return
      }

      setInquiryState("success")
      setInquiryMessage("Thank you — we will be in touch within 48 hours.")
      setInquiry(INITIAL_INQUIRY)
    } catch {
      setInquiryState("error")
      setInquiryMessage(
        "Something went wrong. Please email us directly at trade@puregrainexports.com",
      )
    } finally {
      setInquirySubmitting(false)
    }
  }

  const showHides = !loading && featuredRawLeather.length > 0
  const showProducts = !loading && featuredProducts.length > 0

  return (
    <div className="catalogPage min-h-screen">
      <Header />
      <main>
        {/* ================================================================
            SECTION 1 — HERO
            Confidence-building only. No search input, no navigator.
        ================================================================ */}
        <section className="catalogHero leather-texture" aria-labelledby="catalogHeroTitle">
          <div className="catalogContainer">
            <div className="catalogHero__frame">
              <span className="catalogEyebrow">Pure Grain Exports · Lahore, Pakistan</span>
              <h1 id="catalogHeroTitle">
                Source Premium Leather from Pakistan — Direct to Your Production Line
              </h1>
              <p className="catalogHero__sub">
                Full-grain cowhide, buffalo hide, goat skin, and finished leather goods —
                exported to manufacturers in 30+ countries.
              </p>

              <div className="catalogTrustBar" role="list" aria-label="Pure Grain Exports highlights">
                {trustBar.map((item) => (
                  <span key={item} role="listitem">{item}</span>
                ))}
              </div>

              <div className="catalogHero__actions">
                <Button
                  type="button"
                  className="catalogButton"
                  onClick={handleScrollToPaths}
                >
                  Browse our catalog
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button className="catalogButtonOutline" variant="outline" asChild>
                  <Link href="/catalog/raw-leather">
                    Request a Sample
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 2 — THREE BUYING PATHS
        ================================================================ */}
        <section id="buying-paths" className="catalogSection parchment-texture">
          <div className="catalogContainer">
            <div className="catalogSectionHead">
              <span className="catalogEyebrow">Three Buying Paths</span>
              <h2>Pick the path that matches how you buy</h2>
              <div className="goldRule"></div>
              <p>
                Each path is built for a different type of buyer — hides at the source,
                ready-to-sell finished goods, or full custom manufacturing.
              </p>
            </div>

            <div className="catalogPathGrid">
              {/* Card 1 — Leather Hides */}
              <article className="catalogPathCard catalogPathCard--gold">
                <div className="catalogPathCard__head">
                  <span className="catalogPill catalogPill--gold">Most Popular</span>
                  <Layers className="catalogPathCard__icon" aria-hidden="true" />
                </div>
                <h3>Raw &amp; Crust Leather Hides</h3>
                <p className="catalogPathCard__who">
                  For tanneries, manufacturers, and traders buying leather at the hide level.
                </p>
                <ul className="catalogPathCard__list">
                  <li><CheckCircle2 className="h-4 w-4" /> Full-grain, top-grain, and genuine leather</li>
                  <li><CheckCircle2 className="h-4 w-4" /> Cowhide, buffalo hide, and goat skin</li>
                  <li><CheckCircle2 className="h-4 w-4" /> Wet-blue, crust, and fully finished available</li>
                </ul>
                <div className="catalogPathCard__spacer" />
                <p className="catalogProcessStrip">Browse → Sample → Quote → LC Order → FOB Karachi</p>
                <Button className="catalogButton w-full" asChild>
                  <Link href="/catalog/raw-leather">
                    Browse Leather Hides
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </article>

              {/* Card 2 — Finished Products */}
              <article className="catalogPathCard catalogPathCard--tan">
                <div className="catalogPathCard__head">
                  <span className="catalogPill catalogPill--tan">Finished Goods</span>
                  <Package className="catalogPathCard__icon" aria-hidden="true" />
                </div>
                <h3>Finished Leather Products</h3>
                <p className="catalogPathCard__who">
                  For importers, distributors, and brands sourcing ready-to-sell leather goods.
                </p>
                <ul className="catalogPathCard__list">
                  <li><CheckCircle2 className="h-4 w-4" /> Garments, bags, accessories, footwear components</li>
                  <li><CheckCircle2 className="h-4 w-4" /> Manufactured and finished in Pakistan</li>
                  <li><CheckCircle2 className="h-4 w-4" /> Custom color, finish, and size available</li>
                </ul>
                <div className="catalogPathCard__spacer" />
                <p className="catalogProcessStrip">Browse → Sample → Quote → Wholesale Order</p>
                <Button className="catalogButtonOutline w-full" variant="outline" asChild>
                  <Link href="/catalog/finished-products">
                    Browse Finished Products
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </article>

              {/* Card 3 — Custom Manufacturing (visually distinct: dashed) */}
              <article className="catalogPathCard catalogPathCard--service">
                <div className="catalogPathCard__head">
                  <span className="catalogPill catalogPill--service">Service</span>
                  <FileCheck2 className="catalogPathCard__icon" aria-hidden="true" />
                </div>
                <h3>Custom Manufacturing</h3>
                <p className="catalogPathCard__who">
                  For brands and OEMs needing leather goods manufactured to their exact specification.
                </p>
                <ul className="catalogPathCard__list">
                  <li><CheckCircle2 className="h-4 w-4" /> Upload your design, tech pack, or reference images</li>
                  <li><CheckCircle2 className="h-4 w-4" /> We manufacture to your material and quantity spec</li>
                  <li><CheckCircle2 className="h-4 w-4" /> Full export documentation and LC trade terms</li>
                </ul>
                <div className="catalogPathCard__spacer" />
                <p className="catalogProcessStrip">Upload Design → Quote → Approve → Manufacture → Export</p>
                <Button className="catalogPathCard__cta w-full" variant="outline" asChild>
                  <Link href="/custom-manufacturing">
                    Submit a Manufacturing Request
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <p className="catalogPathCard__note">
                  This path leads to a service request form, not a product browse page.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 3 — MATERIAL QUICK-FILTER TILES
            Static Next.js Links — no API calls on mount.
        ================================================================ */}
        <section className="catalogSection parchment-mid-texture">
          <div className="catalogContainer">
            <div className="catalogSectionHead">
              <span className="catalogEyebrow">Quick Access</span>
              <h2>Find by Material or Category</h2>
              <div className="goldRule"></div>
              <p>Know what you need? Jump directly to it.</p>
            </div>

            <div className="catalogTileGrid">
              {materialTiles.map((tile) => {
                const Icon = tile.icon
                return (
                  <Link
                    key={tile.label}
                    href={tile.href}
                    className={`catalogTile${tile.service ? " catalogTile--service" : ""}`}
                  >
                    <Icon className="catalogTile__icon" aria-hidden="true" />
                    <span className="catalogTile__label">{tile.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 4 — FEATURED INVENTORY (split by type)
        ================================================================ */}
        <section className="catalogSection parchment-texture">
          <div className="catalogContainer">

            {/* --- Featured Leather Hides --- */}
            {(loading || showHides) && (
              <div className="catalogFeatureBlock">
                <div className="catalogFeatureBlock__head">
                  <div>
                    <span className="catalogEyebrow">Featured Leather Hides</span>
                    <h2>A selection of our current available hides</h2>
                  </div>
                  <Link href="/catalog/raw-leather" className="catalogFeatureBlock__viewAll">
                    View all <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {loading ? (
                  <FeaturedSkeleton />
                ) : (
                  <div className="catalogProductGrid catalogProductGrid--cols-4">
                    {featuredRawLeather.slice(0, 4).map((item) => (
                      <article key={item._id} className="catalogFeatureCard">
                        <Link href={`/catalog/raw-leather/${item._id}`}>
                          <div className="catalogFeatureCard__media">
                            <img src={item.images?.[0] || FALLBACK_IMAGE} alt={item.name} />
                          </div>
                          <div className="catalogFeatureCard__body">
                            <div className="catalogFeatureCard__top">
                              <span className="catalogFeatureCard__type">{item.leatherType || "Leather Hide"}</span>
                              <span className="catalogLine" aria-hidden="true"></span>
                            </div>
                            <h3>{item.name}</h3>
                            <div className="catalogFeatureMeta">
                              <p><span>Animal:</span> {item.animal}</p>
                              <p><span>Finish:</span> {item.finish}</p>
                              <p><span>MOQ:</span> {item.minOrderQuantity} {item.priceUnit || "sq ft"}</p>
                            </div>
                            <p className="catalogFeatureCard__price">
                              <span>Price</span>
                              {renderPrice(item.pricePerSqFt, item.priceUnit || "sq ft")}
                            </p>
                            <div className="catalogChipRow">
                              {item.isFeatured && <span className="catalogChip catalogChip--gold">Featured</span>}
                              {item.sampleAvailable && <span className="catalogChip">Sample</span>}
                              {item.negotiable && <span className="catalogChip catalogChip--accent">Negotiable</span>}
                            </div>
                            <span className="catalogFeatureCard__link">
                              View Details
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* --- Featured Finished Products --- */}
            {(loading || showProducts) && (
              <div className="catalogFeatureBlock catalogFeatureBlock--divided">
                <div className="catalogFeatureBlock__head">
                  <div>
                    <span className="catalogEyebrow">Featured Finished Products</span>
                    <h2>Ready-to-order leather goods from our range</h2>
                  </div>
                  <Link href="/catalog/finished-products" className="catalogFeatureBlock__viewAll">
                    View all <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {loading ? (
                  <FeaturedSkeleton />
                ) : (
                  <div className="catalogProductGrid catalogProductGrid--cols-4">
                    {featuredProducts.slice(0, 4).map((product) => (
                      <article key={product._id} className="catalogFeatureCard">
                        <Link href={`/catalog/finished-products/${product._id}`}>
                          <div className="catalogFeatureCard__media">
                            <img src={product.images?.[0] || FALLBACK_IMAGE} alt={product.name} />
                          </div>
                          <div className="catalogFeatureCard__body">
                            <div className="catalogFeatureCard__top">
                              <span className="catalogFeatureCard__type">{product.productType}</span>
                              <span className="catalogLine" aria-hidden="true"></span>
                            </div>
                            <h3>{product.name}</h3>
                            <div className="catalogFeatureMeta">
                              <p><span>Material:</span> {product.materialUsed}</p>
                              <p><span>Type:</span> {product.productType}</p>
                              <p><span>MOQ:</span> {product.moq} units</p>
                            </div>
                            <p className="catalogFeatureCard__price">
                              <span>Price</span>
                              {renderPrice(product.pricePerUnit, product.priceUnit)}
                            </p>
                            <div className="catalogChipRow">
                              {product.isFeatured && <span className="catalogChip catalogChip--gold">Featured</span>}
                              {product.sampleAvailable && <span className="catalogChip">Sample</span>}
                              {product.availability && <span className="catalogChip catalogChip--accent">{product.availability}</span>}
                            </div>
                            <span className="catalogFeatureCard__link">
                              View Details
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ================================================================
            SECTION 5 — HOW SOURCING WORKS
        ================================================================ */}
        <section className="catalogSection parchment-mid-texture">
          <div className="catalogContainer">
            <div className="catalogSectionHead">
              <span className="catalogEyebrow">Process</span>
              <h2>How Sourcing Works</h2>
              <div className="goldRule"></div>
              <p>
                Three buying paths. Each designed for a different type of buyer.
                Here is exactly how each one works.
              </p>
            </div>

            <div className="catalogSourcingGrid">
              {sourcingPaths.map((path) => (
                <div key={path.label} className={`catalogSourcingColumn catalogSourcingColumn--${path.accent}`}>
                  <h3 className="catalogSourcingColumn__title">{path.label}</h3>
                  <ol className="catalogSourcingColumn__steps">
                    {path.steps.map((step, i) => (
                      <li key={step} className="catalogSourcingStep">
                        <span className="catalogSourcingStep__num">{i + 1}</span>
                        <span className="catalogSourcingStep__text">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 6 — ASSISTED SALES CTA (4-field inline form)
        ================================================================ */}
        <section className="catalogSection parchment-texture">
          <div className="catalogContainer">
            <div className="catalogInquiry">
              <div className="catalogInquiry__head">
                <span className="catalogEyebrow">Need Guidance?</span>
                <h2>Not Sure Where to Start?</h2>
                <div className="goldRule" style={{ marginLeft: 0 }}></div>
                <p>
                  Tell us what you need and our trade team will respond within 48 hours
                  with product options, pricing, and sample availability.
                </p>
              </div>

              <form className="catalogInquiry__form" onSubmit={handleInquirySubmit} noValidate>
                <div className="catalogInquiry__row">
                  <label className="catalogInquiry__field">
                    <span>Full name</span>
                    <Input
                      required
                      type="text"
                      value={inquiry.fullName}
                      onChange={(e) => handleInquiryChange("fullName", e.target.value)}
                      placeholder="Your full name"
                      disabled={inquirySubmitting}
                    />
                  </label>
                  <label className="catalogInquiry__field">
                    <span>Business email</span>
                    <Input
                      required
                      type="email"
                      value={inquiry.email}
                      onChange={(e) => handleInquiryChange("email", e.target.value)}
                      placeholder="you@yourcompany.com"
                      disabled={inquirySubmitting}
                    />
                  </label>
                </div>

                <div className="catalogInquiry__row">
                  <label className="catalogInquiry__field">
                    <span>Country</span>
                    <Select
                      value={inquiry.country}
                      onValueChange={(v) => handleInquiryChange("country", v)}
                      disabled={inquirySubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                </div>

                <label className="catalogInquiry__field catalogInquiry__field--full">
                  <span>What are you looking for?</span>
                  <Textarea
                    required
                    rows={4}
                    maxLength={INQUIRY_NOTES_MAX}
                    value={inquiry.message}
                    onChange={(e) => handleInquiryChange("message", e.target.value)}
                    placeholder="E.g. Full-grain cowhide, 1.5mm, chrome tanned, minimum 500 hides per month for footwear production"
                    disabled={inquirySubmitting}
                  />
                  <span className="catalogInquiry__count">
                    {inquiry.message.length}/{INQUIRY_NOTES_MAX}
                  </span>
                </label>

                <div className="catalogInquiry__actions">
                  <Button
                    type="submit"
                    className="catalogButton catalogInquiry__submit"
                    disabled={inquirySubmitting}
                  >
                    {inquirySubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        Send us your requirement
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>

                {inquiryState !== "idle" && inquiryMessage && (
                  <p
                    role="status"
                    className={`catalogInquiry__feedback catalogInquiry__feedback--${inquiryState}`}
                  >
                    {inquiryMessage}
                  </p>
                )}
              </form>

              <div className="catalogInquiry__alt">
                <p>
                  Prefer email?{" "}
                  <a href="mailto:trade@puregrainexports.com">trade@puregrainexports.com</a>
                </p>
                <p>
                  WhatsApp:{" "}
                  <a
                    href="https://wa.me/923245243670"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    +92 324 5243670
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

/**
 * Local skeleton for the featured-inventory subsections — matches the
 * existing .catalogSkeletonCard pattern used by the listing pages so the
 * loading state is consistent across the catalog surface.
 */
function FeaturedSkeleton() {
  return (
    <div className="catalogProductGrid catalogProductGrid--cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="catalogSkeletonCard">
          <div className="catalogSkeletonCard__media" />
          <div className="catalogSkeletonCard__body">
            <div className="catalogSkeletonCard__line catalogSkeletonCard__line--short" />
            <div className="catalogSkeletonCard__line catalogSkeletonCard__line--long" />
            <div className="catalogSkeletonCard__line catalogSkeletonCard__line--medium" />
            <div className="catalogSkeletonCard__line catalogSkeletonCard__line--medium" />
          </div>
        </div>
      ))}
    </div>
  )
}
