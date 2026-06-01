"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsVisible(window.scrollY > 420);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className={`fixed left-4 bottom-5 sm:left-6 sm:bottom-7 z-40 h-11 w-11 rounded-full border border-brass/50 bg-background/95 text-brass shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-brass/10 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <ChevronUp className="mx-auto h-5 w-5" />
    </button>
  );
}
