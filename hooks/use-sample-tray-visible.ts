"use client";

import { usePathname } from "next/navigation";
import { useSampleTrayStore } from "@/lib/stores/sampleTrayStore";

/**
 * Routes where the sample tray bar must never appear: the review/checkout
 * flow, the post-payment success screen, the legacy pay page, and the admin
 * area. Single source of truth, shared with anything (like the WhatsApp
 * button) that needs to react to the tray bar's presence.
 */
export const SAMPLE_TRAY_HIDDEN_ROUTES = [
  "/sample-request/review",
  "/sample-request/success",
  "/request-sample/pay",
  "/admin-ahmza",
];

/** True exactly when <SampleTrayBar /> is rendering its bar. */
export function useSampleTrayVisible(): boolean {
  const itemCount = useSampleTrayStore((s) => s.items.length);
  const pathname = usePathname();
  const hiddenOnRoute = SAMPLE_TRAY_HIDDEN_ROUTES.some((r) => pathname?.startsWith(r));
  return itemCount > 0 && !hiddenOnRoute;
}
