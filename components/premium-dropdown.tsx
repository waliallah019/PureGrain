"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

type PremiumDropdownProps = {
  className?: string
}

/** Keeps the panel a predictable height regardless of how many types exist. */
const MAX_TYPES_PER_COLUMN = 5

async function fetchTypeNames(endpoint: string): Promise<string[]> {
  try {
    const res = await fetch(endpoint)
    if (!res.ok) return []
    const json = await res.json()
    if (!Array.isArray(json.data)) return []
    return Array.from(
      new Set<string>(
        json.data
          .map((item: { name?: string }) => item?.name)
          .filter((n: unknown): n is string => typeof n === "string" && n.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b))
  } catch {
    return []
  }
}

export function PremiumDropdown({ className }: PremiumDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [hideTypes, setHideTypes] = React.useState<string[]>([])
  const [productTypes, setProductTypes] = React.useState<string[]>([])

  // These lists were previously hardcoded to categories that don't exist in the
  // catalogue ("Full Grain Leather", "Furniture & Upholstery", ...) and every
  // entry linked to the unfiltered catalogue, so the menu neither reflected the
  // real inventory nor actually filtered anything. Both now come from the same
  // taxonomy endpoints the catalogue pages use.
  React.useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchTypeNames("/api/raw-leather-types"),
      fetchTypeNames("/api/product-types"),
    ]).then(([hides, products]) => {
      if (cancelled) return
      setHideTypes(hides)
      setProductTypes(products)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const menuItems = [
    {
      category: "LEATHER HIDES",
      viewAll: "/catalog/raw-leather",
      items: hideTypes.slice(0, MAX_TYPES_PER_COLUMN).map((name) => ({
        title: name,
        href: `/catalog/raw-leather?type=${encodeURIComponent(name)}`,
      })),
    },
    {
      category: "FINISHED PRODUCTS",
      viewAll: "/catalog/finished-products",
      items: productTypes.slice(0, MAX_TYPES_PER_COLUMN).map((name) => ({
        title: name,
        href: `/catalog/finished-products?type=${encodeURIComponent(name)}`,
      })),
    },
    {
      category: "CUSTOM MANUFACTURING",
      viewAll: "/custom-manufacturing",
      items: [
        { title: "Design Custom Orders", href: "/custom-manufacturing" },
        { title: "Bulk Customization", href: "/custom-manufacturing" },
        { title: "Color Matching", href: "/custom-manufacturing" },
        { title: "Quote & Samples", href: "/sample-request" },
      ],
    },
  ]

  return (
    <DropdownMenu onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger
        className={`flex items-center space-x-1.5 outline-none ${
          className ?? "text-sm font-medium tracking-wide transition-colors text-muted-foreground hover:text-foreground"
        }`}
      >
        <span>Catalog</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[min(calc(100vw-1.5rem),880px)] p-0 rounded-lg border border-border/50 bg-background shadow-2xl animate-in fade-in-0 slide-in-from-top-3 duration-300 overflow-hidden"
        align="center"
        collisionPadding={12}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y divide-border/30 lg:divide-y-0 lg:divide-x">
          {menuItems.map((section, idx) => (
            <div key={section.category} className="p-6 md:p-7 lg:p-8">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-foreground mb-6">
                {section.category}
              </p>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <Link
                    key={`${section.category}-${item.title}-${item.href}`}
                    href={item.href}
                    className="block group"
                  >
                    <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                      {item.title}
                    </div>
                    <div className="h-px w-0 group-hover:w-full bg-gradient-to-r from-primary to-transparent transition-all duration-300 mt-1" />
                  </Link>
                ))}

                {/* Always reachable, and the only entry while the taxonomy is
                    still loading, so the column is never empty. */}
                <Link
                  href={section.viewAll}
                  className="inline-flex items-center gap-1.5 pt-1 text-sm font-medium text-primary hover:underline"
                >
                  View all
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border/30 px-8 py-6 bg-primary/5">
          <p className="text-xs text-muted-foreground/80 leading-relaxed">
            Can't find what you're looking for? <Link href="/contact" className="text-primary font-semibold hover:underline">Contact our team</Link> for custom sourcing.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
