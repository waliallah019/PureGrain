"use client"

/**
 * Shared building blocks for the landing page.
 *
 * The point of this file is that every section speaks the same motion and
 * typographic language. Before this existed, each section on the homepage
 * hand-rolled its own `initial`/`whileInView`/`transition` triple with slightly
 * different durations and delays, which is why the page read as a stack of
 * separate templates rather than one document.
 *
 * Every animation here degrades to "just show the content" when the visitor has
 * `prefers-reduced-motion: reduce` set.
 */

import {
  motion,
  useInView,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion"
import { useEffect, useRef, useState, type ReactNode } from "react"

/** The one easing curve used across the page. Slow out, quick settle. */
export const EASE = [0.22, 1, 0.36, 1] as const

/** Fire reveals slightly before the element is fully on screen. */
export const VIEWPORT = { once: true, margin: "-80px 0px -80px 0px" } as const

type RevealProps = {
  children: ReactNode
  className?: string
  /** Seconds. Prefer `Stagger` over hand-tuning this on siblings. */
  delay?: number
  /** Distance travelled, in px. `0` gives a pure fade. */
  y?: number
  as?: "div" | "section" | "li" | "article" | "span"
}

/**
 * The standard entrance. One element, fades and rises into place.
 */
export function Reveal({ children, className, delay = 0, y = 24, as = "div" }: RevealProps) {
  const reduce = useReducedMotion()
  const Component = motion[as]

  return (
    <Component
      className={className}
      initial={reduce ? { opacity: 1 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.6, delay: reduce ? 0 : delay, ease: EASE }}
    >
      {children}
    </Component>
  )
}

const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
}

/**
 * Wrap a grid/list in `Stagger` and each item in `StaggerItem`. Children cascade
 * automatically, so adding a card never means renumbering delays by hand.
 */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className={className}
      variants={reduce ? undefined : staggerParent}
      initial={reduce ? false : "hidden"}
      whileInView={reduce ? undefined : "show"}
      viewport={VIEWPORT}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()

  return (
    <motion.div className={className} variants={reduce ? undefined : staggerChild}>
      {children}
    </motion.div>
  )
}

/**
 * Counts from 0 to `value` the first time it scrolls into view.
 *
 * Static numbers are just claims; a number that animates as you arrive reads as
 * a measurement, which is the whole point of the trust strip. Non-numeric
 * credentials (e.g. "ISO 9001") should skip this component entirely.
 */
export function CountUp({
  value,
  suffix = "",
  prefix = "",
  duration = 1600,
  className,
}: {
  value: number
  suffix?: string
  prefix?: string
  duration?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(reduce ? value : 0)

  useEffect(() => {
    if (!inView || reduce) {
      if (reduce) setDisplay(value)
      return
    }

    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      // Ease-out cubic: fast arrival, gentle settle — matches EASE closely
      // enough that the number feels part of the same motion system.
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, reduce, value, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  )
}

/**
 * Section header: eyebrow, title, brass rule, optional lede.
 *
 * Previously each section repeated ~25 lines of motion-wrapped markup to build
 * this, and they had drifted apart (some centred, some had the rule, some had a
 * lede above the rule). One component keeps them identical.
 */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  onDark = false,
  className = "",
}: {
  eyebrow: string
  title: ReactNode
  lede?: ReactNode
  align?: "left" | "center"
  onDark?: boolean
  className?: string
}) {
  const centred = align === "center"

  return (
    <div
      className={`${centred ? "mx-auto max-w-2xl text-center" : "max-w-2xl"} ${className}`}
    >
      <Reveal>
        <p className={onDark ? "text-eyebrow-on-dark" : "text-eyebrow"}>{eyebrow}</p>
      </Reveal>
      <Reveal delay={0.08}>
        <h2
          className={`heading-section mt-4 ${
            onDark ? "text-[hsl(var(--primary-foreground))] dark:text-foreground" : "text-foreground"
          }`}
        >
          {title}
        </h2>
      </Reveal>
      <Reveal delay={0.16}>
        <div className={`divider-brass mt-6 ${centred ? "mx-auto" : ""}`} />
      </Reveal>
      {lede ? (
        <Reveal delay={0.22}>
          <p
            className={`mt-6 text-base leading-relaxed md:text-lg ${
              onDark
                ? "text-[hsl(var(--primary-foreground)/0.72)] dark:text-muted-foreground"
                : "text-muted-foreground"
            }`}
          >
            {lede}
          </p>
        </Reveal>
      ) : null}
    </div>
  )
}

/**
 * Maps a 0→1 scroll progress value onto a vertical parallax offset, clamped so
 * the element never drifts far enough to leave a gap at the section edge.
 */
export function useParallaxY(progress: MotionValue<number>, distance = 60) {
  const reduce = useReducedMotion()
  const raw = useTransform(progress, [0, 1], [distance, -distance])
  const smooth = useSpring(raw, { stiffness: 120, damping: 30, mass: 0.4 })
  const still = useTransform(progress, () => 0)
  return reduce ? still : smooth
}
