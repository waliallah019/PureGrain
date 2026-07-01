"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Instagram, Mail, MapPin, Phone } from "lucide-react"
import type { IRawLeatherType } from "@/types/rawLeather"

export function Footer() {
  const currentYear = new Date().getFullYear()
  const [rawLeatherTypes, setRawLeatherTypes] = useState<IRawLeatherType[]>([])

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await fetch("/api/raw-leather-types")
        if (!res.ok) throw new Error("Failed to load leather types")
        const data = await res.json()
        setRawLeatherTypes(Array.isArray(data.data) ? data.data : [])
      } catch (error) {
        console.error("Footer leather types fetch failed:", error)
        setRawLeatherTypes([])
      }
    }

    fetchTypes()
  }, [])

  const productLinks = useMemo(
    () =>
      rawLeatherTypes.map((type) => ({
        href: `/catalog/raw-leather?type=${encodeURIComponent(type.name)}`,
        label: type.name,
      })),
    [rawLeatherTypes]
  )

  const companyLinks = [
    { href: "/about", label: "About Us" },
    { href: "/quality", label: "Quality & Process" },
    { href: "/industries", label: "Industries Served" },
    { href: "/contact", label: "Contact" },
  ]

  const legalLinks = [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms & Conditions" },
    { href: "/return-policy", label: "Return Policy" },
    { href: "/payments-and-trade-terms", label: "Payment & Trade Terms" },
  ]

  return (
    <footer
      id="site-footer"
      className="bg-[hsl(var(--footer-primary))] text-[hsl(var(--footer-foreground))]"
      style={
        {
          "--footer-primary": "17 47% 12%",
          "--footer-foreground": "30 67% 97%",
        } as React.CSSProperties
      }
    >
      <div className="container-wide py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="font-serif text-2xl font-semibold tracking-tight">PureGrain</span>
            </Link>
            <p className="text-[hsl(var(--footer-foreground)/0.7)] text-sm leading-relaxed mb-4">
              Premium leather sourcing for discerning manufacturers. Trusted by leading brands worldwide for consistent quality and reliable supply.
            </p>
            <div className="flex gap-4">
              <a
                href="http://instagram.com/puregrainexports/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center border border-[hsl(var(--footer-foreground)/0.2)] hover:border-brass hover:text-brass transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Products Column */}
          <div>
            <h4 className="text-label text-[hsl(var(--footer-foreground)/0.5)] mb-4">Leather Types</h4>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[hsl(var(--footer-foreground)/0.7)] hover:text-brass transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-label text-[hsl(var(--footer-foreground)/0.5)] mb-4">Company</h4>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[hsl(var(--footer-foreground)/0.7)] hover:text-brass transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="text-label text-[hsl(var(--footer-foreground)/0.5)] mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-brass mt-0.5 flex-shrink-0" />
                <span className="text-sm text-[hsl(var(--footer-foreground)/0.7)]">
                  Kothi Mian Bashir Ahmed Toheed Park
                  <br />
                  Daroghawala, Lahore 54000, Pakistan
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-brass flex-shrink-0" />
                <a
                  href="mailto:info@puregrainexports.com"
                  className="text-sm text-[hsl(var(--footer-foreground)/0.7)] hover:text-brass transition-colors"
                >
                  info@puregrainexports.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-brass flex-shrink-0" />
                <a
                  href="tel:+923245243670"
                  className="text-sm text-[hsl(var(--footer-foreground)/0.7)] hover:text-brass transition-colors"
                >
                  +92 324 5243670
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-5 border-t border-[hsl(var(--footer-foreground)/0.1)] flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-sm text-[hsl(var(--footer-foreground)/0.5)] text-center md:text-left">
            © {currentYear} PureGrain. All rights reserved.{" "}
            <span className="block md:inline mt-1 md:mt-0 md:ml-2">
              Powered by{" "}
              <a
                href="https://www.axenity.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brass hover:underline underline-offset-2 transition-colors"
              >
                Axenity
              </a>
            </span>
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-[hsl(var(--footer-foreground)/0.5)] hover:text-brass transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
