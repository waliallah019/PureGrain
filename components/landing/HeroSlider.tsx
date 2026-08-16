"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import { EASE } from "@/components/landing/primitives"

export type HeroSlide = {
  image: string
  /** Describes the photograph. The slide copy is announced from the <h1>. */
  imageAlt: string
  label: string
  headline: string
  description: string
  primaryCta: { label: string; href: string }
  secondaryCta: { label: string; href: string }
}

const AUTOPLAY_MS = 6500

/**
 * Credibility markers repeated on every slide. These restate claims the trust
 * strip and the About page already make — the hero surfaces them above the
 * fold rather than introducing anything new.
 */
const HERO_PROOF = ["25+ Years Exporting", "40+ Countries Served", "ISO 9001 Certified", "Free Samples"]

/*
 * Colour note: this section stays dark in BOTH themes because it sits on
 * photography. That rules out `primary` (which flips to gold in dark mode) —
 * `leather` / `leather-foreground` are dark-brown / near-white in both themes,
 * so they are the correct tokens here.
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const goTo = useCallback(
    (next: number) => setIndex((prev) => (next + slides.length) % slides.length),
    [slides.length]
  )
  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const previous = useCallback(() => goTo(index - 1), [goTo, index])

  // Autoplay stops while the visitor is interacting (hover, focus within, or an
  // explicit pause) and never runs at all under reduced-motion.
  useEffect(() => {
    if (isPaused || reduce || slides.length <= 1) return
    const timer = setTimeout(next, AUTOPLAY_MS)
    return () => clearTimeout(timer)
  }, [index, isPaused, reduce, next, slides.length])

  // Preload the other slides so advancing never shows a blank frame.
  useEffect(() => {
    slides.forEach((slide) => {
      const img = new window.Image()
      img.src = slide.image
    })
  }, [slides])

  const onTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }

  const onTouchEnd = (event: React.TouchEvent) => {
    if (!touchStart.current) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - touchStart.current.x
    const dy = touch.clientY - touchStart.current.y
    touchStart.current = null
    // Ignore mostly-vertical drags so scrolling the page never flips the slide.
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return
    if (dx > 0) previous()
    else next()
  }

  const slide = slides[index]
  const controlClass =
    "flex h-10 w-10 items-center justify-center border border-leather-foreground/25 text-leather-foreground transition-colors hover:border-brass hover:text-brass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"

  return (
    <section
      id="home-hero"
      aria-roledescription="carousel"
      aria-label="Pure Grain highlights"
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-leather"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      {/* Photography layer */}
      <div className="absolute inset-0">
        {slides.map((item, i) => {
          const isActive = i === index
          return (
            <motion.div
              key={item.image}
              className="absolute inset-0 will-change-transform [backface-visibility:hidden]"
              initial={false}
              animate={{ opacity: isActive ? 1 : 0 }}
              transition={{ duration: 1, ease: EASE }}
              aria-hidden={!isActive}
            >
              <img
                src={item.image}
                alt={isActive ? item.imageAlt : ""}
                className={`h-full w-full object-cover ${
                  isActive && !reduce ? "animate-kenburns" : "scale-[1.06]"
                }`}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                decoding="async"
              />
            </motion.div>
          )
        })}
      </div>

      {/* Scrim, weighted left so the copy column always has dark ground under it
          while the right side keeps showing the leather. Built from the brand
          espresso — the old hero used hsl(30 10% 12%), a desaturated grey-brown
          that read cold against every other section on the page. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-leather/95 via-leather/80 to-leather/35"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-leather/90 via-transparent to-leather/50"
      />
      <div aria-hidden="true" className="texture-grain absolute inset-0" />

      {/* Copy.
          `w-full` is load-bearing: the <section> is `flex items-center`, so this
          container is a flex ITEM and would otherwise shrink to fit its content
          (768px) instead of filling the section. `mx-auto` then centred that
          shrunken box, leaving dead space on both sides and pushing the copy out
          of alignment with the header logo and the slide controls below. With
          w-full, max-w-[1240px] + mx-auto behave normally and the copy sits on
          the same gutter as the rest of the page. */}
      <div className="container-wide relative z-10 w-full pb-32 pt-28 md:pb-36 md:pt-32">
        <div className="max-w-3xl lg:max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 1 } : { opacity: 0, y: -12 }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              <p className="flex items-center gap-3 text-eyebrow-on-dark">
                <span aria-hidden="true" className="h-px w-8 bg-brass" />
                {slide.label}
              </p>

              <h1 className="heading-display mt-5 text-balance text-leather-foreground">
                {slide.headline}
              </h1>

              {/* Capped at 2xl so the measure stays readable (~70 chars) even
                  though the headline above is allowed to run wider. */}
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-leather-foreground/80 md:text-lg">
                {slide.description}
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Link href={slide.primaryCta.href} className="btn-brass group">
                  {slide.primaryCta.label}
                  <ArrowRight
                    size={16}
                    className="ml-2 transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
                <Link
                  href={slide.secondaryCta.href}
                  className="inline-flex items-center justify-center rounded-none border border-leather-foreground/45 px-8 py-4 text-sm font-medium uppercase tracking-wide text-leather-foreground transition-colors duration-300 hover:bg-leather-foreground hover:text-leather focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-leather"
                >
                  {slide.secondaryCta.label}
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Proof row — static across slides, so it reads as a standing fact
              rather than part of the rotating pitch. */}
          <motion.ul
            initial={reduce ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-leather-foreground/20 pt-6"
          >
            {HERO_PROOF.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-xs font-medium tracking-wide text-leather-foreground/75 sm:text-[13px]"
              >
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-brass" />
                {item}
              </li>
            ))}
          </motion.ul>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute inset-x-0 bottom-0 z-20">
        <div className="container-wide pb-8">
          <div className="flex items-center justify-between gap-4">
            {/* Segmented progress. Each segment fills over the autoplay window so
                the visitor can see the slide is about to change instead of being
                surprised by it. */}
            <div className="flex flex-1 items-center gap-2 sm:max-w-xs">
              {slides.map((item, i) => (
                <button
                  key={item.image}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}: ${item.label}`}
                  aria-current={i === index}
                  className="group relative h-6 flex-1 focus-visible:outline-none"
                >
                  <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-leather-foreground/25 transition-colors group-hover:bg-leather-foreground/45 group-focus-visible:bg-brass/70" />
                  {i === index ? (
                    <motion.span
                      key={`${index}-${isPaused}`}
                      className="absolute inset-x-0 top-1/2 h-0.5 origin-left -translate-y-1/2 bg-brass"
                      initial={{ scaleX: reduce ? 1 : 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        duration: reduce || isPaused ? 0 : AUTOPLAY_MS / 1000,
                        ease: "linear",
                      }}
                    />
                  ) : null}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {!reduce && (
                <button
                  type="button"
                  onClick={() => setIsPaused((p) => !p)}
                  aria-label={isPaused ? "Resume slideshow" : "Pause slideshow"}
                  className={controlClass}
                >
                  {isPaused ? <Play size={14} /> : <Pause size={14} />}
                </button>
              )}
              <button type="button" onClick={previous} aria-label="Previous slide" className={controlClass}>
                <ChevronLeft size={16} />
              </button>
              <button type="button" onClick={next} aria-label="Next slide" className={controlClass}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
