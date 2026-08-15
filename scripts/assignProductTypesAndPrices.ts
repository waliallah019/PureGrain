// scripts/assignProductTypesAndPrices.ts
//
// 1. Re-assigns every FinishedProduct to one of the product types registered in
//    the `producttypes` collection, decided from what the article actually is.
//    This matters beyond tidiness: ProductForm rejects any productType that is
//    not registered ("Invalid Product Type"), so a product carrying an
//    unregistered value cannot be saved from the admin panel at all.
//
// 2. Restores the scraped per-unit price on the Surgexa range, which was
//    replaced by banded pricing.
//
// Usage:
//   npx tsx scripts/assignProductTypesAndPrices.ts --dry-run
//   npx tsx scripts/assignProductTypesAndPrices.ts
//   npx tsx scripts/assignProductTypesAndPrices.ts --types-only
//
// Only productType, category and pricePerUnit are written. Names, images,
// descriptions, MOQ, colours and flags are untouched.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(PROJECT_ROOT, ".env.local") });

const SURGEXA_JSON = "G:\\surgexa_scraper\\surgexa_data\\all_data.json";
const BATCH_SIZE = 20;

// Exact strings as registered in `producttypes` — including the existing
// spelling of "Motorcyle Jacket", which must be matched rather than corrected
// or the admin form will reject the value.
const T = {
  WALLET: "Wallet",
  PURSE: "Purse",
  BELT: "Belt",
  BACKPACK: "Backpack",
  LEATHER_JACKET: "Leather Jackets",
  BIKER_JACKET: "Biker Jackets",
  DUFFLE: "Duffle Bag",
  MOTO_SUIT: "Motorcycle Suit",
  MOTO_JACKET: "Motorcyle Jacket",
  MOTO_PANTS: "Motorcycle Pants",
} as const;

/** Storefront category shown alongside each type. */
const CATEGORY_FOR: Record<string, string> = {
  [T.WALLET]: "Wallets",
  [T.PURSE]: "Purses",
  [T.BELT]: "Belts",
  [T.BACKPACK]: "Backpacks",
  [T.LEATHER_JACKET]: "Leather Jackets",
  [T.BIKER_JACKET]: "Biker Jackets",
  [T.DUFFLE]: "Duffle Bags",
  [T.MOTO_SUIT]: "Motorcycle Suits",
  [T.MOTO_JACKET]: "Motorcycle Jackets",
  [T.MOTO_PANTS]: "Motorcycle Pants",
};

const log = {
  start: (m: string) => console.log(`[START]    ${m}`),
  batch: (m: string) => console.log(`\n[BATCH]    ${m}`),
  product: (m: string) => console.log(`[PRODUCT]  ${m}`),
  type: (m: string) => console.log(`[TYPE]     → ${m}`),
  price: (m: string) => console.log(`[PRICE]    → ${m}`),
  keep: (m: string) => console.log(`[KEEP]     ⏸  ${m}`),
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

function slugFromImages(images: string[] | undefined): string {
  const u = (images || [])[0] || "";
  const m = u.match(/finished-products\/([^/]+)\//);
  return m ? m[1] : "";
}

function slugify(s: string): string {
  return String(s || "")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2019/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface SourceRow { name: string; material: string; categories: string; tags: string; price: number | null }

/**
 * Textile vs leather decides between the two motorcycle jacket types. The
 * source `material` field is authoritative — a large part of this range is
 * Cordura or polyester rather than hide.
 */
function isTextile(src: SourceRow | undefined, name: string): boolean {
  const mat = String(src?.material || "").toLowerCase();
  if (/genuine leather|cowhide|lambskin|buffalo|calfskin|full grain/.test(mat)) return false;
  if (/cordura|textile|polyester|mesh|cadora/.test(mat)) return true;

  // The product name is the next most reliable signal.
  const n = String(name || "").toLowerCase();
  if (/\bleather\b/.test(n)) return false;
  if (/textile|cordura|mesh|cadora|polyester/.test(n)) return true;

  // "Textile Garments" is a site-wide bucket sitting on 167 of 168 source
  // records, so it says nothing about an individual article and is removed
  // before the remaining categories are read.
  const cats = String(src?.categories || "").toLowerCase().replace(/textile garments/g, " ");
  const tags = String(src?.tags || "").toLowerCase();
  return /textile|cordura|mesh|cadora|polyester/.test(`${cats} ${tags}`);
}

export interface Decision { productType: string; category: string; reason: string }

/** Decides the registered product type from what the article actually is. */
export function decideType(name: string, src: SourceRow | undefined, currentType: string): Decision {
  const n = String(name || "").toLowerCase();
  const cats = String(src?.categories || "").toLowerCase();
  const tags = String(src?.tags || "").toLowerCase();
  const all = `${n} ${cats} ${tags}`;
  const D = (productType: string, reason: string): Decision => ({ productType, category: CATEGORY_FOR[productType] || productType, reason });

  // ── small leather goods first: most specific wording wins ──
  if (/coin\s*(purse|pouch)|\bpurse\b/.test(n)) return D(T.PURSE, "coin purse");
  if (/\bbelt\b/.test(n) || /leather belt/.test(cats)) return D(T.BELT, "belt");
  if (/backpack|rucksack/.test(all)) return D(T.BACKPACK, "backpack");
  if (/duffel|duffle|weekender|holdall|luggage|travel bag|gym bag|carry-?on|overnight/.test(all)) return D(T.DUFFLE, "duffle/travel bag");
  if (/wallet|card\s*holder|cardholder|credit card|passport holder|key\s*case|document holder/.test(n)) return D(T.WALLET, "wallet / small leather goods");
  // Any other carried bag lands with the duffle range rather than falling
  // through to a garment type.
  if (/\bbags?\b|tote|satchel|briefcase|messenger/.test(n)) return D(T.DUFFLE, "bag");

  // ── two-piece riding kit before the single garments ──
  if (/\bsuit\b|jacket\s*(&|and|\+)\s*pants?|pants?\s*(&|and|\+)\s*jacket|two[- ]piece|2[- ]piece/.test(n)) {
    return D(T.MOTO_SUIT, "suit / jacket+pants set");
  }
  if (/\bpants?\b|trouser|\bjeans?\b|chaps|legging/.test(n)) return D(T.MOTO_PANTS, "pants");

  // ── jackets: textile riding vs leather biker vs leather fashion ──
  const moto = /biker|moto|motorcycle|cafe racer|cruiser|racing|riding|touring|rider/.test(all);
  const textile = isTextile(src, name);
  if (/jacket|vest|coat|hoodie|gilet/.test(n) || /jacket/.test(cats)) {
    if (moto && textile) return D(T.MOTO_JACKET, "textile motorcycle jacket");
    if (moto) return D(T.BIKER_JACKET, "leather biker jacket");
    return D(T.LEATHER_JACKET, "leather jacket / outerwear");
  }

  // ── fall back on whatever it already is, mapped onto a registered type ──
  const ct = String(currentType || "").toLowerCase();
  if (ct.includes("wallet")) return D(T.WALLET, "carried over from existing type");
  if (ct.includes("belt")) return D(T.BELT, "carried over from existing type");
  if (ct.includes("backpack")) return D(T.BACKPACK, "carried over from existing type");
  if (ct.includes("bag")) return D(T.DUFFLE, "carried over from existing type");
  if (ct.includes("pant")) return D(T.MOTO_PANTS, "carried over from existing type");
  if (ct.includes("biker")) return D(textile ? T.MOTO_JACKET : T.BIKER_JACKET, "carried over from existing type");
  if (ct.includes("jacket") || ct.includes("coat") || ct.includes("vest") || ct.includes("garment")) {
    return D(moto && textile ? T.MOTO_JACKET : moto ? T.BIKER_JACKET : T.LEATHER_JACKET, "carried over from existing type");
  }
  return D(T.LEATHER_JACKET, "no signal — defaulted");
}

async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const typesOnly = args.includes("--types-only");

  // ── source rows keyed by cloudinary slug ──
  const bySlug = new Map<string, SourceRow>();
  if (fs.existsSync(SURGEXA_JSON)) {
    const arr: any[] = JSON.parse(fs.readFileSync(SURGEXA_JSON, "utf8"));
    for (const p of arr) {
      if (!p?.name) continue;
      // Reproduce the slug the import used: brand and tagline stripped.
      let cleaned = String(p.name).replace(/\u2019/g, "'").replace(/surgexa(\s+llc)?/gi, " ").replace(/\s+/g, " ").trim();
      const dashed = cleaned.split(/\s+[–—-]\s+/);
      if (dashed.length > 1 && dashed[0].trim().length >= 5) cleaned = dashed[0].trim();
      cleaned = cleaned.replace(/^[–—\-|,\s]+|[–—\-|,\s]+$/g, "").trim();
      const row: SourceRow = {
        name: String(p.name),
        material: String(p.material || p?.attributes?.Material || ""),
        categories: (p.categories || []).join(" "),
        tags: (p.tags || []).join(" "),
        price: typeof p?.price?.current_price === "number" ? p.price.current_price : null,
      };
      bySlug.set(slugify(cleaned), row);
    }
  }
  log.start(`Loaded ${bySlug.size} source rows for price/material lookup`);

  const { default: connectDB } = await import("../lib/config/db");
  const { default: FinishedProduct } = await import("../lib/models/FinishedProduct");
  const { default: ProductType } = await import("../lib/models/ProductType");
  const mongoose = (await import("mongoose")).default;
  await connectDB();

  const registered = new Set((await ProductType.find({}).lean()).map((t: any) => String(t.name)));
  log.start(`Registered product types: ${[...registered].join(", ")}`);

  const docs = await FinishedProduct.find({}).sort({ _id: 1 });
  log.start(`${docs.length} finished products${dryRun ? "  (DRY RUN)" : ""}`);

  const stats = { processed: 0, typeChanged: 0, priceRestored: 0, unchanged: 0, failed: 0, unregistered: 0 };
  const byType: Record<string, number> = {};
  const samples: string[] = [];

  const totalBatches = Math.ceil(docs.length / BATCH_SIZE);
  for (let b = 0; b < totalBatches; b++) {
    const slice = docs.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    if (!slice.length) break;
    log.batch(`Batch ${b + 1}/${totalBatches}`);

    for (const doc of slice) {
      stats.processed++;
      try {
        const slug = slugFromImages(doc.images as any);
        const src = slug ? bySlug.get(slug) : undefined;

        const d = decideType(String(doc.name), src, String(doc.productType));
        byType[d.productType] = (byType[d.productType] || 0) + 1;

        if (!registered.has(d.productType)) {
          stats.unregistered++;
          log.warn(`${doc.name} → "${d.productType}" is not registered in producttypes`);
        }

        const update: Record<string, unknown> = {};
        const typeChanged = d.productType !== doc.productType;
        if (typeChanged) {
          update.productType = d.productType;
          // Category is only re-cut when the type actually moves. Existing
          // categories such as "Mens Wallets" are more specific than the
          // generic label and are worth keeping where the type is unchanged.
          update.category = d.category;
        }

        // Restore the scraped price only where a scraped figure exists.
        let priceNote = "";
        if (!typesOnly && src && typeof src.price === "number" && src.price > 0 && doc.pricePerUnit !== src.price) {
          update.pricePerUnit = src.price;
          priceNote = `$${doc.pricePerUnit} → $${src.price.toFixed(2)} (scraped)`;
          stats.priceRestored++;
        }

        if (!Object.keys(update).length) { stats.unchanged++; continue; }

        log.product(String(doc.name));
        if (typeChanged) {
          log.type(`"${doc.productType}" → "${d.productType}" | category "${d.category}"   (${d.reason})`);
          stats.typeChanged++;
        }
        if (priceNote) log.price(priceNote);

        if (samples.length < 14 && typeChanged) {
          samples.push(`${String(doc.name).slice(0, 46).padEnd(48)} ${String(doc.productType).padEnd(16)} → ${d.productType}`);
        }

        if (!dryRun) {
          await FinishedProduct.findByIdAndUpdate(doc._id, { $set: update });
          log.db(`Updated: ${doc.name}`);
        }
      } catch (err: any) {
        stats.failed++;
        log.error(`${doc.name} — ${errText(err)}`);
      }
    }
  }

  if (dryRun) console.log("\n[DRY RUN]  No changes written to database");
  await mongoose.disconnect();

  const row = (l: string, v: string | number) => `║ ${l.padEnd(30)}${String(v).padEnd(16)}║`;
  console.log(`
╔══════════════════════════════════════════════════╗
║  PURE GRAIN — PRODUCT TYPES ${dryRun ? "DRY RUN" : "APPLIED"}             ║
╠══════════════════════════════════════════════════╣
${row("Products processed:", stats.processed)}
${row("Product type changed:", stats.typeChanged)}
${row("Prices restored to scraped:", stats.priceRestored)}
${row("Already correct:", stats.unchanged)}
${row("Unregistered type produced:", stats.unregistered)}
${row("Failed:", stats.failed)}
╠══════════════════════════════════════════════════╣
║ Resulting product type split                     ║
${Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => row(`  ${k}:`, v)).join("\n")}
╚══════════════════════════════════════════════════╝`);

  if (samples.length) {
    console.log("\nSample re-assignments:");
    samples.forEach((s) => console.log(`  ${s}`));
  }

  process.exit(0);
}

run().catch((err) => {
  log.error(`Aborted: ${errText(err)}`);
  console.error(err);
  process.exit(1);
});
