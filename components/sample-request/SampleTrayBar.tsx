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
import { Loader2, ShoppingBag, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  SAMPLE_TRAY_LIMIT,
  useSampleTrayStore,
  type SampleTrayState,
} from "@/lib/stores/sampleTrayStore";

// Routes where the tray bar must never appear: the review/checkout flow, the
// post-payment success screen, the legacy pay page, and the admin area.
const HIDDEN_ON_ROUTES = [
  "/sample-request/review",
  "/sample-request/success",
  "/request-sample/pay",
  "/admin-ahmza",
];

const REVIEW_ROUTE = "/sample-request/review?type=HIDE";

export default function SampleTrayBar() {
  const [hydrated, setHydrated] = useState(false);
  const items = useSampleTrayStore((s: SampleTrayState) => s.items);
  const removeHide = useSampleTrayStore((s: SampleTrayState) => s.removeHide);

  const pathname = usePathname();
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

  // BUG-2 guard (defence-in-depth): never show the bar in the checkout flow
  // or admin area, even if a page mounts it directly.
  const hideOnRoute = HIDDEN_ON_ROUTES.some((r) => pathname?.startsWith(r));

  // Don't render until we've hydrated from localStorage (avoids a flash of
  // empty/full state mismatching the server HTML), or on a hidden route.
  if (!hydrated || hideOnRoute) return null;

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
              <button
                type="button"
                onClick={handleProceed}
                disabled={navigating || isPending}
                aria-busy={navigating || isPending}
                className="inline-flex items-center justify-center bg-brass px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-brass-foreground transition-colors duration-200 hover:bg-brass/90 disabled:cursor-wait disabled:opacity-90 md:px-7 md:py-3 md:text-sm"
              >
                {navigating || isPending ? (
                  <>
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    Opening review…
                  </>
                ) : (
                  <>
                    Review Sample Request
                    <span className="ml-2" aria-hidden="true">
                      &rarr;
                    </span>
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
