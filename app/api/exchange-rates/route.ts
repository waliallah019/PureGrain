// app/api/exchange-rates/route.ts
import { NextResponse } from "next/server";
import { getRates, getCachedAt, FALLBACK_RATES } from "@/lib/currency/exchangeRates";

export async function GET() {
  try {
    const rates = await getRates();
    const cachedAtMs = getCachedAt();
    const cachedAt = cachedAtMs ? new Date(cachedAtMs).toISOString() : new Date().toISOString();

    return NextResponse.json(
      { rates, base: "USD", cachedAt },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { rates: FALLBACK_RATES, base: "USD", cachedAt: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      }
    );
  }
}
