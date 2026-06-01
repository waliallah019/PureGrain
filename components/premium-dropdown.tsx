"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

type PremiumDropdownProps = {
  className?: string
}

export function PremiumDropdown({ className }: PremiumDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const menuItems = [
    {
      category: "LEATHER HIDES",
      items: [
        { title: "Full Grain Leather", href: "/catalog/raw-leather" },
        { title: "Top Grain Leather", href: "/catalog/raw-leather" },
        { title: "Suede & Nubuck", href: "/catalog/raw-leather" },
        { title: "Specialty Finishes", href: "/catalog/raw-leather" },
      ],
    },
    {
      category: "FINISHED PRODUCTS",
      items: [
        { title: "Footwear & Accessories", href: "/catalog/finished-products" },
        { title: "Furniture & Upholstery", href: "/catalog/finished-products" },
        { title: "Bags & Leather Goods", href: "/catalog/finished-products" },
        { title: "Automotive Leather", href: "/catalog/finished-products" },
      ],
    },
    {
      category: "CUSTOM MANUFACTURING",
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
