// lib/currency/exchangeRates.ts
// Server-side fetch + module-level in-memory cache for USD-base exchange rates.

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  GBP: 0.79,
  EUR: 0.92,
  PKR: 278,
  CAD: 1.36,
  AUD: 1.53,
  AED: 3.67,
  SAR: 3.75,
  ZAR: 18.6,
  NGN: 1550,
  KES: 129,
  CNY: 7.24,
  JPY: 149,
  INR: 83.1,
  TRY: 32.1,
  BRL: 4.97,
};

interface RatesCache {
  rates: Record<string, number>;
  fetchedAt: number;
}

let cache: RatesCache | null = null;

export async function getRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rates;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: controller.signal,
      // Use Next.js fetch revalidate as a second layer of caching
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Rates API ${res.status}`);

    const data = (await res.json()) as {
      rates?: Record<string, number>;
      result?: string;
    };

    if (!data?.rates || data.result === "error") {
      throw new Error("Invalid rates payload");
    }

    // Always pin USD = 1
    const rates = { ...data.rates, USD: 1 };
    cache = { rates, fetchedAt: now };
    return rates;
  } catch {
    // Use fallback but do not cache it as fresh — let next call retry sooner.
    if (cache) return cache.rates;
    return { ...FALLBACK_RATES };
  }
}

export function getCachedAt(): number | null {
  return cache?.fetchedAt ?? null;
}
