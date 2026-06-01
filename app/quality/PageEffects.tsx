// app/quality/PageEffects.tsx
'use client'

import { useEffect } from 'react'

export default function PageEffects() {
  useEffect(() => {
    const yearEl = document.getElementById('year')
    if (yearEl) yearEl.textContent = String(new Date().getFullYear())
  }, [])

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

  // FAQ accordion
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>('.faq-item')
    if (!items.length) return
    const handlers: Array<{ btn: HTMLButtonElement; fn: () => void }> = []
    items.forEach((item) => {
      const btn = item.querySelector<HTMLButtonElement>('.faq-q')
      const ans = item.querySelector<HTMLElement>('.faq-a')
      if (!btn || !ans) return
      const fn = () => {
        const open = item.classList.toggle('is-open')
        btn.setAttribute('aria-expanded', String(open))
        ans.style.maxHeight = open ? `${ans.scrollHeight}px` : '0px'
      }
      btn.addEventListener('click', fn)
      handlers.push({ btn, fn })
    })
    return () => handlers.forEach(({ btn, fn }) => btn.removeEventListener('click', fn))
  }, [])

  return null
}
