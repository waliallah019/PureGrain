"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useLenis } from "@/lib/utils/lenis"

function ScrollManagerBody() {
  const pathname = usePathname()
  const lenis = useLenis()
  const frameRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || typeof history === "undefined") {
      return
    }

    const previousScrollRestoration = history.scrollRestoration
    history.scrollRestoration = "manual"

    return () => {
      history.scrollRestoration = previousScrollRestoration
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    const resetScroll = () => {
      window.scrollTo(0, 0)
      lenis?.scrollTo(0, { immediate: true })
    }

    resetScroll()

    frameRef.current = window.requestAnimationFrame(() => {
      window.scrollTo(0, 0)
      lenis?.scrollTo(0, { immediate: true })
    })

    timeoutRef.current = window.setTimeout(() => {
      window.scrollTo(0, 0)
      lenis?.scrollTo(0, { immediate: true })
    }, 50)

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [pathname, lenis])

  return null
}

export function ScrollManager() {
  return <ScrollManagerBody />
}

export { ScrollManager as ScrollToTopOnRouteChange }
