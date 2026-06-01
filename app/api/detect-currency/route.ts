// app/api/detect-currency/route.ts
import { NextRequest, NextResponse } from "next/server";

const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  US: "USD",
  GB: "GBP",
  // Eurozone
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR",
  BE: "EUR", AT: "EUR", PT: "EUR", IE: "EUR", FI: "EUR",
  GR: "EUR", LU: "EUR", SK: "EUR", SI: "EUR", EE: "EUR",
  LV: "EUR", LT: "EUR", MT: "EUR", CY: "EUR", HR: "EUR",
  // Rest
  PK: "PKR", CA: "CAD", AU: "AUD",
  AE: "AED", SA: "SAR", ZA: "ZAR",
  NG: "NGN", KE: "KES", CN: "CNY",
  JP: "JPY", IN: "INR", TR: "TRY", BR: "BRL",
};

const PRIVATE_IP_RE =
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc|fd)/i;

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  return "127.0.0.1";
}

function isPrivateIp(ip: string): boolean {
  return PRIVATE_IP_RE.test(ip) || ip === "127.0.0.1" || ip === "::1";
}

export async function GET(req: NextRequest) {
  const fallback = NextResponse.json(
    { currency: "USD", country: "US" },
    { headers: { "Cache-Control": "no-store" } }
  );

  try {
    const ip = getClientIp(req);

    if (isPrivateIp(ip)) {
      return fallback;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=countryCode`,
      { signal: controller.signal, cache: "no-store" }
    );
    clearTimeout(timeout);

    if (!res.ok) return fallback;

    const data = (await res.json()) as { countryCode?: string };
    const country = (data.countryCode || "").toUpperCase();
    const currency = COUNTRY_CURRENCY_MAP[country] || "USD";

    return NextResponse.json(
      { currency, country: country || "US" },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return fallback;
  }
}
