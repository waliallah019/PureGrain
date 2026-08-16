"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSampleTrayVisible } from "@/hooks/use-sample-tray-visible";

export function FloatingSamplesSticker() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isFooterInView, setIsFooterInView] = useState(false);

  const isCustomerFacingRoute = useMemo(() => {
    if (!pathname) return false;
    return !pathname.startsWith("/admin-ahmza") && !pathname.startsWith("/admin-login");
  }, [pathname]);

  const isHomePage = pathname === "/";
  const trayVisible = useSampleTrayVisible();

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

  // Bottom-LEFT corner. WhatsApp owns bottom-right; splitting them across the
  // two corners keeps each one a single, unambiguous target instead of a stacked
  // pair crowding one side.
  //
  // Sizes step with the breakpoint so the badge stays proportionate: it should
  // read as a peer of the 44/52px WhatsApp FAB, not dominate the viewport. On a
  // 375px screen 64px is ~17% of the width, which is about the practical ceiling
  // for a persistent floating badge.
  //   <640px : 64px   640-1023px : 76px   >=1024px : 88px
  //
  // The sample-tray bar is a full-width fixed bar along the bottom, so when it
  // is showing the badge lifts above it — the same clearance WhatsAppButton
  // applies. Done as an inline style rather than an arbitrary Tailwind class
  // because `calc()` containing `env(...)` (and therefore a comma) is fragile to
  // pass through Tailwind's arbitrary-value parser; inline also beats the
  // `bottom-4 sm:bottom-6` utilities without needing `!important`.
  // 64px is the desktop bar height and safely clears the 56px mobile one too.
  const trayClearance = "calc(64px + env(safe-area-inset-bottom, 0px) + 16px)";

  return (
    <div
      className={`fixed left-4 z-40 transition-all duration-300 sm:left-6 ${
        trayVisible ? "" : "bottom-4 sm:bottom-6"
      } ${
        isVisible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
      style={trayVisible ? { bottom: trayClearance } : undefined}
      aria-hidden={!isVisible}
    >
      <Link href="/request-sample/pay" aria-label="Get free samples" className="relative block">
        {/* Glow tinted to the brand brass rather than red/amber, so the halo
            reads as part of the palette even though the sticker artwork is red. */}
        <span
          className="absolute inset-2 -z-10 scale-110 animate-pulse rounded-full bg-gradient-to-br from-brass/55 via-brass/35 to-accent/40 blur-xl"
          aria-hidden="true"
        />
        <Image
          src="/sticker.png"
          alt="Free Samples"
          width={112}
          height={112}
          className="h-16 w-16 object-contain drop-shadow-xl transition-transform hover:scale-105 sm:h-[76px] sm:w-[76px] lg:h-[88px] lg:w-[88px]"
          priority={false}
        />
      </Link>
    </div>
  );
}
