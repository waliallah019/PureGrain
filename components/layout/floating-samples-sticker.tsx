"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function FloatingSamplesSticker() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isFooterInView, setIsFooterInView] = useState(false);

  const isCustomerFacingRoute = useMemo(() => {
    if (!pathname) return false;
    return !pathname.startsWith("/admin-ahmza") && !pathname.startsWith("/admin-login");
  }, [pathname]);

  const isHomePage = pathname === "/";

  useEffect(() => {
    if (!isCustomerFacingRoute) {
      setIsVisible(false);
      return;
    }

    if (!isHomePage) {
      setIsVisible(true);
      return;
    }

    const onScroll = () => {
      const heroSection = document.getElementById("home-hero");
      const triggerY = heroSection
        ? heroSection.offsetTop + heroSection.offsetHeight - 120
        : window.innerHeight * 0.9;

      setIsVisible(window.scrollY > triggerY);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [isCustomerFacingRoute, isHomePage]);

  useEffect(() => {
    const footer = document.getElementById("site-footer");
    if (!footer) {
      setIsFooterInView(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterInView(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, [pathname]);

  if (!isCustomerFacingRoute) {
    return null;
  }

  // Add extra top margin for mobile to clear the ticker/announcement bar
  // top-24 (6rem) → top-28 (7rem) for xs, top-32 (8rem) for sm, top-36 (9rem) for lg
  return (
    <div
      className={`fixed top-28 right-3 sm:top-32 sm:right-6 lg:top-36 z-40 transition-all duration-300 ${
        isVisible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 -translate-y-4 pointer-events-none"
      }`}
      aria-hidden={!isVisible}
    >
      <Link
        href="/request-sample/pay"
        aria-label="Get free samples"
        className="relative block"
      >
        <span
          className="absolute inset-2 rounded-full bg-gradient-to-br from-red-500/55 via-red-500/35 to-amber-400/45 blur-xl scale-110 -z-10 animate-pulse"
          aria-hidden="true"
        />
        <Image
          src="/sticker.png"
          alt="Free Samples"
          width={112}
          height={112}
          className="h-[84px] w-[84px] sm:h-[112px] sm:w-[112px] object-contain drop-shadow-xl hover:scale-105 transition-transform"
          priority={false}
        />
      </Link>
    </div>
  );
}
