// components/sample-request/SampleTrayBar.tsx
"use client";

/**
 * SampleTrayBar
 * -------------
 * Persistent fixed bottom bar that surfaces the user's sample tray on the
 * hide catalog and hide detail pages. Hidden when the tray is empty.
 *
 * Visual language matches the existing site palette:
 *   - background: --primary (#2C1810)
 *   - accents:    --brass   (#C9943A)
 *
 * Mobile collapses the middle "selected hides" tag list and shows only the
 * count + CTA, per spec.
 */

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  SAMPLE_TRAY_LIMIT,
  useSampleTrayStore,
} from "@/lib/stores/sampleTrayStore";

export default function SampleTrayBar() {
  const [hydrated, setHydrated] = useState(false);
  const items = useSampleTrayStore((s) => s.items);
  const removeHide = useSampleTrayStore((s) => s.removeHide);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Don't render anything until we've hydrated from localStorage.
  // This avoids a flash of empty/full state mismatching the server HTML.
  if (!hydrated) return null;

  const visible = items.length > 0;
  const isFull = items.length >= SAMPLE_TRAY_LIMIT;

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          role="region"
          aria-label="Sample tray"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-brass/40 bg-[hsl(var(--primary))] text-primary-foreground shadow-[0_-8px_30px_rgba(0,0,0,0.18)]"
        >
          <div className="container-wide flex flex-wrap items-center gap-3 px-4 py-3 md:flex-nowrap md:gap-6 md:px-6 md:py-4">
            {/* LEFT — count pill */}
            <div className="flex shrink-0 items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brass/20 text-brass">
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="rounded-full bg-brass/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-brass">
                {items.length} of {SAMPLE_TRAY_LIMIT} hides selected
              </span>
            </div>

            {/* MIDDLE — selected hides as removable tags (desktop only) */}
            <div className="hidden min-w-0 flex-1 flex-wrap items-center gap-2 md:flex">
              {items.map((it) => (
                <span
                  key={it.productId}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs"
                  title={it.productName}
                >
                  <span className="max-w-[14ch] truncate">{it.productName}</span>
                  <button
                    type="button"
                    onClick={() => removeHide(it.productId)}
                    aria-label={`Remove ${it.productName}`}
                    className="text-white/60 hover:text-brass focus:outline-none"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* RIGHT — CTA */}
            <div className="ml-auto flex shrink-0 items-center gap-3">
              {isFull && (
                <span className="hidden text-xs text-brass/90 md:inline">
                  Tray full — review your selection
                </span>
              )}
              <Link
                href="/sample-request/review?type=HIDE"
                className="inline-flex items-center justify-center bg-brass px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-brass-foreground transition-colors duration-200 hover:bg-brass/90 md:px-7 md:py-3 md:text-sm"
              >
                Review Sample Request
                <span className="ml-2" aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
