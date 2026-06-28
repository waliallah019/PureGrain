"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowRight,
  CheckCircle2,
  Factory,
  Globe2,
  Grid3X3,
  LayoutGrid,
  LayoutList,
  Package,
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
import { IProduct, IProductType } from "@/types/product"
import "../catalog.css"

const FALLBACK_IMAGE = "/placeholder-image.jpg"

type ProductCategory = {
  id: string
  label: string
}

function formatStoredPrice(amount: number | undefined, currency: string | undefined, unit: string | undefined) {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return "On request"
  }
  return `${currency || "USD"} ${amount.toFixed(2)} / ${unit || "unit"}`
}

export default function FinishedProductsPage() {
  const searchParams = useSearchParams()
  const activeType = searchParams.get("type") || "all"
  const initialSearch = searchParams.get("q") || ""
  const initialMaterial = searchParams.get("material") || ""

  const [categories, setCategories] = useState<ProductCategory[]>([
    { id: "all", label: "All Products" },
  ])
  const [products, setProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [selectedMaterial, setSelectedMaterial] = useState(initialMaterial || "all")
  const [selectedAvailability, setSelectedAvailability] = useState("all")
  const [sortBy, setSortBy] = useState("featured")
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(3)

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await fetch("/api/product-types")
        if (!res.ok) throw new Error("Failed to load product types")

        const data = await res.json()
        const dynamicTypes = Array.isArray(data.data)
          ? data.data.map((type: IProductType) => ({
              id: type.name,
              label: type.name,
            }))
          : []

        setCategories([{ id: "all", label: "All Products" }, ...dynamicTypes])
      } catch (err) {
        console.error("Error fetching product types:", err)
        setCategories([{ id: "all", label: "All Products" }])
      }
    }

    fetchTypes()
  }, [])

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError(null)

      try {
        const queryParams = new URLSearchParams()
        queryParams.append("page", "1")
        queryParams.append("limit", "100")

        if (activeType !== "all") {
          queryParams.append("productType", activeType)
        }

        if (searchTerm) {
          queryParams.append("search", searchTerm)
        }

        if (selectedMaterial !== "all") {
          queryParams.append("material", selectedMaterial)
        }

        if (selectedAvailability !== "all") {
          queryParams.append("availability", selectedAvailability)
        }

        if (sortBy !== "featured") {
          const [backendSortBy, backendOrder] = (() => {
            switch (sortBy) {
              case "newest":
                return ["createdAt", "desc"]
              case "oldest":
                return ["createdAt", "asc"]
              case "price-low":
                return ["pricePerUnit", "asc"]
              case "price-high":
                return ["pricePerUnit", "desc"]
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

        const res = await fetch(`/api/finished-products?${queryParams.toString()}`)
        if (!res.ok) throw new Error("Failed to load products")

        const data = await res.json()
        setProducts(data.data || [])
      } catch (err: any) {
        setError(err.message || "Error loading products")
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [activeType, searchTerm, selectedMaterial, selectedAvailability, sortBy])

  const productTags = useMemo(() => {
    return products.reduce<Record<string, string[]>>((acc, product) => {
      const baseTags = (product.tags || []).filter(Boolean)
      const fallbackTags = (product.colorVariants || []).filter(Boolean)
      const merged = baseTags.length > 0 ? baseTags : fallbackTags
      acc[product._id] = Array.from(new Set(merged)).slice(0, 3)
      return acc
    }, {})
  }, [products])

  return (
    <div className="catalogPage min-h-screen">
      <Header />
      <main>
        <section className="catalogHero leather-texture" aria-labelledby="finishedHeroTitle">
          <div className="catalogContainer">
            <div className="catalogHero__frame">
              <span className="catalogEyebrow">Our Collection</span>
              <h1 id="finishedHeroTitle">Finished Leather Products</h1>
              <p className="catalogHero__sub">
                Premium leather goods crafted for performance, durability, and refined aesthetics — curated for wholesale buyers, distributors, and private label partners.
              </p>
              <div className="catalogHero__trust" role="list">
                <span role="listitem"><ShieldCheck className="h-4 w-4" /> Wholesale-ready inventory</span>
                <span role="listitem"><Globe2 className="h-4 w-4" /> Export-grade documentation</span>
                <span role="listitem"><Factory className="h-4 w-4" /> Private label and OEM support</span>
              </div>
            </div>
          </div>
        </section>

        <section className="catalogNavigator">
          <div className="catalogContainer">
            <div className="catalogNavigator__panel">
              <div className="catalogNavigator__main">
                <h2 className="catalogNavigator__title">Refine the finished products view</h2>
                <p className="catalogNavigator__intro">
                  Filter by material, availability, and sort order, or search by name, finish, and use case to compare similar items quickly.
                </p>
                <div className="catalogListingFilters__row">
                  <div className="catalogField catalogField--wide">
                    <label htmlFor="finished-search">Search</label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="finished-search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search by name, material, or finish"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="catalogField">
                    <label>Material</label>
                    <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                      <SelectTrigger>
                        <SelectValue placeholder="Material" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Materials</SelectItem>
                        <SelectItem value="cowhide">Cowhide</SelectItem>
                        <SelectItem value="buffalo">Buffalo</SelectItem>
                        <SelectItem value="goat">Goat Leather</SelectItem>
                        <SelectItem value="sheep">Sheepskin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="catalogField">
                    <label>Availability</label>
                    <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
                      <SelectTrigger>
                        <SelectValue placeholder="Availability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Availability</SelectItem>
                        <SelectItem value="In Stock">In Stock</SelectItem>
                        <SelectItem value="Made to Order">Made to Order</SelectItem>
                        <SelectItem value="Limited Stock">Limited Stock</SelectItem>
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
                    Use the chips below to jump between product types, then refine with availability or sort to compare similar items quickly.
                  </p>
                </div>
                <ul className="catalogMiniList">
                  <li><CheckCircle2 className="h-4 w-4" /> {loading ? "Loading" : `${products.length} products visible`}</li>
                  <li><CheckCircle2 className="h-4 w-4" /> {Math.max(categories.length - 1, 0)} categories available</li>
                  <li><CheckCircle2 className="h-4 w-4" /> Featured items appear first by default</li>
                </ul>
              </aside>
            </div>
          </div>
        </section>

        <section className="catalogTypeStrip" aria-label="Product types">
          <div className="catalogContainer">
            <div className="catalogTypeStrip__row">
              {categories.map((category) => {
                const isActive =
                  activeType === category.id || (activeType === "all" && category.id === "all")
                const href =
                  category.id === "all"
                    ? "/catalog/finished-products"
                    : `/catalog/finished-products?type=${encodeURIComponent(category.id)}`
                return (
                  <Link
                    key={category.id}
                    href={href}
                    className={`catalogTypeChip${isActive ? " catalogTypeChip--active" : ""}`}
                  >
                    {category.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        <section className="catalogSection parchment-texture">
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
                <Package className="h-14 w-14" />
                <p className="mb-4">No products match the current filters.</p>
                <Button className="catalogButton" asChild>
                  <Link href="/custom-manufacturing">
                    Request Custom Manufacturing
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className={`catalogProductGrid catalogProductGrid--cols-${gridCols}`}>
                {products.map((product) => (
                  <article key={product._id} className="catalogFeatureCard">
                    <Link href={`/catalog/finished-products/${product._id}`}>
                      <div className="catalogFeatureCard__media">
                        <img
                          src={product.images?.[0] || FALLBACK_IMAGE}
                          alt={product.name}
                        />
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
                          <p><span>Price:</span> {formatStoredPrice(product.pricePerUnit, product.currency, product.priceUnit)}</p>
                        </div>
                        <div className="catalogChipRow">
                          {product.isFeatured && <span className="catalogChip catalogChip--gold">Featured</span>}
                          {product.sampleAvailable && <span className="catalogChip">Sample</span>}
                          {product.availability && <span className="catalogChip catalogChip--accent">{product.availability}</span>}
                        </div>
                        <div className="catalogTagPills">
                          {(productTags[product._id] || []).slice(0, 2).map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
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
        </section>

        <section className="catalogSection parchment-mid-texture">
          <div className="catalogContainer">
            <div className="catalogCtaCard">
              <div className="catalogCtaCard__grid">
                <div>
                  <span className="catalogEyebrow">Need Custom?</span>
                  <h2>Move from finished products into your own private label</h2>
                  <p>
                    Our team can help you design and build premium leather goods tailored to your brand, packaging, and target market.
                  </p>
                </div>
                <div className="catalogCtaCard__actions">
                  <Button className="catalogButton" asChild>
                    <Link href="/custom-manufacturing">
                      Request Custom Manufacturing
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
