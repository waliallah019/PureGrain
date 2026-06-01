"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, ChevronUp, Menu, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { PremiumDropdown } from "@/components/premium-dropdown"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLenis } from "@/lib/utils/lenis"
import CurrencySwitcher from "@/components/CurrencySwitcher"

export function Header() {
  const pathname = usePathname()
  const lenis = useLenis()
  const pathnameRef = useRef(pathname)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showMarquee, setShowMarquee] = useState(pathname !== "/")
  const [isFinishedOpen, setIsFinishedOpen] = useState(false)
  const [isHidesOpen, setIsHidesOpen] = useState(false)
  const [finishedProductTypes, setFinishedProductTypes] = useState<string[]>([])
  const [rawLeatherTypes, setRawLeatherTypes] = useState<string[]>([])

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      setIsScrolled(currentY > 50)

      if (pathname !== "/") {
        setShowMarquee(true)
        return
      }

      const heroSection = document.getElementById("home-hero")
      const threshold = heroSection
        ? heroSection.offsetTop + heroSection.offsetHeight - 80
        : window.innerHeight * 0.95

      setShowMarquee(currentY > threshold)
    }

    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
    }
  }, [pathname])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    const fetchMobileMenuTypes = async () => {
      try {
        const [finishedRes, rawRes] = await Promise.all([
          fetch("/api/product-types"),
          fetch("/api/raw-leather-types"),
        ])

        if (finishedRes.ok) {
          const finishedData = await finishedRes.json()
          const types: string[] = Array.isArray(finishedData.data)
            ? Array.from(
                new Set<string>(
                  finishedData.data
                    .map((item: { name?: string }) => item?.name)
                    .filter((name: unknown): name is string => typeof name === "string" && name.length > 0),
                ),
              )
            : []
          setFinishedProductTypes(types)
        }

        if (rawRes.ok) {
          const rawData = await rawRes.json()
          const types: string[] = Array.isArray(rawData.data)
            ? Array.from(
                new Set<string>(
                  rawData.data
                    .map((item: { name?: string }) => item?.name)
                    .filter((name: unknown): name is string => typeof name === "string" && name.length > 0),
                ),
              )
            : []
          setRawLeatherTypes(types)
        }
      } catch (error) {
        console.error("Failed to load mobile menu categories", error)
      }
    }

    fetchMobileMenuTypes()
  }, [])

  useEffect(() => {
    if (!isMobileMenuOpen) {
      setIsFinishedOpen(false)
      setIsHidesOpen(false)
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return
    }

    const lockedPathname = pathname
    const scrollY = window.scrollY
    const originalStyle = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    }

    document.body.style.position = "fixed"
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = "0"
    document.body.style.right = "0"
    document.body.style.width = "100%"
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.position = originalStyle.position
      document.body.style.top = originalStyle.top
      document.body.style.left = originalStyle.left
      document.body.style.right = originalStyle.right
      document.body.style.width = originalStyle.width
      document.body.style.overflow = originalStyle.overflow

      // When navigation occurred while the mobile menu was open, do not restore old scroll.
      if (pathnameRef.current === lockedPathname) {
        const previousScrollBehavior = document.documentElement.style.scrollBehavior
        document.documentElement.style.scrollBehavior = "auto"
        window.scrollTo(0, scrollY)
        lenis?.scrollTo(scrollY, { immediate: true })
        window.requestAnimationFrame(() => {
          document.documentElement.style.scrollBehavior = previousScrollBehavior
        })
      }
    }
  }, [isMobileMenuOpen, pathname, lenis])

  const navLinks = useMemo(
    () => [
      { href: "/", label: "Home" },
      { href: "/industries", label: "Industries" },
      { href: "/quality", label: "Quality & Process" },
      { href: "/blogs", label: "Blogs" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
    []
  )

  const collectionLinks = useMemo(
    () => [{ href: "/custom-manufacturing", label: "Custom Manufacturing" }],
    []
  )

  const isCollectionActive =
    pathname?.startsWith("/catalog") || pathname?.startsWith("/custom-manufacturing")
  const isPaymentsTradeTermsPage = pathname === "/payments-and-trade-terms"
  const isReturnPolicyPage = pathname === "/return-policy"
  const isTopOverlayPage = (pathname === "/" || isPaymentsTradeTermsPage || isReturnPolicyPage) && !isScrolled
  const showDarkLogo = isTopOverlayPage && !isMobileMenuOpen

  const getNavLinkClass = (isActive: boolean) => {
    if (isScrolled) {
      if (isPaymentsTradeTermsPage || isReturnPolicyPage) {
        return isActive
          ? "text-[hsl(40_20%_92%)] hover:text-[hsl(40_20%_92%)] dark:text-foreground dark:hover:text-foreground"
          : "text-[hsl(30_10%_60%)] hover:text-[hsl(40_20%_92%)] dark:text-muted-foreground dark:hover:text-foreground"
      }

      return isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
    }

    if (isTopOverlayPage) {
      return isActive
        ? "text-[hsl(40_20%_92%)] hover:text-[hsl(40_20%_92%)] dark:text-foreground dark:hover:text-foreground"
        : "text-[hsl(30_10%_60%)] hover:text-[hsl(40_20%_92%)] dark:text-muted-foreground dark:hover:text-foreground"
    }

    return isActive
      ? "text-foreground/90 hover:text-foreground dark:text-foreground dark:hover:text-foreground"
      : "text-foreground/70 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground"
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        isPaymentsTradeTermsPage || isReturnPolicyPage
          ? "bg-[hsl(17_47%_12%)] border-b border-[rgba(212,184,150,0.28)] shadow-sm"
          : isScrolled || isMobileMenuOpen
          ? "bg-background/95 backdrop-blur-sm border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container-wide">
        <div className="flex items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 min-w-0 lg:min-w-[180px]">
            <Image
              src="/new_logo.png"
              alt="Pure Grain Logo Light"
              width={180}
              height={50}
              className={`object-contain hover:opacity-90 transition-opacity ${
                showDarkLogo ? "hidden" : "block dark:hidden"
              }`}
            />
            <Image
              src="/temp_logo.png"
              alt="Pure Grain Logo Dark"
              width={180}
              height={50}
              className={`object-contain hover:opacity-90 transition-opacity ${
                showDarkLogo ? "block" : "hidden"
              } dark:block`}
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center justify-center gap-8 flex-1">
            <Link
              href="/"
              className={`text-sm font-medium tracking-wide transition-colors link-underline ${
                getNavLinkClass(pathname === "/")
              }`}
            >
              Home
            </Link>
            <PremiumDropdown
              className={`text-sm font-medium tracking-wide transition-colors link-underline ${
                getNavLinkClass(isCollectionActive)
              }`}
            />
            {navLinks.slice(1).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium tracking-wide transition-colors link-underline ${
                  getNavLinkClass(pathname === link.href)
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="ml-auto flex items-center gap-3 justify-end lg:min-w-[180px]">
            <div className="hidden lg:block">
              <CurrencySwitcher />
            </div>
            <ThemeToggle className={isTopOverlayPage ? "text-white hover:text-white/90" : undefined} />
            <button
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="lg:hidden p-2 text-foreground"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {showMarquee && (
        <div className="border-t border-brass/40 bg-gradient-to-r from-leather via-primary to-leather shadow-[0_6px_24px_rgba(0,0,0,0.25)]">
          <div className="overflow-hidden py-1.5">
            <div className="marquee-track">
              {[0, 1].map((repeatIndex) => (
                <div key={repeatIndex} className="flex items-center gap-6 px-6 whitespace-nowrap text-xs sm:text-sm uppercase tracking-[0.14em] font-semibold text-bone">
                  <span className="font-extrabold">Free Samples Available</span>
                  <span className="text-brass text-sm">●</span>
                  <span>Premium Leather for Global Buyers</span>
                  <span className="text-brass text-sm">●</span>
                  <span>Custom Manufacturing Support</span>
                  <span className="text-brass text-sm">●</span>
                  <span className="font-bold">Secure International Shipping</span>
                  <span className="text-brass text-sm">●</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="lg:hidden fixed inset-0 top-20 z-40"
          >
            <button
              type="button"
              aria-label="Close menu overlay"
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/45"
            />

            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-0 h-[calc(100dvh-5rem)] w-[min(88vw,360px)] bg-background border-l border-border shadow-[0_20px_60px_rgba(0,0,0,0.45)] overflow-hidden"
            >
              <nav className="h-full max-h-full overflow-y-scroll overscroll-contain [touch-action:pan-y] [-webkit-overflow-scrolling:touch] px-5 pt-0 pb-[max(6rem,env(safe-area-inset-bottom))]">
                <div>
                  <Link
                    href="/"
                    className={`block pt-1 pb-3 text-base font-semibold border-b border-border/60 ${
                      pathname === "/" ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    Home
                  </Link>
                </div>

                <div className="pt-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Leather Collection</p>
                  <div className="space-y-0">
                    <div className="border-b border-border/60">
                      <button
                        type="button"
                        onClick={() => setIsFinishedOpen((prev) => !prev)}
                        className="w-full flex items-center justify-between py-3 text-base font-semibold text-left text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Finished Products
                        {isFinishedOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      {isFinishedOpen && (
                        <div className="pb-3 space-y-1">
                          <Link
                            href="/catalog/finished-products"
                            className="block py-2 pl-3 text-sm text-muted-foreground hover:text-foreground"
                          >
                            All Finished Products
                          </Link>
                          {finishedProductTypes.map((type) => (
                            <Link
                              key={type}
                              href={`/catalog/finished-products?type=${encodeURIComponent(type)}`}
                              className="block py-2 pl-3 text-sm text-muted-foreground hover:text-foreground"
                            >
                              {type}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border-b border-border/60">
                      <button
                        type="button"
                        onClick={() => setIsHidesOpen((prev) => !prev)}
                        className="w-full flex items-center justify-between py-3 text-base font-semibold text-left text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Leather Hides
                        {isHidesOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      {isHidesOpen && (
                        <div className="pb-3 space-y-1">
                          <Link
                            href="/catalog/raw-leather"
                            className="block py-2 pl-3 text-sm text-muted-foreground hover:text-foreground"
                          >
                            All Leather Hides
                          </Link>
                          {rawLeatherTypes.map((type) => (
                            <Link
                              key={type}
                              href={`/catalog/raw-leather?type=${encodeURIComponent(type)}`}
                              className="block py-2 pl-3 text-sm text-muted-foreground hover:text-foreground"
                            >
                              {type}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    {collectionLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`block py-3 text-base font-semibold border-b border-border/60 ${
                          pathname === link.href ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="pt-5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Company</p>
                  <div className="space-y-0">
                    {navLinks.slice(1).map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`block py-3 text-base font-semibold border-b border-border/60 ${
                          pathname === link.href ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">Currency</p>
                  <CurrencySwitcher fullWidth />
                </div>

                <div className="pt-6">
                  <Link href="/catalog" className="btn-brass text-xs w-full">
                    View Catalog
                  </Link>
                </div>
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
