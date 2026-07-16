"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Factory,
  Globe2,
  Grid3X3,
  LayoutGrid,
  LayoutList,
  Search,
  ShieldCheck,
} from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IRawLeather, IRawLeatherType } from "@/types/rawLeather"
import AddToSampleTrayButton from "@/components/sample-request/AddToSampleTrayButton"
import PriceDisplay from "@/components/PriceDisplay"
import "../catalog.css"

const FALLBACK_IMAGE = "/placeholder-image.jpg"

type LeatherCategory = {
  id: string
  label: string
}

const MATERIAL_TO_ANIMAL: Record<string, string> = {
  cowhide: "Cow",
  buffalo: "Buffalo",
  goat: "Goat",
  sheep: "Sheep",
}

function renderPrice(amount: number | undefined, unit: string | undefined) {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return "On request"
  }
  return (
    <>
      <PriceDisplay usdAmount={amount} />
      <span className="catalogFeatureCard__priceUnit"> / {unit || "sq ft"}</span>
    </>
  )
}

export default function RawLeatherPage() {
  const searchParams = useSearchParams()
  const activeType = searchParams.get("type") || "all"
  const initialSearch = searchParams.get("q") || ""
  const initialMaterial = (searchParams.get("material") || "").toLowerCase()

  const [categories, setCategories] = useState<LeatherCategory[]>([
    { id: "all", label: "All Leather" },
  ])
  const [products, setProducts] = useState<IRawLeather[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [selectedAnimal, setSelectedAnimal] = useState(MATERIAL_TO_ANIMAL[initialMaterial] || "all")
  const [selectedFinish, setSelectedFinish] = useState("all")
  const [sortBy, setSortBy] = useState("featured")
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(3)

  const resultsSectionRef = useRef<HTMLElement>(null)
  const prevFiltersRef = useRef({ activeType, selectedAnimal, selectedFinish, sortBy })

  // Scroll the results into view whenever a filter actually changes (type chip,
  // animal, finish, or sort) — regardless of where on the page the control lives —
  // instead of letting the page jump back to the top. Compares against the last
  // seen values (rather than an invocation-count flag) so this stays correct under
  // React Strict Mode's double-invoked mount effect in development, and never fires
  // on initial page load/navigation since nothing has changed yet at that point.
  useEffect(() => {
    const prev = prevFiltersRef.current
    const changed =
      prev.activeType !== activeType ||
      prev.selectedAnimal !== selectedAnimal ||
      prev.selectedFinish !== selectedFinish ||
      prev.sortBy !== sortBy
    prevFiltersRef.current = { activeType, selectedAnimal, selectedFinish, sortBy }
    if (changed) {
      resultsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [activeType, selectedAnimal, selectedFinish, sortBy])

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await fetch("/api/raw-leather-types")
        if (!res.ok) throw new Error("Failed to load leather hides types")

        const data = await res.json()
        const dynamicTypes = Array.isArray(data.data)
          ? data.data.map((type: IRawLeatherType) => ({
              id: type.name,
              label: type.name,
            }))
          : []

        setCategories([{ id: "all", label: "All Leather" }, ...dynamicTypes])
      } catch (err) {
        console.error("Error fetching leather hides types:", err)
        setCategories([{ id: "all", label: "All Leather" }])
      }
    }

    fetchTypes()
  }, [])

  useEffect(() => {
    const fetchRawLeather = async () => {
      setLoading(true)
      setError(null)

      try {
        const queryParams = new URLSearchParams()
        queryParams.append("page", "1")
        queryParams.append("limit", "100")

        if (activeType !== "all") {
          queryParams.append("leatherType", activeType)
        }

        if (searchTerm) {
          queryParams.append("search", searchTerm)
        }

        if (selectedAnimal !== "all") {
          queryParams.append("animal", selectedAnimal)
        }

        if (selectedFinish !== "all") {
          queryParams.append("finish", selectedFinish)
        }

        if (sortBy !== "featured") {
          const [backendSortBy, backendOrder] = (() => {
            switch (sortBy) {
              case "newest":
                return ["createdAt", "desc"]
              case "oldest":
                return ["createdAt", "asc"]
              case "price-low":
                return ["pricePerSqFt", "asc"]
              case "price-high":
                return ["pricePerSqFt", "desc"]
              case "name-asc":
                return ["name", "asc"]
              case "name-desc":
                return ["name", "desc"]
              default:
                return ["", ""]
            }
          })()

          if (backendSortBy) {
            queryParams.append("sortBy", backendSortBy)
            queryParams.append("order", backendOrder)
          }
        }

        const res = await fetch(`/api/raw-leather?${queryParams.toString()}`)
        if (!res.ok) throw new Error("Failed to load leather hides")

        const data = await res.json()
        setProducts(data.data || [])
      } catch (err: any) {
        setError(err.message || "Error loading leather hides")
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchRawLeather()
  }, [activeType, searchTerm, selectedAnimal, selectedFinish, sortBy])

  const productTags = useMemo(() => {
    return products.reduce<Record<string, string[]>>((acc, product) => {
      const baseTags = (product.colors || []).filter(Boolean)
      const fallbackTags = [product.animal, product.finish].filter(Boolean)
      const merged = baseTags.length > 0 ? baseTags : fallbackTags
      acc[product._id] = Array.from(new Set(merged)).slice(0, 3)
      return acc
    }, {})
  }, [products])

  return (
    <div className="catalogPage min-h-screen">
      <Header />
      <main>
        <section className="catalogHero leather-texture" aria-labelledby="rawLeatherHeroTitle">
          <div className="catalogContainer">
            <div className="catalogHero__frame">
              <span className="catalogEyebrow">Our Collection</span>
              <h1 id="rawLeatherHeroTitle">Premium Leather Hides</h1>
              <p className="catalogHero__sub">
                Explore our comprehensive range of premium leather hides — from traditional full grain to specialty finishes — prepared for production, sampling, and export-led sourcing.
              </p>
              <div className="catalogHero__trust" role="list">
                <span role="listitem"><ShieldCheck className="h-4 w-4" /> Premium grade selection</span>
                <span role="listitem"><Globe2 className="h-4 w-4" /> Export-ready supply</span>
                <span role="listitem"><Factory className="h-4 w-4" /> Stock and made-to-spec hides</span>
              </div>
            </div>
          </div>
        </section>

        <section className="catalogNavigator">
          <div className="catalogContainer">
            <div className="catalogNavigator__panel">
              <div className="catalogNavigator__main">
                <h2 className="catalogNavigator__title">Refine the leather hides view</h2>
                <p className="catalogNavigator__intro">
                  Filter by animal, finish, and sort order, or search by name, finish, or use case to compare similar hides quickly.
                </p>
                <div className="catalogListingFilters__row">
                  <div className="catalogField catalogField--wide">
                    <label htmlFor="raw-leather-search">Search</label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="raw-leather-search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search by name, animal, or finish"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="catalogField">
                    <label>Animal</label>
                    <Select value={selectedAnimal} onValueChange={setSelectedAnimal}>
                      <SelectTrigger>
                        <SelectValue placeholder="Animal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Animals</SelectItem>
                        <SelectItem value="Cow">Cowhide</SelectItem>
                        <SelectItem value="Buffalo">Buffalo</SelectItem>
                        <SelectItem value="Goat">Goat Leather</SelectItem>
                        <SelectItem value="Sheep">Sheepskin</SelectItem>
                        <SelectItem value="Exotic">Exotic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="catalogField">
                    <label>Finish</label>
                    <Select value={selectedFinish} onValueChange={setSelectedFinish}>
                      <SelectTrigger>
                        <SelectValue placeholder="Finish" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Finishes</SelectItem>
                        <SelectItem value="Aniline">Aniline</SelectItem>
                        <SelectItem value="Semi-Aniline">Semi-Aniline</SelectItem>
                        <SelectItem value="Pigmented">Pigmented</SelectItem>
                        <SelectItem value="Pull-up">Pull-Up</SelectItem>
                        <SelectItem value="Crazy Horse">Crazy Horse</SelectItem>
                        <SelectItem value="Waxed">Waxed</SelectItem>
                        <SelectItem value="Nappa">Nappa</SelectItem>
                        <SelectItem value="Embossed">Embossed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="catalogField">
                    <label>Sort by</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="featured">Featured First</SelectItem>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="name-asc">Name: A to Z</SelectItem>
                        <SelectItem value="name-desc">Name: Z to A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="catalogField">
                    <label>Layout</label>
                    <div className="catalogLayoutToggle" role="group" aria-label="Grid layout">
                      <button
                        type="button"
                        aria-label="Two columns"
                        aria-pressed={gridCols === 2}
                        onClick={() => setGridCols(2)}
                      >
                        <LayoutList className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Three columns"
                        aria-pressed={gridCols === 3}
                        onClick={() => setGridCols(3)}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Four columns"
                        aria-pressed={gridCols === 4}
                        onClick={() => setGridCols(4)}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="catalogNavigator__note" aria-label="Sourcing tips">
                <div>
                  <span className="catalogEyebrow">Sourcing Tip</span>
                  <p>
                    Use the chips below to jump between leather types, then refine with animal, finish, or sort to compare hides quickly.
                  </p>
                </div>
                <ul className="catalogMiniList">
                  <li><CheckCircle2 className="h-4 w-4" /> {loading ? "Loading" : `${products.length} hides visible`}</li>
                  <li><CheckCircle2 className="h-4 w-4" /> {Math.max(categories.length - 1, 0)} leather types available</li>
                  <li><CheckCircle2 className="h-4 w-4" /> Featured hides appear first by default</li>
                </ul>
              </aside>
            </div>
          </div>
        </section>

        <section className="catalogTypeStrip" aria-label="Leather types">
          <div className="catalogContainer">
            <div className="catalogTypeStrip__row">
              {categories.map((category) => {
                const isActive =
                  activeType === category.id || (activeType === "all" && category.id === "all")
                const href =
                  category.id === "all"
                    ? "/catalog/raw-leather"
                    : `/catalog/raw-leather?type=${encodeURIComponent(category.id)}`
                return (
                  <Link
                    key={category.id}
                    href={href}
                    scroll={false}
                    className={`catalogTypeChip${isActive ? " catalogTypeChip--active" : ""}`}
                  >
                    {category.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        <section ref={resultsSectionRef} className="catalogSection parchment-texture">
          <div className="catalogContainer">
            {error && <div className="catalogListingError">{error}</div>}

            {loading ? (
              <div className="catalogSkeletonGrid" aria-live="polite">
                {Array.from({ length: 6 }).map((_, index) => (
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
            ) : products.length === 0 ? (
              <div className="catalogEmptyState">
                <Boxes className="h-14 w-14" />
                <p className="mb-4">No leather hides match the current filters.</p>
                <Button className="catalogButton" asChild>
                  <Link href="/custom-manufacturing">
                    Request Custom Sourcing
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className={`catalogProductGrid catalogProductGrid--cols-${gridCols}`}>
                {products.map((product) => (
                  <article key={product._id} className="catalogFeatureCard">
                    <Link href={`/catalog/raw-leather/${product._id}`}>
                      <div className="catalogFeatureCard__media">
                        <img
                          src={product.images?.[0] || FALLBACK_IMAGE}
                          alt={product.name}
                        />
                      </div>
                      <div className="catalogFeatureCard__body">
                        <div className="catalogFeatureCard__top">
                          <span className="catalogFeatureCard__type">{product.leatherType}</span>
                          <span className="catalogLine" aria-hidden="true"></span>
                        </div>
                        <h3>{product.name}</h3>
                        <div className="catalogFeatureMeta">
                          <p><span>Animal:</span> {product.animal}</p>
                          <p><span>Finish:</span> {product.finish}</p>
                          <p><span>MOQ:</span> {product.minOrderQuantity} {product.priceUnit || "sq ft"}</p>
                        </div>
                        <p className="catalogFeatureCard__price">
                          <span>Price</span>
                          {renderPrice(product.pricePerSqFt, product.priceUnit || "sq ft")}
                        </p>
                        <div className="catalogChipRow">
                          {product.isFeatured && <span className="catalogChip catalogChip--gold">Featured</span>}
                          {product.sampleAvailable && <span className="catalogChip">Sample</span>}
                          {product.negotiable && <span className="catalogChip catalogChip--accent">Negotiable</span>}
                        </div>
                        <div className="catalogTagPills">
                          {(productTags[product._id] || []).map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                        {product.sampleAvailable && (
                          <div
                            className="mt-3"
                            onClick={(e) => {
                              // The whole card is wrapped in a <Link>; stop the
                              // click here so adding to the tray doesn't also
                              // navigate to the detail page.
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <AddToSampleTrayButton
                              stopPropagation
                              hide={{
                                productId: String(product._id),
                                productName: product.name,
                                hideType: product.animal,
                                grade: product.leatherType,
                                thickness: product.thickness,
                                finish: product.finish,
                                image: product.images?.[0],
                              }}
                              className="!px-4 !py-2 !text-xs"
                            />
                          </div>
                        )}
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
        </section>

        <section className="catalogSection parchment-mid-texture">
          <div className="catalogContainer">
            <div className="catalogCtaCard">
              <div className="catalogCtaCard__grid">
                <div>
                  <span className="catalogEyebrow">Need Custom Specs?</span>
                  <h2>Source the right hide for your production line</h2>
                  <p>
                    Our team can help you find or specify the right leather hide for thickness, finish, and tonnage based on your project scale and lead time.
                  </p>
                </div>
                <div className="catalogCtaCard__actions">
                  <Button className="catalogButton" asChild>
                    <Link href="/custom-manufacturing">
                      Request Custom Sourcing
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button className="catalogButtonOutline" variant="outline" asChild>
                    <Link href="/quote-request">
                      Request a Quote
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
