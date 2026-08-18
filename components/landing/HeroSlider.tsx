"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowRight } from "lucide-react"
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

/*
 * Colour note: this section stays dark in BOTH themes because it sits on
 * photography. That rules out `primary` (which flips to gold in dark mode) —
 * `leather` / `leather-foreground` are dark-brown / near-white in both themes,
 * so they are the correct tokens here.
 *
 * Chrome removed deliberately:
 *   - The play/pause and prev/next icon buttons are gone. On mobile they sat on
 *     top of the photograph and added nothing a swipe does not already do.
 *   - The standing proof row ("25+ Years Exporting · 40+ Countries Served · …")
 *     is gone because the trust strip immediately below the hero states the same
 *     four facts. Repeating them within one screen height read as padding.
 *
 * What replaces them is information rather than controls: a slide counter with
 * the current slide's own label, over a progress rule that fills across the
 * autoplay window. It tells the visitor where they are and that the panel is
 * about to change, without putting buttons on the artwork.
 *
 * Accessibility: autoplay still pauses on hover and on focus-within, and is
 * disabled outright under `prefers-reduced-motion`. The counter segments remain
 * real <button>s so keyboard users can still move between slides — without them
 * the carousel would be keyboard-inoperable, and WCAG 2.2.2 (Pause, Stop, Hide)
 * needs *some* mechanism for content that auto-updates.
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

  // Keyboard support for the carousel region, replacing the removed arrows.
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault()
      next()
    } else if (event.key === "ArrowLeft") {
      event.preventDefault()
      previous()
    }
  }

  const slide = slides[index]

  return (
    <section
      id="home-hero"
      aria-roledescription="carousel"
      aria-label="Pure Grain highlights"
      className="relative min-h-[86svh] overflow-hidden bg-leather md:min-h-[92svh]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onKeyDown={onKeyDown}
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
              <Image
                src={item.image}
                alt={item.imageAlt}
                fill
                sizes="100vw"
                quality={80}
                /* First slide is the LCP element — `priority` puts a
                   <link rel="preload" as="image"> in <head> with the full
                   responsive srcset. */
                priority={i === 0}
                className={`object-cover ${
                  isActive && !reduce ? "animate-kenburns" : "scale-[1.06]"
                }`}
              />
            </motion.div>
          )
        })}
      </div>

      {/* Scrim, weighted left so the copy column always has dark ground under it
          while the right side keeps showing the leather. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-leather/95 via-leather/80 to-leather/35"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-leather/90 via-transparent to-leather/50"
      />
      <div aria-hidden="true" className="texture-grain absolute inset-0" />

      {/*
        Vertical distribution. The section is a full-height flex column and the
        copy sits in a `flex-1` row that centres it, with the slide indicator on
        its own row at the bottom. Previously everything was bunched in one
        vertically-centred block, which left a large dead band beneath it once
        the proof row was removed.
      */}
      <div className="relative z-10 flex min-h-[86svh] flex-col md:min-h-[92svh]">
        <div className="flex flex-1 items-center">
          <div className="container-wide w-full pb-10 pt-28 md:pt-32">
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

                  {/* Roomier rhythm than before — the copy now has the vertical
                      space the proof row used to occupy. */}
                  <h1 className="heading-display mt-6 text-balance text-leather-foreground md:mt-7">
                    {slide.headline}
                  </h1>

                  <p className="mt-6 max-w-2xl text-base leading-relaxed text-leather-foreground/80 md:mt-7 md:text-lg">
                    {slide.description}
                  </p>

                  <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4 md:mt-10">
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
            </div>
          </div>
        </div>

        {/* Slide indicator — information, not chrome. Counter + the active
            slide's own label, over a rule that fills across the autoplay
            window. Each segment is a button so the carousel stays operable by
            keyboard, but nothing renders as an icon control on the artwork. */}
        <div className="container-wide w-full pb-10 md:pb-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <p className="shrink-0 text-xs font-medium tracking-[0.18em] text-leather-foreground/70">
              <span className="text-brass">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mx-1.5 text-leather-foreground/35">/</span>
              {String(slides.length).padStart(2, "0")}
              <span className="ml-3 hidden uppercase text-leather-foreground/55 sm:inline">
                {slide.label}
              </span>
            </p>

            <div className="flex flex-1 items-center gap-2 sm:max-w-sm">
              {slides.map((item, i) => (
                <button
                  key={item.image}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Show slide ${i + 1} of ${slides.length}: ${item.label}`}
                  aria-current={i === index}
                  className="group relative h-5 flex-1 focus-visible:outline-none"
                >
                  <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-leather-foreground/25 transition-colors group-hover:bg-leather-foreground/50 group-focus-visible:bg-brass" />
                  {i === index ? (
                    <motion.span
                      key={`${index}-${isPaused}-${String(reduce)}`}
                      className="absolute inset-x-0 top-1/2 h-px origin-left -translate-y-1/2 bg-brass"
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
          </div>
        </div>
      </div>
    </section>
  )
}
