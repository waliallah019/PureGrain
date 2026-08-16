"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react"
import type { IRawLeatherType } from "@/types/rawLeather"
import { SITE } from "@/lib/site"

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

  // Cap the list: rendering every type made this column grow without bound as
  // the catalogue grew, which unbalanced the footer grid (and on mobile turned
  // it into a long scroll). A "View all" link keeps the rest reachable. Four
  // keeps this column the same height as the Company column beside it.
  const MAX_FOOTER_TYPES = 4

  const productLinks = useMemo(
    () =>
      rawLeatherTypes
        .map((type) => type.name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))
        .slice(0, MAX_FOOTER_TYPES)
        .map((name) => ({
          href: `/catalog/raw-leather?type=${encodeURIComponent(name)}`,
          label: name,
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
      {/* Hairline that ties the footer back to the brass accent used across the
          site and separates it from whatever section precedes it. */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-brass/60 to-transparent" />

      <div className="container-wide py-12 md:py-16">
        {/* Brand sits in its own 4/12 rail on large screens; the three link
            columns share the remaining 8/12 so they align to a single baseline
            instead of the old equal-quarters split, which left the brand copy
            cramped and the contact column overflowing. */}
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block">
              <span className="font-serif text-2xl font-semibold tracking-tight">PureGrain</span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[hsl(var(--footer-foreground)/0.65)]">
              Premium leather sourcing for discerning manufacturers. Trusted by leading brands worldwide for consistent quality and reliable supply.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {[
                { href: SITE.social.instagram, label: "Instagram", Icon: Instagram },
                { href: SITE.social.facebook, label: "Facebook", Icon: Facebook },
                { href: SITE.social.linkedin, label: "LinkedIn", Icon: Linkedin },
              ].map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center border border-[hsl(var(--footer-foreground)/0.18)] text-[hsl(var(--footer-foreground)/0.75)] transition-colors hover:border-brass hover:bg-brass/10 hover:text-brass"
                  aria-label={label}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns. Two-up on phones so the footer reads as a block
              instead of one long scroll; three-up from md, where Contact's
              address no longer needs the full width. */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-x-10 md:grid-cols-3 lg:col-span-8">
            {/* Leather Types */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--footer-foreground)/0.55)]">
                Leather Types
              </h4>
              <span className="mt-3 block h-px w-8 bg-brass/70" />
              <ul className="mt-4 space-y-2.5">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block text-sm text-[hsl(var(--footer-foreground)/0.7)] transition-all duration-200 hover:translate-x-0.5 hover:text-brass"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/catalog/raw-leather"
                className="group mt-5 inline-flex items-center gap-1.5 border border-brass/40 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-brass transition-colors hover:border-brass hover:bg-brass/10"
              >
                View all
                <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--footer-foreground)/0.55)]">
                Company
              </h4>
              <span className="mt-3 block h-px w-8 bg-brass/70" />
              <ul className="mt-4 space-y-2.5">
                {companyLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block text-sm text-[hsl(var(--footer-foreground)/0.7)] transition-all duration-200 hover:translate-x-0.5 hover:text-brass"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="col-span-2 md:col-span-1">
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--footer-foreground)/0.55)]">
                Contact
              </h4>
              <span className="mt-3 block h-px w-8 bg-brass/70" />
              <ul className="mt-4 space-y-3.5">
                <li className="flex items-start gap-3">
                  <MapPin size={16} className="mt-0.5 flex-shrink-0 text-brass" />
                  <span className="text-sm leading-relaxed text-[hsl(var(--footer-foreground)/0.7)]">
                    {SITE.address.line1} {SITE.address.line2}
                    <br />
                    {SITE.address.city} {SITE.address.postalCode}, {SITE.address.country}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Mail size={16} className="mt-0.5 flex-shrink-0 text-brass" />
                  <a
                    href={`mailto:${SITE.email}`}
                    className="break-all text-sm text-[hsl(var(--footer-foreground)/0.7)] transition-colors hover:text-brass"
                  >
                    {SITE.email}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Phone size={16} className="mt-0.5 flex-shrink-0 text-brass" />
                  <a
                    href={`tel:${SITE.phoneHref}`}
                    className="text-sm text-[hsl(var(--footer-foreground)/0.7)] transition-colors hover:text-brass"
                  >
                    {SITE.phoneDisplay}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar. Reversed on mobile so the legal row sits directly under
            the columns and the copyright closes the page. */}
        <div className="mt-12 flex flex-col-reverse items-center gap-4 border-t border-[hsl(var(--footer-foreground)/0.1)] pt-6 md:mt-14 md:flex-row md:justify-between md:gap-6">
          <p className="text-center text-xs text-[hsl(var(--footer-foreground)/0.5)] md:text-left md:text-sm">
            © {currentYear} PureGrain. All rights reserved.{" "}
            <span className="mt-1 block md:ml-2 md:mt-0 md:inline">
              Powered by{" "}
              <a
                href="https://www.axenity.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brass underline-offset-2 transition-colors hover:underline"
              >
                Axenity
              </a>
            </span>
          </p>
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 md:justify-end">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-[hsl(var(--footer-foreground)/0.5)] transition-colors hover:text-brass"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
