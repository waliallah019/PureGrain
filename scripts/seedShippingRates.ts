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
import { SAMPLE_SHIPPING_RATES } from "../lib/config/sampleShippingRates";

// The seed rows are the single source of truth shared with the app runtime
// (the review dropdown and the create/capture pricing fallback). Editing a
// rate in `lib/config/sampleShippingRates.ts` keeps seed and app in sync.
const RATES = SAMPLE_SHIPPING_RATES;

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
