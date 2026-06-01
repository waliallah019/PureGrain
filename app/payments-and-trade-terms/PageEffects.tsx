// app/payments-and-trade-terms/PageEffects.tsx
'use client'

import { useEffect, useState } from 'react'

export default function PageEffects() {
  const [navOpen, setNavOpen] = useState(false)

  // Footer year
  useEffect(() => {
    const yearEl = document.getElementById('year')
    if (yearEl) yearEl.textContent = String(new Date().getFullYear())
  }, [])

  // Sticky header shadow on scroll
  useEffect(() => {
    const header = document.getElementById('siteHeader')
    if (!header) return

    const onScroll = () => {
      if (window.scrollY > 8) header.classList.add('is-scrolled')
      else header.classList.remove('is-scrolled')
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Mobile nav toggle
  useEffect(() => {
    const navToggle = document.getElementById('navToggle')
    const primaryNav = document.getElementById('primaryNav')
    if (!navToggle || !primaryNav) return

    const handleToggle = () => {
      const open = primaryNav.classList.toggle('is-open')
      navToggle.setAttribute('aria-expanded', String(open))
      navToggle.innerHTML = open
        ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-bars" aria-hidden="true"></i>'
    }

    const handleLinkClick = () => {
      if (primaryNav.classList.contains('is-open')) {
        primaryNav.classList.remove('is-open')
        navToggle.setAttribute('aria-expanded', 'false')
        navToggle.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>'
      }
    }

    navToggle.addEventListener('click', handleToggle)
    primaryNav.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', handleLinkClick)
    )

    return () => {
      navToggle.removeEventListener('click', handleToggle)
      primaryNav.querySelectorAll('a').forEach((a) =>
        a.removeEventListener('click', handleLinkClick)
      )
    }
  }, [])

  // FAQ accordion
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>('.faq-item')
    const cleanups: (() => void)[] = []

    items.forEach((item) => {
      const btn = item.querySelector<HTMLButtonElement>('.faq-q')
      const ans = item.querySelector<HTMLElement>('.faq-a')
      if (!btn || !ans) return

      const handler = () => {
        const open = item.classList.toggle('is-open')
        btn.setAttribute('aria-expanded', String(open))
        ans.style.maxHeight = open ? `${ans.scrollHeight}px` : '0px'
      }

      btn.addEventListener('click', handler)
      cleanups.push(() => btn.removeEventListener('click', handler))
    })

    return () => cleanups.forEach((fn) => fn())
  }, [])

  // Intersection Observer reveal
  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>('.reveal')

    if (!('IntersectionObserver' in window)) {
      reveals.forEach((el) => el.classList.add('is-visible'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )

    reveals.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return null // renders nothing — only runs effects
}
