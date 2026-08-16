"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Calendar } from "lucide-react"
import { EASE } from "@/components/landing/primitives"

export type PolicyHeroTrustItem = {
  icon: ReactNode
  label: string
}

type PolicyHeroProps = {
  eyebrow: string
  title: string
  /** Optional supporting paragraph. */
  subtitle?: ReactNode
  /** Renders the outlined pill, e.g. "Last Updated: January 2025". */
  updated?: string
  /** Optional row of reassurance chips beneath the badge. */
  trust?: PolicyHeroTrustItem[]
  /**
   * Optional call-to-action row, rendered between the subtitle and the trust
   * chips. Used by Quality & Process; the legal pages pass nothing.
   */
  actions?: ReactNode
}

/**
 * The dark leather-texture hero used on Return Policy, reimplemented on the
 * design system so Contact, Privacy and Terms can share it.
 *
 * The original lived in `app/return-policy/policy.css` as `.hero.leather-texture`
 * with a bordered `.hero__frame`. That stylesheet is scoped under `.policyPage`
 * and is loaded from a hand-written HTML file, so it could not be reused by
 * React pages. This component reproduces the same look — brass rules top and
 * bottom, brass hairlines down each side, centred frame — using tokens.
 *
 * `site-leather-texture` (globals.css) is the same fixed espresso texture the
 * original used, and it stays dark in both themes, which is why the type here is
 * pinned to `leather-foreground` rather than `foreground`.
 */
export function PolicyHero({
  eyebrow,
  title,
  subtitle,
  updated,
  trust,
  actions,
}: PolicyHeroProps) {
  const reduce = useReducedMotion()
  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 1 } : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay: reduce ? 0 : delay, ease: EASE },
  })

  return (
    <section className="site-leather-texture relative">
      {/* pt clears the fixed 5rem header plus the marquee strip below it. */}
      <div className="container-wide py-16 pt-[calc(5rem+3.5rem)] md:py-20 md:pt-[calc(5rem+5rem)]">
        <div className="relative mx-auto max-w-[980px] border-y border-brass/35 px-6 py-12 text-center sm:px-10 md:py-16">
          {/* Vertical brass hairlines. Hidden below `sm` where the frame is
              narrow enough that side rules crowd the text. */}
          <span
            aria-hidden="true"
            className="absolute inset-y-[-1px] left-6 hidden w-px bg-gradient-to-b from-transparent via-brass/50 to-transparent sm:block md:left-10"
          />
          <span
            aria-hidden="true"
            className="absolute inset-y-[-1px] right-6 hidden w-px bg-gradient-to-b from-transparent via-brass/50 to-transparent sm:block md:right-10"
          />

          <motion.p
            {...rise(0)}
            className="text-[0.7rem] font-medium uppercase tracking-[0.32em] text-brass sm:text-xs"
          >
            {eyebrow}
          </motion.p>

          <motion.h1
            {...rise(0.08)}
            className="heading-display mt-5 text-balance text-leather-foreground"
          >
            {title}
          </motion.h1>

          {subtitle ? (
            <motion.p
              {...rise(0.16)}
              className="mx-auto mt-6 max-w-[760px] text-base font-light leading-relaxed text-leather-foreground/75 md:text-lg"
            >
              {subtitle}
            </motion.p>
          ) : null}

          {actions ? (
            <motion.div
              {...rise(0.2)}
              className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
            >
              {actions}
            </motion.div>
          ) : null}

          {updated ? (
            <motion.p
              {...rise(0.22)}
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-brass bg-brass/10 px-4 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-brass sm:text-xs"
            >
              <Calendar size={13} aria-hidden="true" />
              {updated}
            </motion.p>
          ) : null}

          {trust?.length ? (
            <motion.ul
              {...rise(0.3)}
              className="mt-8 flex flex-col items-center justify-center gap-y-3 text-sm text-leather-foreground/75 sm:flex-row sm:flex-wrap sm:gap-y-2"
            >
              {trust.map((item, i) => (
                <li
                  key={item.label}
                  className={`inline-flex items-center gap-2 px-0 sm:px-5 ${
                    // Dividers between chips on sm+, stacked and rule-free on
                    // mobile so nothing gets squeezed against the frame edge.
                    i < trust.length - 1 ? "sm:border-r sm:border-brass/40" : ""
                  }`}
                >
                  <span className="text-brass" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </li>
              ))}
            </motion.ul>
          ) : null}
        </div>
      </div>
    </section>
  )
}
