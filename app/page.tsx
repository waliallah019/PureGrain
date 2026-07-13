"use client"

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { Button } from "@/components/ui/button"
import PriceDisplay from "@/components/PriceDisplay"
import {
  ArrowRight,
  Briefcase,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Footprints,
  Globe,
  Globe2,
  Layers,
  Quote,
  Shield,
  Sofa,
  Truck,
  Users,
  Watch,
} from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import type { IRawLeather, IRawLeatherType } from "@/types/rawLeather"
import type { IProduct } from "@/types/product"

export default function PureGrainLanding() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1)
  const [autoplayResetKey, setAutoplayResetKey] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const [categoryTrackIndex, setCategoryTrackIndex] = useState(0)
  const [categoryVisibleCount, setCategoryVisibleCount] = useState(4)
  const [isCategoryTrackAnimating, setIsCategoryTrackAnimating] = useState(true)
  const [rawLeatherTypes, setRawLeatherTypes] = useState<IRawLeatherType[]>([])
  const [featuredRawLeather, setFeaturedRawLeather] = useState<IRawLeather[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<IProduct[]>([])
  const [rawLeatherSamplePool, setRawLeatherSamplePool] = useState<IRawLeather[]>([])
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)
  const slides = [
    {
      image: "/hero-leather-warm.jpg",
      label: "Premium B2B Leather Supply",
      headline: "Premium Leather for Serious Manufacturers",
      description:
        "Source exceptional quality leather at scale. From full grain to custom finishes, we supply discerning brands with materials that define craftsmanship.",
      primaryCta: { label: "Explore Collection", href: "/catalog" },
      secondaryCta: { label: "Custom Manufacturing", href: "/custom-manufacturing" },
    },
    {
      image: "/hero-leather-tan.jpg",
      label: "Artisan Craftsmanship",
      headline: "Exceptional Finishes, Unmatched Quality",
      description:
        "Discover our range of vegetable-tanned, aniline-dyed, and custom finishes crafted for furniture, fashion, and automotive applications.",
      primaryCta: { label: "View Finishes", href: "/catalog" },
      secondaryCta: { label: "Contact Sales", href: "/contact" },
    },
    {
      image: "/hero-leather-espresso.jpg",
      label: "Global Leather Partner",
      headline: "Trusted by Manufacturers Worldwide",
      description:
        "With 25+ years of expertise and exports to 40+ countries, we deliver consistent quality leather that powers leading brands across industries.",
      primaryCta: { label: "Our Industries", href: "/about" },
      secondaryCta: { label: "Browse Catalog", href: "/catalog" },
    },
  ]

  useEffect(() => {
    slides.forEach((slide) => {
      const image = new window.Image()
      image.src = slide.image
    })
  }, [])

  const paginateSlide = (direction: 1 | -1, resetAutoplay = false) => {
    setSlideDirection(direction)
    setCurrentSlide((prev) => (prev + direction + slides.length) % slides.length)
    if (resetAutoplay) {
      setAutoplayResetKey((prev) => prev + 1)
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      paginateSlide(1)
    }, 5000)
    return () => clearInterval(interval)
  }, [slides.length, autoplayResetKey])

  const slide = slides[currentSlide]
  const goToPreviousSlide = () => {
    paginateSlide(-1, true)
  }

  const goToNextSlide = () => {
    paginateSlide(1, true)
  }

  const handleHeroTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    const touch = event.touches[0]
    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
  }

  const handleHeroTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (touchStartX.current === null || touchStartY.current === null) return

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - touchStartX.current
    const deltaY = touch.clientY - touchStartY.current

    touchStartX.current = null
    touchStartY.current = null

    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) return

    if (deltaX > 0) {
      goToPreviousSlide()
    } else {
      goToNextSlide()
    }
  }

  const heroSlideEase = [0.22, 1, 0.36, 1] as const

  const slideMotionVariants: Variants = {
    active: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.9, ease: heroSlideEase },
    },
    inactive: {
      opacity: 0,
      scale: 1.035,
      transition: { duration: 0.9, ease: heroSlideEase },
    },
  }

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
        if (!isActive) return
        setIsCatalogLoading(false)
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
      if (!sampleByType.has(item.leatherType)) {
        sampleByType.set(item.leatherType, item)
      }
    })

    return rawLeatherTypes
      .filter((type) => sampleByType.has(type.name))
      .map((type) => {
        const sample = sampleByType.get(type.name)
        return {
          id: type._id,
          title: type.name,
          description: sample?.description ?? "",
          image: sample?.images?.[0] ?? "/placeholder.svg?height=800&width=800",
          href: "/catalog/raw-leather",
        }
      })
  }, [rawLeatherSamplePool, rawLeatherTypes])

  useEffect(() => {
    const updateCategoryVisibleCount = () => {
      const width = window.innerWidth

      if (width >= 1280) {
        setCategoryVisibleCount(4)
      } else if (width >= 1024) {
        setCategoryVisibleCount(3)
      } else if (width >= 768) {
        setCategoryVisibleCount(2)
      } else {
        setCategoryVisibleCount(1)
      }
    }

    updateCategoryVisibleCount()
    window.addEventListener("resize", updateCategoryVisibleCount)

    return () => {
      window.removeEventListener("resize", updateCategoryVisibleCount)
    }
  }, [])

  useEffect(() => {
    if (!leatherCategoryCards.length) {
      setCategoryTrackIndex(0)
      return
    }

    setIsCategoryTrackAnimating(false)
    setCategoryTrackIndex(leatherCategoryCards.length)
  }, [leatherCategoryCards.length])

  const categoryLoopCards = useMemo(() => {
    if (!leatherCategoryCards.length) return []
    return [...leatherCategoryCards, ...leatherCategoryCards, ...leatherCategoryCards]
  }, [leatherCategoryCards])

  const logicalCategoryIndex = leatherCategoryCards.length
    ? ((categoryTrackIndex % leatherCategoryCards.length) + leatherCategoryCards.length) %
      leatherCategoryCards.length
    : 0

  useEffect(() => {
    if (isCatalogLoading || leatherCategoryCards.length <= 1) return

    const interval = setInterval(() => {
      setIsCategoryTrackAnimating(true)
      setCategoryTrackIndex((prev) => prev + 1)
    }, 3000)

    return () => clearInterval(interval)
  }, [isCatalogLoading, leatherCategoryCards.length])

  useEffect(() => {
    if (!leatherCategoryCards.length) return

    const length = leatherCategoryCards.length
    if (categoryTrackIndex >= length * 2 || categoryTrackIndex < length) {
      const timeoutId = window.setTimeout(() => {
        setIsCategoryTrackAnimating(false)
        setCategoryTrackIndex((prev) => {
          const logical = ((prev % length) + length) % length
          return logical + length
        })
      }, 560)

      return () => window.clearTimeout(timeoutId)
    }
  }, [categoryTrackIndex, leatherCategoryCards.length])

  useEffect(() => {
    if (isCategoryTrackAnimating) return

    const frame = window.requestAnimationFrame(() => {
      setIsCategoryTrackAnimating(true)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [isCategoryTrackAnimating])

  const handlePreviousCategorySet = () => {
    if (leatherCategoryCards.length <= 1) return
    setIsCategoryTrackAnimating(true)
    setCategoryTrackIndex((prev) => prev - 1)
  }

  const handleNextCategorySet = () => {
    if (leatherCategoryCards.length <= 1) return
    setIsCategoryTrackAnimating(true)
    setCategoryTrackIndex((prev) => prev + 1)
  }

  const trustStats = [
    { value: "25+", label: "Years of Experience" },
    { value: "40+", label: "Countries Served" },
    { value: "ISO 9001", label: "Quality Certified" },
    { value: "500K+", label: "Sq. Ft. Monthly Supply" },
  ]

  const whyChooseUsFeatures = [
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
        "From embossing to specialized treatments, we tailor leather specifications to your exact requirements.",
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
        "Deep knowledge of footwear, furniture, automotive, and fashion applications. We understand your needs.",
    },
  ]

  const industries = [
    {
      icon: Footprints,
      name: "Footwear",
      description: "Premium leather for luxury shoes, boots, and athletic footwear.",
    },
    {
      icon: Sofa,
      name: "Furniture",
      description: "Durable upholstery leather for sofas, chairs, and interior design.",
    },
    {
      icon: Car,
      name: "Automotive",
      description: "High-performance leather for vehicle interiors and marine applications.",
    },
    {
      icon: Briefcase,
      name: "Fashion & Bags",
      description: "Supple leather for handbags, jackets, and fashion accessories.",
    },
    {
      icon: Watch,
      name: "Accessories",
      description: "Fine leather for watch straps, belts, and small leather goods.",
    },
  ]

  const processSteps = [
    {
      number: "01",
      title: "Browse & Shortlist",
      description:
        "Explore our leather collection and identify materials that match your specifications.",
    },
    {
      number: "02",
      title: "Request Samples",
      description:
        "Order physical samples to evaluate quality, texture, and color in your environment.",
    },
    {
      number: "03",
      title: "Discuss Requirements",
      description:
        "Work with our team to finalize specifications, customizations, and quantities.",
    },
    {
      number: "04",
      title: "Production & QC",
      description:
        "Your order enters production with rigorous quality control at every stage.",
    },
    {
      number: "05",
      title: "Global Delivery",
      description:
        "Reliable logistics ensures timely delivery with full export documentation.",
    },
  ]

  const globalRegions = [
    { name: "North America", countries: "USA, Canada, Mexico" },
    { name: "Europe", countries: "UK, Germany, Italy, France, Spain" },
    { name: "Asia Pacific", countries: "Japan, South Korea, Australia" },
    { name: "Middle East", countries: "UAE, Saudi Arabia, Qatar" },
    { name: "South America", countries: "Brazil, Argentina, Chile" },
    { name: "Africa", countries: "South Africa, Nigeria, Kenya" },
  ]

  const testimonials = [
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section - Cinematic Slider */}
      <section
        id="home-hero"
        className="relative min-h-screen flex items-center overflow-hidden bg-[hsl(30_10%_12%)]"
        onTouchStart={handleHeroTouchStart}
        onTouchEnd={handleHeroTouchEnd}
        style={
          {
            "--hero-overlay-strong": "30 10% 12%",
            "--hero-overlay-mid": "30 10% 12%",
            "--hero-overlay-light": "30 10% 12%",
            "--hero-text": "40 20% 96%",
            "--hero-text-muted": "40 20% 96%",
          } as CSSProperties
        }
      >
        <div className="absolute inset-0 bg-[hsl(var(--hero-overlay-strong))]" />
        <div className="absolute inset-0">
          {slides.map((item, index) => {
            const isActive = index === currentSlide

            return (
              <motion.div
                key={item.image}
                variants={slideMotionVariants}
                initial={index === 0 ? "active" : "inactive"}
                animate={isActive ? "active" : "inactive"}
                className="absolute inset-0 will-change-transform [backface-visibility:hidden]"
                aria-hidden={!isActive}
                style={{ pointerEvents: "none" }}
              >
                <img
                  src={item.image}
                  alt="Premium leather texture"
                  className="w-full h-full object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--hero-overlay-strong)/0.9)] via-[hsl(var(--hero-overlay-mid)/0.7)] to-[hsl(var(--hero-overlay-light)/0.4)]" />
              </motion.div>
            )
          })}
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-24 text-center">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center"
              >
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-label text-brass mb-6"
                >
                  {slide.label}
                </motion.p>

                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                  className="heading-display text-[hsl(var(--hero-text))] mb-6"
                >
                  {slide.headline}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="text-body text-[hsl(var(--hero-text-muted)/0.8)] mb-10 max-w-2xl"
                >
                  {slide.description}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <Button
                    size="lg"
                    className="btn-brass"
                    asChild
                  >
                    <Link href={slide.primaryCta.href}>
                      {slide.primaryCta.label}
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="
  text-sm uppercase tracking-wide
  px-8 py-4
  bg-transparent text-white
  border border-white/50
  hover:bg-white hover:text-amber-900
  transition-colors duration-300
"

                    asChild
                  >
                    <Link href={slide.secondaryCta.href}>
                      {slide.secondaryCta.label}
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <button
          type="button"
          onClick={goToPreviousSlide}
          aria-label="Previous slide"
          className="hidden md:block absolute left-4 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full border border-white/25 bg-white/10 text-white transition-colors duration-200 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <ChevronLeft className="mx-auto h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={goToNextSlide}
          aria-label="Next slide"
          className="hidden md:block absolute right-4 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full border border-white/25 bg-white/10 text-white transition-colors duration-200 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <ChevronRight className="mx-auto h-4 w-4" />
        </button>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs uppercase tracking-widest text-white/60">Scroll</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronDown className="text-white/60" size={20} />
          </motion.div>
        </motion.div>
      </section>

      {/* Trust Strip */}
      <section className="bg-bone border-y border-border">
        <div className="container-wide py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {trustStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <p className="font-serif text-3xl md:text-4xl font-semibold text-leather mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Leather Categories */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="max-w-2xl mb-16">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-label text-brass mb-4"
            >
              Our Collection
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="heading-section text-foreground mb-4"
            >
              Leather Categories
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="divider-brass mb-6" />
              <p className="text-body">
                From traditional tanning to modern finishes, explore our comprehensive range of premium leather materials.
              </p>
            </motion.div>
          </div>

          {dataError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {dataError}
            </div>
          ) : isCatalogLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-border">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`category-loading-${index}`} className="bg-background">
                  <div className="aspect-square animate-pulse bg-secondary" />
                  <div className="p-6 border-t border-border">
                    <div className="h-6 w-2/3 animate-pulse bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-muted-foreground">
                  Showing {Math.min(categoryVisibleCount, leatherCategoryCards.length)} of {leatherCategoryCards.length} categories
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePreviousCategorySet}
                    aria-label="Previous categories"
                    className="h-10 w-10 rounded-full border border-border text-foreground hover:border-brass/50 hover:text-brass transition-colors"
                  >
                    <ChevronLeft className="mx-auto h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextCategorySet}
                    aria-label="Next categories"
                    className="h-10 w-10 rounded-full border border-border text-foreground hover:border-brass/50 hover:text-brass transition-colors"
                  >
                    <ChevronRight className="mx-auto h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-hidden border border-border">
                <motion.div
                  className="flex"
                  animate={{ x: `-${(categoryTrackIndex * 100) / categoryVisibleCount}%` }}
                  transition={
                    isCategoryTrackAnimating
                      ? { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
                      : { duration: 0 }
                  }
                >
                  {categoryLoopCards.map((category, index) => (
                    <div
                      key={`${category.id}-${index}`}
                      className="shrink-0 border-r border-border"
                      style={{ width: `${100 / categoryVisibleCount}%` }}
                    >
                      <Link href={category.href} className="group block bg-background">
                        <div className="relative aspect-square overflow-hidden">
                          <img
                            src={category.image}
                            alt={category.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-transparent" />

                          <div className="absolute inset-0 flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="inline-flex items-center gap-2 text-brass text-sm font-medium">
                              View Collection <ArrowRight size={16} />
                            </span>
                          </div>
                        </div>

                        <div className="p-6 border-t border-border">
                          <h3 className="font-serif text-xl font-medium text-foreground group-hover:text-leather transition-colors">
                            {category.title}
                          </h3>
                        </div>
                      </Link>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-padding bg-primary text-primary-foreground dark:bg-background dark:text-foreground">
        <div className="container-wide">
          <div className="max-w-2xl mb-16">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-label text-brass mb-4"
            >
              Why PureGrain
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="heading-section mb-4"
            >
              Built for Serious Buyers
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="divider-brass mb-6" />
              <p className="text-primary-foreground/70 dark:text-muted-foreground text-lg">
                We understand B2B leather procurement. Our processes are designed for manufacturers who demand consistency, reliability, and expertise.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {whyChooseUsFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <feature.icon size={32} className="text-brass mb-4" strokeWidth={1.5} />
                <h3 className="font-serif text-xl font-medium mb-3">{feature.title}</h3>
                <p className="text-primary-foreground/60 dark:text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <div className="max-w-xl">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-label text-brass mb-4"
              >
                Featured Materials
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="heading-section text-foreground"
              >
                Popular Selections
              </motion.h2>
            </div>
          </div>

          <div className="space-y-12">
            <div>
              <Link
                href="/catalog/raw-leather"
                className="inline-flex items-center gap-2 text-sm font-medium text-leather hover:text-brass transition-colors mb-4"
              >
                View Leather Hides <ArrowRight size={16} />
              </Link>
              <h3 className="font-serif text-xl font-medium text-foreground mb-6">Featured Leather Hides</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {isCatalogLoading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <div key={`raw-loading-${index}`} className="bg-card border border-border overflow-hidden">
                        <div className="aspect-[4/3] animate-pulse bg-secondary" />
                        <div className="p-4 sm:p-5 space-y-3">
                          <div className="h-3 w-1/3 animate-pulse bg-secondary" />
                          <div className="h-5 w-3/4 animate-pulse bg-secondary" />
                          <div className="grid grid-cols-2 gap-3">
                            <div className="h-4 w-full animate-pulse bg-secondary" />
                            <div className="h-4 w-full animate-pulse bg-secondary" />
                          </div>
                          <div className="h-4 w-1/2 animate-pulse bg-secondary" />
                        </div>
                      </div>
                    ))
                  : featuredRawLeather.slice(0, 8).map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="h-full"
                  >
                    <Link
                      href={`/catalog/raw-leather/${product._id}`}
                      className="group flex flex-col h-full bg-card border border-border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/50 focus-visible:ring-offset-2"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                        <img
                          src={product.images?.[0] ?? "/placeholder.svg?height=800&width=600"}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex flex-col flex-1 p-4 sm:p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass mb-1.5">
                          {product.leatherType}
                        </p>
                        <h3 className="font-serif text-base sm:text-lg font-medium text-foreground mb-3 leading-snug line-clamp-1 group-hover:text-leather transition-colors">
                          {product.name}
                        </h3>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs mb-3">
                          <div className="min-w-0">
                            <span className="block text-muted-foreground">Thickness</span>
                            <span className="text-foreground/90 truncate block">{product.thickness}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="block text-muted-foreground">Finish</span>
                            <span className="text-foreground/90 truncate block">{product.finish}</span>
                          </div>
                        </div>
                        {product.colors?.length ? (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {product.colors.slice(0, 3).map((color) => (
                              <span
                                key={color}
                                className="text-[10px] px-1.5 py-0.5 bg-secondary text-secondary-foreground"
                              >
                                {color}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {product.pricePerSqFt ? (
                          <div className="mt-auto pt-3 border-t border-border flex items-baseline gap-1">
                            <PriceDisplay usdAmount={product.pricePerSqFt} className="text-sm font-semibold text-foreground" />
                            <span className="text-xs text-muted-foreground">/ sq ft</span>
                          </div>
                        ) : null}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            <div>
              <Link
                href="/catalog/finished-products"
                className="inline-flex items-center gap-2 text-sm font-medium text-leather hover:text-brass transition-colors mb-4"
              >
                View Finished Products <ArrowRight size={16} />
              </Link>
              <h3 className="font-serif text-xl font-medium text-foreground mb-6">Featured Products</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {isCatalogLoading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <div key={`product-loading-${index}`} className="bg-card border border-border overflow-hidden">
                        <div className="aspect-[4/3] animate-pulse bg-secondary" />
                        <div className="p-4 sm:p-5 space-y-3">
                          <div className="h-3 w-1/3 animate-pulse bg-secondary" />
                          <div className="h-5 w-3/4 animate-pulse bg-secondary" />
                          <div className="grid grid-cols-2 gap-3">
                            <div className="h-4 w-full animate-pulse bg-secondary" />
                            <div className="h-4 w-full animate-pulse bg-secondary" />
                          </div>
                          <div className="h-4 w-1/2 animate-pulse bg-secondary" />
                        </div>
                      </div>
                    ))
                  : featuredProducts.slice(0, 8).map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="h-full"
                  >
                    <Link
                      href={`/catalog/finished-products/${product._id}`}
                      className="group flex flex-col h-full bg-card border border-border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/50 focus-visible:ring-offset-2"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                        <img
                          src={product.images?.[0] ?? "/placeholder.svg?height=800&width=600"}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex flex-col flex-1 p-4 sm:p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-brass mb-1.5">
                          {product.productType}
                        </p>
                        <h3 className="font-serif text-base sm:text-lg font-medium text-foreground mb-3 leading-snug line-clamp-1 group-hover:text-leather transition-colors">
                          {product.name}
                        </h3>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs mb-3">
                          <div className="min-w-0">
                            <span className="block text-muted-foreground">Material</span>
                            <span className="text-foreground/90 truncate block">{product.materialUsed}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="block text-muted-foreground">Availability</span>
                            <span className="text-foreground/90 truncate block">{product.availability}</span>
                          </div>
                        </div>
                        {product.tags?.length ? (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {product.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-1.5 py-0.5 bg-secondary text-secondary-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {product.pricePerUnit ? (
                          <div className="mt-auto pt-3 border-t border-border flex items-baseline gap-1">
                            <PriceDisplay usdAmount={product.pricePerUnit} className="text-sm font-semibold text-foreground" />
                            <span className="text-xs text-muted-foreground">/ {product.priceUnit}</span>
                          </div>
                        ) : null}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Served */}
      <section className="section-padding bg-bone">
        <div className="container-wide">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-label text-brass mb-4"
            >
              Industries
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="heading-section text-foreground mb-4"
            >
              Trusted Across Sectors
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-body"
            >
              We supply leading manufacturers across multiple industries, understanding the unique requirements of each application.
            </motion.p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {industries.map((industry, index) => (
              <motion.div
                key={industry.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group text-center p-6 bg-background border border-border hover:border-brass/50 transition-all duration-300"
              >
                <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <industry.icon
                    size={28}
                    strokeWidth={1.5}
                    className="text-leather group-hover:text-brass transition-colors"
                  />
                </div>
                <h3 className="font-serif text-lg font-medium text-foreground mb-2">{industry.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{industry.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <Link href="/about" className="btn-secondary">
              Explore Industry Solutions
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Process */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="max-w-2xl mb-16">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-label text-brass mb-4"
            >
              How It Works
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="heading-section text-foreground mb-4"
            >
              From Inquiry to Delivery
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="divider-brass" />
            </motion.div>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-8 left-0 right-0 h-px bg-border" />

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {processSteps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="w-16 h-16 flex items-center justify-center bg-background border border-border mb-6 relative z-10">
                    <span className="font-serif text-2xl font-semibold text-leather">{step.number}</span>
                  </div>

                  <h3 className="font-serif text-lg font-medium text-foreground mb-3">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Global Reach */}
      <section className="section-padding bg-leather text-leather-foreground overflow-hidden">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-label text-brass mb-4"
              >
                Global Export
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="heading-section mb-6"
              >
                Delivering Excellence Worldwide
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-lg text-leather-foreground/70 mb-8"
              >
                With established logistics networks across six continents, we ensure reliable, timely delivery of premium leather to manufacturers worldwide. Our export expertise handles documentation, customs, and compliance seamlessly.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 gap-4"
              >
                {globalRegions.map((region) => (
                  <div key={region.name} className="p-4 border border-leather-foreground/10">
                    <h4 className="font-serif text-base font-medium mb-1">{region.name}</h4>
                    <p className="text-xs text-leather-foreground/50">{region.countries}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative flex items-center justify-center"
            >
              <div className="relative w-80 h-80 lg:w-96 lg:h-96">
                <div className="absolute inset-0 border border-leather-foreground/10 rounded-full" />
                <div className="absolute inset-4 border border-leather-foreground/10 rounded-full" />
                <div className="absolute inset-8 border border-leather-foreground/10 rounded-full" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-brass/10 rounded-full flex items-center justify-center">
                    <Globe size={48} className="text-brass" strokeWidth={1} />
                  </div>
                </div>

                <div className="absolute top-8 left-1/2 w-2 h-2 bg-brass rounded-full" />
                <div className="absolute bottom-16 left-12 w-2 h-2 bg-brass rounded-full" />
                <div className="absolute top-1/3 right-8 w-2 h-2 bg-brass rounded-full" />
                <div className="absolute bottom-1/4 right-16 w-2 h-2 bg-brass rounded-full" />
                <div className="absolute top-1/2 left-4 w-2 h-2 bg-brass rounded-full" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-label text-brass mb-4"
            >
              Client Testimonials
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="heading-section text-foreground"
            >
              Trusted by Leading Manufacturers
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative p-8 bg-bone border border-border"
              >
                <Quote size={32} className="text-brass/30 mb-6" strokeWidth={1} />
                <blockquote className="text-foreground leading-relaxed mb-8">
                  "{testimonial.quote}"
                </blockquote>
                <div className="border-t border-border pt-6">
                  <p className="font-serif text-base font-medium text-foreground">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground mt-1">{testimonial.role}</p>
                  <p className="text-sm text-brass mt-1">
                    {testimonial.company}, {testimonial.country}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 lg:py-32 bg-bone text-foreground border-y border-border overflow-hidden">
        {/* subtle leather-grain texture */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 30%, hsl(var(--leather)) 0%, transparent 45%), radial-gradient(circle at 75% 70%, hsl(var(--accent)) 0%, transparent 50%)",
          }}
        />
        {/* top brass hairline */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brass to-transparent"
        />
        <div className="relative container-wide">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="heading-display mb-6"
            >
              Looking for a Reliable Leather Supplier?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-muted-foreground mb-10"
            >
              Let&apos;s discuss your requirements. From samples to bulk orders, we&apos;re ready to support your production needs with premium quality leather.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Link href="/catalog" className="btn-brass">
                Browse Collection
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 border border-primary text-primary font-medium text-sm tracking-wide uppercase transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
              >
                Contact Sales
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}
