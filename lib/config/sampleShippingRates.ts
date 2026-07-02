// lib/config/sampleShippingRates.ts
//
// Canonical per-country DHL Express sample-shipping rates for the unified
// sample-request review flow. This is the SINGLE SOURCE OF TRUTH shared by:
//
//   - scripts/seedShippingRates.ts            (seeds the ShippingRate collection)
//   - app/sample-request/review               (country dropdown — priced only)
//   - lib/services/sampleShippingService.ts   (runtime fallback when the DB
//                                              collection has not been seeded)
//
// Keeping the dropdown and the pricing in one place guarantees that every
// selectable country has a rate. That is the root-cause fix for the
// "shipping never calculates / PayPal button never appears" bug: the old
// dropdown listed ~50 countries while only these 22 were ever priced.

export interface SampleShippingRate {
  country: string;
  rateUsd: number;
  transitDays: string;
  dhlZone: string;
  region: string;
}

export const SAMPLE_SHIPPING_RATES: SampleShippingRate[] = [
  { country: "Italy", rateUsd: 195, transitDays: "2-3 business days", dhlZone: "Zone 3", region: "Europe" },
  { country: "Germany", rateUsd: 195, transitDays: "2-3 business days", dhlZone: "Zone 3", region: "Europe" },
  { country: "France", rateUsd: 195, transitDays: "2-3 business days", dhlZone: "Zone 3", region: "Europe" },
  { country: "Spain", rateUsd: 195, transitDays: "2-3 business days", dhlZone: "Zone 3", region: "Europe" },
  { country: "Netherlands", rateUsd: 195, transitDays: "2-3 business days", dhlZone: "Zone 3", region: "Europe" },
  { country: "Belgium", rateUsd: 195, transitDays: "2-3 business days", dhlZone: "Zone 3", region: "Europe" },
  { country: "Poland", rateUsd: 210, transitDays: "3-4 business days", dhlZone: "Zone 3", region: "Europe" },
  { country: "United Kingdom", rateUsd: 185, transitDays: "2-3 business days", dhlZone: "Zone 2", region: "Europe" },
  { country: "Turkey", rateUsd: 185, transitDays: "1-2 business days", dhlZone: "Zone 1", region: "Middle East" },
  { country: "United Arab Emirates", rateUsd: 175, transitDays: "1-2 business days", dhlZone: "Zone 1", region: "Middle East" },
  { country: "Saudi Arabia", rateUsd: 175, transitDays: "1-2 business days", dhlZone: "Zone 1", region: "Middle East" },
  { country: "Qatar", rateUsd: 175, transitDays: "1-2 business days", dhlZone: "Zone 1", region: "Middle East" },
  { country: "Kuwait", rateUsd: 175, transitDays: "1-2 business days", dhlZone: "Zone 1", region: "Middle East" },
  { country: "China", rateUsd: 215, transitDays: "2-3 business days", dhlZone: "Zone 5", region: "Asia" },
  { country: "Japan", rateUsd: 220, transitDays: "2-3 business days", dhlZone: "Zone 5", region: "Asia" },
  { country: "South Korea", rateUsd: 220, transitDays: "2-3 business days", dhlZone: "Zone 5", region: "Asia" },
  { country: "United States", rateUsd: 245, transitDays: "3-5 business days", dhlZone: "Zone 7", region: "North America" },
  { country: "Canada", rateUsd: 245, transitDays: "3-5 business days", dhlZone: "Zone 7", region: "North America" },
  { country: "Australia", rateUsd: 250, transitDays: "3-5 business days", dhlZone: "Zone 6", region: "Oceania" },
  { country: "New Zealand", rateUsd: 255, transitDays: "4-5 business days", dhlZone: "Zone 6", region: "Oceania" },
  { country: "South Africa", rateUsd: 310, transitDays: "4-6 business days", dhlZone: "Zone 8", region: "Africa" },
  { country: "Brazil", rateUsd: 320, transitDays: "5-7 business days", dhlZone: "Zone 8", region: "South America" },
];

const RATE_BY_COUNTRY = new Map<string, SampleShippingRate>(
  SAMPLE_SHIPPING_RATES.map((r) => [r.country.toLowerCase(), r])
);

// Alphabetically sorted list of the ONLY countries that may be selected in
// the review dropdown — each is guaranteed to have a rate above.
export const SAMPLE_SHIPPING_COUNTRIES: string[] = SAMPLE_SHIPPING_RATES.map(
  (r) => r.country
).sort((a, b) => a.localeCompare(b));

// Case-insensitive lookup used as the runtime fallback when the ShippingRate
// collection has not been seeded.
export function getSampleShippingRate(
  country: string
): SampleShippingRate | null {
  if (!country) return null;
  return RATE_BY_COUNTRY.get(country.trim().toLowerCase()) ?? null;
}
