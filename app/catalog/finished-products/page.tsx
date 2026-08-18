"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
import { getPageItems } from "@/lib/utils/pagination"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IProduct, IProductType } from "@/types/product"
import PriceDisplay from "@/components/PriceDisplay"
import "../catalog.css"
import { JsonLd, jsonLdGraph, breadcrumbSchema } from "@/lib/schema"
import { getProductTypes } from "@/lib/taxonomy"

const FALLBACK_IMAGE = "/placeholder-image.jpg"

type ProductCategory = {
  id: string
  label: string
}

function renderPrice(amount: number | undefined, unit: string | undefined) {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return "On request"
  }
  return (
    <>
      <PriceDisplay usdAmount={amount} />
      <span className="catalogFeatureCard__priceUnit"> / {unit || "unit"}</span>
    </>
  )
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
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)

  // 12 divides evenly into the 2-, 3- and 4-column grid options.
  const PAGE_SIZE = 12

  const resultsSectionRef = useRef<HTMLElement>(null)
  const prevFiltersRef = useRef({ activeType, selectedMaterial, selectedAvailability, sortBy })

  // Scroll the results into view whenever a filter actually changes (type chip,
  // material, availability, or sort) — regardless of where on the page the control
  // lives — instead of letting the page jump back to the top. Compares against the
  // last seen values (rather than an invocation-count flag) so this stays correct
  // under React Strict Mode's double-invoked mount effect in development, and never
  // fires on initial page load/navigation since nothing has changed yet at that point.
  useEffect(() => {
    const prev = prevFiltersRef.current
    const changed =
      prev.activeType !== activeType ||
      prev.selectedMaterial !== selectedMaterial ||
      prev.selectedAvailability !== selectedAvailability ||
      prev.sortBy !== sortBy
    prevFiltersRef.current = { activeType, selectedMaterial, selectedAvailability, sortBy }
    if (changed) {
      // A changed filter invalidates the current page — otherwise you could sit
      // on page 5 of a result set that now only has 2 pages and see nothing.
      setPage(1)
      resultsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [activeType, selectedMaterial, selectedAvailability, sortBy])

  // Searching also changes the result set, so it must reset the page too.
  useEffect(() => {
    setPage(1)
  }, [searchTerm])

  // Bring the grid back into view when paging, so clicking "Next" at the bottom
  // of the list doesn't leave the user staring at the footer.
  const isFirstPageRender = useRef(true)
  useEffect(() => {
    if (isFirstPageRender.current) {
      isFirstPageRender.current = false
      return
    }
    resultsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [page])

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const items = await getProductTypes()
        const dynamicTypes = Array.isArray(items)
          ? items
              .filter((type): type is { _id?: string; name: string } => Boolean(type?.name))
              .map((type) => ({
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
        queryParams.append("page", String(page))
        queryParams.append("limit", String(PAGE_SIZE))

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
        } else if (activeType === "all") {
          // Default view across every category: group the catalogue by product
          // type A-Z so browsing "All Products" reads as an ordered catalogue
          // rather than an arbitrary jumble. An explicit sort choice (price,
          // name, newest) still wins — this only fills the default.
          queryParams.append("sortBy", "productType")
          queryParams.append("order", "asc")
        }

        const res = await fetch(`/api/finished-products?${queryParams.toString()}`)
        if (!res.ok) throw new Error("Failed to load products")

        const data = await res.json()
        setProducts(data.data || [])

        const total = data.pagination?.totalProducts ?? 0
        const pages = data.pagination?.totalPages ?? 1
        setTotalProducts(total)
        setTotalPages(Math.max(1, pages))

        // If the requested page overshoots the result set (e.g. after a filter
        // narrowed it), fall back to the last valid page instead of showing an
        // empty grid.
        if (page > pages && pages >= 1) setPage(pages)
      } catch (err: any) {
        setError(err.message || "Error loading products")
        setProducts([])
        setTotalProducts(0)
        setTotalPages(1)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [activeType, searchTerm, selectedMaterial, selectedAvailability, sortBy, page])

  // (The per-product tag pills were removed from the card as redundant, so the
  // tag/colour-variant derivation that fed them is gone with them.)

  return (
    <div className="catalogPage min-h-screen">
      {/* Breadcrumb for the Finished Products listing. Emitted from the page, not the layout:
          that layout also wraps the product detail route, and two
          BreadcrumbLists on one URL is a conflicting signal. */}
      <JsonLd
        data={jsonLdGraph(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Catalogue", path: "/catalog" },
            { name: "Finished Products", path: "/catalog/finished-products" },
          ])
        )}
      />
      <Header />
      <main>
        <section className="catalogHero leather-texture" aria-labelledby="finishedHeroTitle">
          <div className="catalogContainer">
            <div className="catalogHero__frame">
              <span className="catalogEyebrow">Our Collection</span>
              <h1 id="finishedHeroTitle">Wholesale Finished Leather Goods</h1>
              <p className="catalogHero__sub">
                Wholesale leather goods made to order — bags, jackets, belts and accessories built for performance and durability. White-label ready for distributors and private-label partners.
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
                  <article key={product._id} className="catalogFeatureCard catalogFeatureCard--fp">
                    <Link href={`/catalog/finished-products/${product._id}`}>
                      <div className="catalogFeatureCard__media">
                        <img
                          src={product.images?.[0] || FALLBACK_IMAGE}
                          alt={product.name}
                        />
                      </div>
                      <div className="catalogFeatureCard__body">
                        {/* Product type intentionally omitted: the type strip above
                            already scopes the grid, so repeating it (previously both
                            as an eyebrow and as a "Type:" meta row) was redundant.
                            MOQ now occupies that slot instead. */}
                        <h3>{product.name}</h3>
                        <div className="catalogFeatureMeta">
                          <p><span>Material:</span> {product.materialUsed}</p>
                          <p><span>MOQ:</span> {product.moq} units</p>
                        </div>
                        <p className="catalogFeatureCard__price">
                          {renderPrice(product.pricePerUnit, product.priceUnit)}
                        </p>
                        <div className="catalogChipRow">
                          {product.isFeatured && <span className="catalogChip catalogChip--gold">Featured</span>}
                          {product.sampleAvailable && <span className="catalogChip">Sample Available</span>}
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

            {!loading && !error && totalPages > 1 && (
              <nav className="catalogPagination" aria-label="Product pagination">
                <button
                  type="button"
                  className="catalogPagination__btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  Previous
                </button>

                <ul className="catalogPagination__pages">
                  {getPageItems(page, totalPages).map((item, i) =>
                    item === "…" ? (
                      <li key={`gap-${i}`} className="catalogPagination__gap" aria-hidden="true">
                        …
                      </li>
                    ) : (
                      <li key={item}>
                        <button
                          type="button"
                          className={`catalogPagination__page${item === page ? " is-active" : ""}`}
                          onClick={() => setPage(item as number)}
                          aria-current={item === page ? "page" : undefined}
                          aria-label={`Page ${item}`}
                        >
                          {item}
                        </button>
                      </li>
                    )
                  )}
                </ul>

                <button
                  type="button"
                  className="catalogPagination__btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  Next
                </button>
              </nav>
            )}

            {!loading && !error && totalProducts > 0 && (
              <p className="catalogPagination__count">
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, totalProducts)} of {totalProducts} products
              </p>
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
