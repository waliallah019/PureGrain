// scripts/seedShippingRates.ts
//
// Seeds the ShippingRate collection with the per-country DHL Express rates
// used by the new sample-request review flow.
//
// Usage:
//   pnpm tsx scripts/seedShippingRates.ts
//   # or
//   npx tsx scripts/seedShippingRates.ts
//
// The script is idempotent — it upserts by country.
import "dotenv/config";
import mongoose from "mongoose";
import ShippingRate from "../lib/models/ShippingRate";

interface SeedRow {
  country: string;
  rateUsd: number;
  transitDays: string;
  dhlZone: string;
  region: string;
}

const RATES: SeedRow[] = [
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

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set. Aborting.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`[seed] Connected to MongoDB`);

  let upserted = 0;
  for (const r of RATES) {
    await ShippingRate.updateOne(
      { country: r.country },
      { $set: { ...r, isActive: true } },
      { upsert: true }
    );
    upserted += 1;
  }
  console.log(`[seed] Upserted ${upserted} shipping rates`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
