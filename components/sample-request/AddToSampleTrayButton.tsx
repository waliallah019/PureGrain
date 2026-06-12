// components/sample-request/AddToSampleTrayButton.tsx
"use client";

/**
 * AddToSampleTrayButton
 * ---------------------
 * The hide-product sample CTA. Has three states matching the spec:
 *   1. Default       — outlined-gold "+ Add to sample tray"
 *   2. Added to tray — filled-green   "✓ In your tray" (clicking removes)
 *   3. Tray full     — disabled grey  "Tray full" (with tooltip)
 *
 * Uses the persisted Zustand `useSampleTrayStore`. Hydration-safe: until
 * the store rehydrates from localStorage we render the default state to
 * avoid SSR/CSR mismatch warnings.
 */

import { useEffect, useState } from "react";
import { Check, Plus } from "lucide-react";
import {
  SAMPLE_TRAY_LIMIT,
  useSampleTrayStore,
  type SampleTrayItem,
} from "@/lib/stores/sampleTrayStore";

interface AddToSampleTrayButtonProps {
  hide: SampleTrayItem;
  className?: string;
  /**
   * Stop click propagation. Useful when the button is rendered inside a
   * parent <Link> wrapping the entire product card.
   */
  stopPropagation?: boolean;
}

export default function AddToSampleTrayButton({
  hide,
  className = "",
  stopPropagation = false,
}: AddToSampleTrayButtonProps) {
  const [hydrated, setHydrated] = useState(false);
  const items = useSampleTrayStore((s) => s.items);
  const addHide = useSampleTrayStore((s) => s.addHide);
  const removeHide = useSampleTrayStore((s) => s.removeHide);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const inTray = hydrated && items.some((i) => i.productId === hide.productId);
  const trayFull = hydrated && items.length >= SAMPLE_TRAY_LIMIT;

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (inTray) {
      removeHide(hide.productId);
    } else if (!trayFull) {
      addHide(hide);
    }
  };

  // ---- Visual states ------------------------------------------------------
  // We keep the same sizing as `.btn-brass` so the button slots into the
  // existing CTA rows without disturbing layout.
  const baseClasses =
    "inline-flex items-center justify-center px-8 py-4 font-medium text-sm tracking-wide uppercase transition-all duration-300 disabled:cursor-not-allowed";

  if (inTray) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`${baseClasses} bg-emerald-700 text-white hover:bg-emerald-800 ${className}`}
        aria-label="Remove from sample tray"
      >
        <Check className="mr-2 h-4 w-4" />
        In your tray
      </button>
    );
  }

  if (trayFull) {
    return (
      <button
        type="button"
        disabled
        title="You have selected 3 hides. Review your tray to proceed."
        className={`${baseClasses} bg-muted text-muted-foreground border border-border ${className}`}
        aria-disabled="true"
      >
        Tray full
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseClasses} border border-brass text-brass bg-transparent hover:bg-brass hover:text-brass-foreground ${className}`}
      aria-label="Add to sample tray"
    >
      <Plus className="mr-2 h-4 w-4" />
      Add to sample tray
    </button>
  );
}
