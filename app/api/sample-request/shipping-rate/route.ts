// app/api/sample-request/shipping-rate/route.ts
//
// Public lookup for the per-country DHL Express shipping rate used by the
// new sample-request review flow. Reads from the `ShippingRate` collection
// seeded via `scripts/seedShippingRates.ts`.
//
// Response shape:
//   { success: true,  data:  { country, region, dhlZone, rateUsd, transitDays } }
//   { success: true,  found: false }                   // unknown country
//   { success: false, message: string }                // hard failure
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/config/db";
import ShippingRate from "@/lib/models/ShippingRate";
import logger from "@/lib/config/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const country = (req.nextUrl.searchParams.get("country") || "").trim();
  if (!country) {
    return NextResponse.json(
      { success: false, message: "Missing 'country' query parameter." },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    const rate = await ShippingRate.findOne({
      country: { $regex: `^${escapeRegExp(country)}$`, $options: "i" },
      isActive: true,
    }).lean<any>();

    if (!rate) {
      return NextResponse.json({ success: true, found: false });
    }

    return NextResponse.json({
      success: true,
      found: true,
      data: {
        country: rate.country,
        region: rate.region,
        dhlZone: rate.dhlZone,
        rateUsd: rate.rateUsd,
        transitDays: rate.transitDays,
      },
    });
  } catch (err: any) {
    logger.error("[sample-request/shipping-rate] failed", err);
    return NextResponse.json(
      { success: false, message: "Could not look up shipping rate." },
      { status: 500 }
    );
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
