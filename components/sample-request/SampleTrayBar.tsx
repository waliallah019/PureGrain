// components/sample-request/SampleTrayBar.tsx
"use client";

/**
 * SampleTrayBar
 * -------------
 * Persistent fixed bottom bar that surfaces the user's sample tray. Mounted
 * once globally in the root layout, so it follows the user across every
 * customer page until they check out or empty the tray. Hidden when the tray
 * is empty and on the checkout flow / admin area (see useSampleTrayVisible).
 *
 * Visual language matches the existing site palette:
 *   - background: --primary (#2C1810)
 *   - accents:    --brass   (#C9943A)
 *
 * Mobile collapses the middle "selected hides" tag list and shows only the
 * count + CTA, per spec.
 */

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, ShoppingBag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  SAMPLE_TRAY_LIMIT,
  useSampleTrayStore,
  type SampleTrayState,
} from "@/lib/stores/sampleTrayStore";
import { useSampleTrayVisible } from "@/hooks/use-sample-tray-visible";

const REVIEW_ROUTE = "/sample-request/review?type=HIDE";

export default function SampleTrayBar() {
  const [hydrated, setHydrated] = useState(false);
  const items = useSampleTrayStore((s: SampleTrayState) => s.items);
  const removeHide = useSampleTrayStore((s: SampleTrayState) => s.removeHide);
  const shouldShow = useSampleTrayVisible();

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Warm the review route so navigation paints quickly on click.
  useEffect(() => {
    router.prefetch(REVIEW_ROUTE);
  }, [router]);

  // BUG-1: instant feedback, then navigate immediately. No blocking work
  // (no fetch / no serialization / no await) runs before the push.
  const handleProceed = () => {
    setNavigating(true);
    startTransition(() => {
      router.push(REVIEW_ROUTE);
    });
  };

  // Don't render until we've hydrated from localStorage (avoids a flash of
  // empty/full state mismatching the server HTML), or on a hidden route /
  // empty tray (both covered by useSampleTrayVisible).
  if (!hydrated) return null;

  const visible = shouldShow;
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
          className="fixed inset-x-0 bottom-0 z-50 border-t border-brass bg-[hsl(var(--primary))] text-primary-foreground shadow-[0_-4px_20px_rgba(0,0,0,0.3)] pb-[env(safe-area-inset-bottom)]"
        >
          <div className="container-wide flex h-14 flex-nowrap items-center justify-between gap-3 px-4 md:h-16 md:gap-6 md:px-6">
            {/* LEFT — count pill */}
            <div className="flex shrink-0 items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brass/20 text-brass">
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="whitespace-nowrap rounded-full bg-brass px-3 py-1 text-xs font-semibold text-brass-foreground md:text-[13px]">
                {items.length} of {SAMPLE_TRAY_LIMIT} hides selected
              </span>
            </div>

            {/* MIDDLE — selected hides as removable tags (desktop only) */}
            <div className="hidden min-w-0 flex-1 items-center gap-2 overflow-hidden px-4 md:flex">
              {items.map((it) => (
                <span
                  key={it.productId}
                  className="inline-flex max-w-[120px] items-center gap-2 whitespace-nowrap rounded-xl border border-brass/40 bg-brass/15 px-2.5 py-1 text-xs text-primary-foreground"
                  title={it.productName}
                >
                  <span className="truncate">{it.productName}</span>
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
            <div className="flex shrink-0 items-center gap-3">
              {isFull && (
                <span className="hidden text-xs text-brass/90 md:inline">
                  Tray full — review your selection
                </span>
              )}
              <button
                type="button"
                onClick={handleProceed}
                disabled={navigating || isPending}
                aria-busy={navigating || isPending}
                className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-brass px-3.5 py-2 text-[13px] font-semibold text-brass-foreground transition-colors duration-200 hover:bg-accent hover:text-primary-foreground disabled:cursor-wait disabled:opacity-80 md:px-5 md:py-2.5 md:text-sm"
              >
                {navigating || isPending ? (
                  <>
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Loading...
                  </>
                ) : (
                  <>
                    Review Sample Request
                    <span aria-hidden="true">&rarr;</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
