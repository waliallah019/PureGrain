// scripts/updateFinishedProductPricing.ts
//
// Phase 1 — pricing only. Sets research-derived OEM wholesale pricing with a
// three-tier quantity structure on every FinishedProduct.
//
// Usage:
//   npx tsx scripts/updateFinishedProductPricing.ts --dry-run
//   npx tsx scripts/updateFinishedProductPricing.ts
//   npx tsx scripts/updateFinishedProductPricing.ts --type="Leather Jackets"
//
// IMPORTANT — why the native driver is used for the write:
// `priceTier` is not declared on the FinishedProduct schema (it exists on
// RawLeather, not here). Mongoose strict mode silently drops unknown paths from
// an update, so writing tiers through the model would report success and store
// nothing. Writing through the native collection persists the field without
// touching lib/models/FinishedProduct.ts, which Phase 1 forbids.
//
// Phase 2 must add `priceTier` to the schema — until then the API will not
// return it, because Mongoose omits non-schema paths from hydrated documents.
//
// Only pricePerUnit and priceTier are written. currency, priceUnit, moq and
// every other field are left untouched.
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(PROJECT_ROOT, ".env.local") });

const BATCH_SIZE = 20;

// ────────────────────── research-derived base prices ─────────────────
//
// Tier 2 (100–499 units) per product type, in USD. Each figure is the
// mid-point of the wholesale bands found for Pakistani/Indian/Chinese
// suppliers, held above estimated Pakistani manufacturing cost by at least
// ~35%. See the research summary for per-type sourcing and reasoning.
const BASE_TIER2: Record<string, number> = {
  "Motorcycle Suit": 165, // PK textile suits $200–250/set; undercuts the band
  "Biker Jackets": 85,    // PK biker FOB $70–120 mid-range
  "Leather Jackets": 70,  // PK fashion jacket FOB $55–90 mid-range
  "Motorcyle Jacket": 52, // textile/Cordura: PK $24–33 commodity, $85 CE-ready
  "Duffle Bag": 52,       // PK leather duffle $41–54
  "Backpack": 42,         // above the $8.90 Chinese corrected-leather floor
  "Motorcycle Pants": 38, // ~60% of a textile jacket, per suit/jacket split
  "Belt": 14,             // material + hardware led; no reliable public band
  "Wallet": 12,           // above $1.41–8.73 commodity, below $18–22 branded
  "Purse": 7.5,           // coin purses $1.50–3.00 commodity floor
};

/** Fallback for any type not in the table. */
const DEFAULT_TIER2 = 40;

// ── tier multipliers ──
const TIER1_MULTIPLIER = 1.2;  // 50–99 units, +20%
const TIER3_MULTIPLIER = 0.85; // 500+ units, −15%

// ── premium modifiers, matched against name + description ──
const PREMIUM_RULES: Array<{ re: RegExp; pct: number; label: string }> = [
  { re: /\b(waterproof|armou?red|protective|ce[- ]armou?r)\b/i, pct: 0.17, label: "protective/armored" },
  { re: /\b(designer|signature|limited)\b/i, pct: 0.2, label: "designer/signature" },
  { re: /\b(full[- ]grain|premium|handcrafted|handmade)\b/i, pct: 0.12, label: "full-grain/premium" },
  { re: /\b(vintage|distressed|aged)\b/i, pct: 0.08, label: "vintage/distressed" },
];

/** Stacked modifiers are capped so a name hitting every rule stays sane. */
const PREMIUM_CAP = 0.35;

const log = {
  start: (m: string) => console.log(`[START]    ${m}`),
  batch: (m: string) => console.log(`\n[BATCH]    ${m}`),
  product: (m: string) => console.log(`[PRODUCT]  ${m}`),
  type: (m: string) => console.log(`[TYPE]     ${m}`),
  premium: (m: string) => console.log(`[PREMIUM]  ${m}`),
  current: (m: string) => console.log(`[CURRENT]  ${m}`),
  tiers: (m: string) => console.log(`[TIERS]    ${m}`),
  db: (m: string) => console.log(`[DB]       ✓ ${m}`),
  warn: (m: string) => console.log(`[WARN]     ⚠  ${m}`),
  error: (m: string) => console.log(`[ERROR]    ✗  ${m}`),
};

function errText(err: any): string {
  if (!err) return "unknown error";
  if (typeof err === "string") return err;
  if (err.message) return err.message;
  try { return JSON.stringify(err); } catch { return String(err); }
}

/**
 * Under $20 → nearest $0.50; $20–$60 → nearest $1; over $60 → nearest $5.
 * Applied to every tier independently so each lands on a clean quotable value.
 */
export function roundPrice(v: number): number {
  if (!Number.isFinite(v) || v <= 0) return 0;
  if (v < 20) return Math.round(v * 2) / 2;
  if (v <= 60) return Math.round(v);
  return Math.round(v / 5) * 5;
}

export interface PremiumResult { pct: number; labels: string[] }

export function premiumFor(name: string, description: string): PremiumResult {
  const blob = `${name} ${description}`;
  const labels: string[] = [];
  let pct = 0;
  for (const r of PREMIUM_RULES) {
    if (r.re.test(blob)) { pct += r.pct; labels.push(`${r.label} +${Math.round(r.pct * 100)}%`); }
  }
  if (pct > PREMIUM_CAP) {
    labels.push(`capped at +${Math.round(PREMIUM_CAP * 100)}%`);
    pct = PREMIUM_CAP;
  }
  return { pct, labels };
}

export interface Tiers { tier1: number; tier2: number; tier3: number; base: number; premiumPct: number }

export function computeTiers(productType: string, name: string, description: string): Tiers {
  const base = BASE_TIER2[productType] ?? DEFAULT_TIER2;
  const { pct } = premiumFor(name, description);

  const adjusted = base * (1 + pct);
  const tier2 = roundPrice(adjusted);
  const tier1 = roundPrice(tier2 * TIER1_MULTIPLIER);
  let tier3 = roundPrice(tier2 * TIER3_MULTIPLIER);

  // Rounding can collapse the bulk tier onto tier 2 at low values; step it
  // down so the discount is always real.
  if (tier3 >= tier2) tier3 = roundPrice(tier2 - (tier2 < 20 ? 0.5 : tier2 <= 60 ? 1 : 5));

  return { tier1, tier2, tier3, base, premiumPct: pct };
}

async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const typeArg = args.find((a) => a.startsWith("--type="));
  const onlyType = typeArg ? typeArg.split("=").slice(1).join("=").replace(/^["']|["']$/g, "") : "";

  const { default: connectDB } = await import("../lib/config/db");
  const mongoose = (await import("mongoose")).default;
  await connectDB();

  // Native collection — see the note at the top of this file.
  const col = mongoose.connection.db!.collection("finishedproducts");

  const query: Record<string, unknown> = {};
  if (onlyType) query.productType = onlyType;

  const docs = await col.find(query).sort({ _id: 1 }).toArray();
  log.start(`${docs.length} products to price${onlyType ? ` (type: "${onlyType}")` : ""}${dryRun ? "  (DRY RUN)" : ""}`);

  const stats = { processed: 0, updated: 0, failed: 0, premiumApplied: 0 };
  const perType: Record<string, { n: number; t1: number; t2: number; t3: number }> = {};
  const shownPerType: Record<string, number> = {};

  const totalBatches = Math.max(1, Math.ceil(docs.length / BATCH_SIZE));
  for (let b = 0; b < totalBatches; b++) {
    const slice = docs.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    if (!slice.length) break;
    log.batch(`Batch ${b + 1}/${totalBatches}`);

    for (const doc of slice) {
      stats.processed++;
      const type = String(doc.productType || "");
      try {
        if (!(type in BASE_TIER2)) {
          log.warn(`"${doc.name}" — unmapped product type "${type}", using default $${DEFAULT_TIER2}`);
        }

        const prem = premiumFor(String(doc.name || ""), String(doc.description || ""));
        const t = computeTiers(type, String(doc.name || ""), String(doc.description || ""));
        if (prem.pct > 0) stats.premiumApplied++;

        const priceTier = [
          { minQty: 50, price: t.tier1 },
          { minQty: 100, price: t.tier2 },
          { minQty: 500, price: t.tier3 },
        ];

        // Show a detailed block for the first three of each type.
        const seen = shownPerType[type] || 0;
        if (seen < 3) {
          shownPerType[type] = seen + 1;
          log.product(String(doc.name));
          log.type(type);
          log.premium(
            prem.pct > 0
              ? `+${Math.round(prem.pct * 100)}% (${prem.labels.join(", ")})  base $${t.base} → $${(t.base * (1 + prem.pct)).toFixed(2)}`
              : `+0% (no premium indicators)  base $${t.base}`
          );
          log.current(`$${doc.pricePerUnit} → tier pricing`);
          log.tiers(`50: $${t.tier1.toFixed(2)} | 100: $${t.tier2.toFixed(2)} | 500: $${t.tier3.toFixed(2)}`);
        }

        if (!dryRun) {
          await col.updateOne(
            { _id: doc._id },
            { $set: { pricePerUnit: t.tier2, priceTier } }
          );
          if (seen < 3) log.db(`Updated: ${doc.name}`);
        }

        const agg = (perType[type] = perType[type] || { n: 0, t1: 0, t2: 0, t3: 0 });
        agg.n++; agg.t1 += t.tier1; agg.t2 += t.tier2; agg.t3 += t.tier3;
        stats.updated++;
      } catch (err: any) {
        stats.failed++;
        log.error(`${doc.name} — ${errText(err)}`);
      }
    }
  }

  if (dryRun) console.log("\n[DRY RUN]  No changes written to database");
  await mongoose.disconnect();

  const row = (l: string, v: string | number) => `║ ${l.padEnd(26)}${String(v).padEnd(21)}║`;
  const types = Object.keys(perType).sort((a, b) => perType[b].n - perType[a].n);

  console.log(`
╔═══════════════════════════════════════════════╗
║  PURE GRAIN EXPORTS — PRICING ${dryRun ? "DRY RUN  " : "UPDATE   "}      ║
╠═══════════════════════════════════════════════╣
${row("Total products updated:", stats.updated)}
${row("Product types priced:", types.length)}
${row("Failed:", stats.failed)}
╠═══════════════════════════════════════════════╣
║ Average tier pricing per type (50 / 100 / 500)║
${types
  .map((t) => {
    const a = perType[t];
    return row(`  ${t}:`, `$${(a.t1 / a.n).toFixed(2)} / $${(a.t2 / a.n).toFixed(2)} / $${(a.t3 / a.n).toFixed(2)}`);
  })
  .join("\n")}
╠═══════════════════════════════════════════════╣
${row("Premium adjustments:", `${stats.premiumApplied} products`)}
║ All prices in USD                             ║
║ All products have 3-tier pricing structure    ║
╚═══════════════════════════════════════════════╝`);

  process.exit(0);
}

run().catch((err) => {
  log.error(`Pricing update aborted: ${errText(err)}`);
  console.error(err);
  process.exit(1);
});
