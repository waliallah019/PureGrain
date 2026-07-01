// lib/services/sampleShippingService.ts
//
// Resolves the sample-shipping amount for a country. Used by BOTH
// `create-order` and `capture-order` so the amount the buyer is CHARGED and
// the amount the server VERIFIES can never drift apart. (Previously
// create-order priced from the ShippingRate DB while capture-order priced
// from the legacy continent table — so every new-flow payment was captured
// and then rejected with a 409, charging the buyer without saving a record.)
//
// Resolution order:
//   1. Seeded `ShippingRate` collection (authoritative, admin-editable).
//   2. Bundled static table in `lib/config/sampleShippingRates.ts`
//      (so the feature works even before the collection is seeded).
import connectDB from "@/lib/config/db";
import ShippingRate from "@/lib/models/ShippingRate";
import { getSampleShippingRate } from "@/lib/config/sampleShippingRates";

export interface ResolvedSampleShipping {
  amount: number;
  region: string;
  source: "db" | "static";
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function resolveSampleShippingAmount(
  country: string
): Promise<ResolvedSampleShipping | null> {
  const trimmed = (country || "").trim();
  if (!trimmed) return null;

  await connectDB();
  const rate = await ShippingRate.findOne({
    country: { $regex: `^${escapeRegExp(trimmed)}$`, $options: "i" },
    isActive: true,
  }).lean<any>();

  if (rate) {
    return { amount: rate.rateUsd, region: rate.region, source: "db" };
  }

  const fallback = getSampleShippingRate(trimmed);
  if (fallback) {
    return { amount: fallback.rateUsd, region: fallback.region, source: "static" };
  }

  return null;
}
