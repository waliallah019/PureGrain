// scripts/rewriteFinishedProducts.ts
//
// Rewrites imported FinishedProduct rows into own-label catalogue entries:
// renames them off the supplier's product lines, replaces the scraped
// marketing copy with written B2B prose, and repositions origin to the
// Pakistani workshops that actually produce the goods.
//
// Usage:
//   npx tsx scripts/rewriteFinishedProducts.ts --dry-run
//   npx tsx scripts/rewriteFinishedProducts.ts
//
// Products are identified by matching their name against
// products_full_data.json, so anything not from that import — including the
// pre-existing rows — is left untouched. Re-running is safe: once a product has
// been renamed it no longer matches the source list and is skipped.
//
// Only name, description, materialUsed and tags are written. Pricing, images,
// dimensions, category, colourVariants, moq and every flag are left as they are.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(PROJECT_ROOT, ".env.local") });

const SOURCE_JSON = "G:\\florenceleathermarket_scraper\\products_full_data.json";
const BATCH_SIZE = 20;

// ────────────────────────────── logging ──────────────────────────────

const log = {
  start: (m: string) => console.log(`[START]    ${m}`),
  batch: (m: string) => console.log(`\n[BATCH]    ${m}`),
  product: (m: string) => console.log(`[PRODUCT]  ${m}`),
  name: (m: string) => console.log(`[NAME]     → ${m}`),
  desc: (m: string) => console.log(`[DESC]     → ${m}`),
  tags: (m: string) => console.log(`[TAGS]     → ${m}`),
  db: (m: string) => console.log(`[DB]       ✓ ${m}`),
  skip: (m: string) => console.log(`[SKIP]     ⏭  ${m}`),
  review: (m: string) => console.log(`[REVIEW]   ⚑ ${m}`),
  error: (m: string) => console.log(`[ERROR]    ✗  ${m}`),
  dry: (m: string) => console.log(`[DRY RUN]  ${m}`),
};

function errText(err: any): string {
  if (!err) return "unknown error";
  if (typeof err === "string") return err;
  if (err.message) return err.message;
  try { return JSON.stringify(err); } catch { return String(err); }
}

// ─────────────────────── naming vocabulary ───────────────────────────

/**
 * House line names for finished goods, drawn from Pakistani heritage sites and
 * places. Deliberately distinct from the hide catalogue's river/range set so
 * the two ranges read as separate lines.
 */
const HOUSE_LINES = [
  "Taxila", "Harappa", "Rohtas", "Shalimar", "Derawar", "Uch", "Sehwan",
  "Attock", "Skardu", "Naran", "Kalam", "Astore", "Hingol", "Ormara",
  "Gwadar", "Ziarat", "Multan", "Lahore", "Chakwal", "Soan",
  "Kaghan", "Malam", "Ayubia", "Khewra", "Bhurban", "Shogran", "Kumrat",
  "Neelam", "Ranikot", "Mohenjo", "Bahawal", "Cholistan",
];

/**
 * Words that must never appear in a Pure Grain listing. Kept without the `g`
 * flag — a global regex carries `lastIndex` between `.test()` calls and would
 * intermittently report a clean string as dirty (and vice versa).
 */
const BANNED_SOURCE = "\\b(italy|italian|italia|florence|firenze|tuscan|tuscany|florentine)\\b";
const hasBanned = (s: string) => new RegExp(BANNED_SOURCE, "i").test(String(s || ""));
const stripBanned = (s: string) => String(s || "").replace(new RegExp(BANNED_SOURCE, "gi"), "").replace(/\s+/g, " ").trim();

/** Workshop by product type — Sialkot and Karachi are the leather-goods hubs. */
function workshopCity(productType: string, category: string): string {
  const t = `${productType} ${category}`.toLowerCase();
  if (t.includes("belt")) return "Karachi";
  return "Sialkot";
}

/** Stable hash so a product always lands on the same house line. */
function seedFrom(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

function titleCase(s: string): string {
  return String(s || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** What the article actually is, read from the source name and features. */
function productDescriptor(name: string, productType: string, features: Record<string, string>): string {
  const n = String(name || "").toLowerCase();
  const f = Object.keys(features || {}).join(" ").toLowerCase();

  if (/passport/.test(n)) return "Passport Holder";
  if (/key\s*(case|holder|ring)/.test(n)) return "Key Case";
  if (/coin\s*(purse|pouch)/.test(n) || /\bpurse\b/.test(n)) return "Coin Purse";
  if (/card\s*holder|credit card|cardholder/.test(n) || /card/.test(f)) {
    if (/wallet/.test(n)) return "Card Wallet";
    return "Card Holder";
  }
  if (/belt/.test(n) || /belt/i.test(productType)) {
    // Belts carry no colour and often no material qualifier, so the strap
    // width — stated in the source name — is what distinguishes them.
    const w = n.match(/(\d{2})\s*mm/i);
    return w ? `${w[1]}mm Belt` : "Belt";
  }
  if (/document|folder|portfolio/.test(n)) return "Document Holder";
  if (/travel/.test(n)) return "Travel Wallet";
  if (/zip/.test(n)) return "Zip Wallet";
  if (/trifold|tri-fold/.test(n)) return "Trifold Wallet";
  if (/bifold|bi-fold/.test(n)) return "Bifold Wallet";
  if (/wallet/.test(n)) return "Wallet";
  return productType || "Accessory";
}

/** Short material qualifier used at the front of the name. */
function materialQualifier(materialUsed: string): string {
  const m = String(materialUsed || "").toLowerCase();
  if (m.includes("calfskin")) return "Calfskin";
  if (m.includes("cowhide")) return "Cowhide";
  if (m.includes("vintage")) return "Vintage";
  if (m.includes("suede")) return "Suede";
  if (m.includes("full grain")) return "Full Grain";
  if (m.includes("top grain")) return "Top Grain";
  if (m.includes("goatskin")) return "Goatskin";
  if (m.includes("nappa")) return "Nappa";
  return "";
}

export interface NameResult { name: string; flagged: boolean; reason?: string }

/**
 * Builds an own-label name. The supplier's line names are Italian given names
 * ("Bernardo", "Alvaro", "Clemenza") and are dropped entirely rather than
 * re-ordered — keeping them would carry the other brand's identity across.
 *
 *   "Bernardo V Wallet in cow leather" → "Cowhide Rohtas Wallet"
 *   "Casey Credit Card Holder"         → "Black Taxila Card Holder"
 */
export function buildName(
  doc: any,
  features: Record<string, string>,
  taken: Set<string>
): NameResult {
  const descriptor = productDescriptor(doc.name, doc.productType, features);

  // Prefer a colour, fall back to the material, so the name still leads with
  // something a buyer filters on.
  const colour =
    Array.isArray(doc.colorVariants) && doc.colorVariants.length
      ? titleCase(String(doc.colorVariants[0]))
      : "";
  const qualifier = colour || materialQualifier(doc.materialUsed);

  const seed = seedFrom(String(doc.name || ""));
  for (let i = 0; i < HOUSE_LINES.length; i++) {
    const line = HOUSE_LINES[(seed + i) % HOUSE_LINES.length];
    const candidate = [qualifier, line, descriptor].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    if (!taken.has(candidate.toLowerCase())) {
      taken.add(candidate.toLowerCase());
      return { name: candidate, flagged: false };
    }
  }

  return {
    name: `[REVIEW NAME] ${titleCase(String(doc.name))}`,
    flagged: true,
    reason: "no unique house line available",
  };
}

// ──────────────────── description generation ─────────────────────────

/** Human capacity line from the scraped feature table. */
function capacityBits(features: Record<string, string>): string[] {
  const f = features || {};
  const bits: string[] = [];
  const num = (v: string) => {
    const m = String(v || "").match(/\d+/);
    return m ? m[0] : "";
  };

  if (f["Credit card slots"]) {
    const n = num(f["Credit card slots"]);
    if (n) bits.push(`${n} card slot${n === "1" ? "" : "s"}`);
  }
  if (f["Compartments for bills"]) {
    const n = num(f["Compartments for bills"]);
    if (n) bits.push(`${n} bill compartment${n === "1" ? "" : "s"}`);
  }
  if (f["Slot for business cards"]) bits.push("Business card slot");
  if (f["Pocket for coins"]) bits.push("Coin pocket");
  if (f["Transparent window"]) bits.push("ID window");
  if (f["Interior compartments"]) {
    const n = num(f["Interior compartments"]);
    if (n) bits.push(`${n} interior compartment${n === "1" ? "" : "s"}`);
  }
  if (f["Closure Type"]) bits.push(`${titleCase(f["Closure Type"])} closure`);
  return bits;
}

/**
 * Writes the product copy from the article's own attributes. No sentence is
 * carried over from the supplier's marketing text.
 */
function buildDescription(doc: any, features: Record<string, string>, newName: string): string {
  const descriptor = productDescriptor(doc.name, doc.productType, features);
  const material = String(doc.materialUsed || "Full Grain Leather");
  const materialPhrase = material.toLowerCase().replace(/ leather$/, "") + " leather";
  const city = workshopCity(doc.productType, doc.category);
  const caps = capacityBits(features);
  const isBelt = /belt/i.test(descriptor);

  // ── sentence 1 ──
  const form = isBelt
    ? `A ${materialPhrase} belt cut from a single strip and edge-finished by hand`
    : `A ${descriptor.toLowerCase()} in ${materialPhrase}, cut and skived for a slim, even profile`;
  const s1 = `${form}.`;

  // ── sentence 2: capacity or construction ──
  let s2 = "";
  if (caps.length) {
    const picked = caps.slice(0, 3).map((c) => c.toLowerCase());
    const listed =
      picked.length > 1 ? `${picked.slice(0, -1).join(", ")} and ${picked[picked.length - 1]}` : picked[0];
    s2 = `Fitted with ${listed}, laid out to keep the closed thickness down.`;
  } else if (isBelt) {
    s2 = "Stitched along both edges and finished with a solid metal buckle for daily wear.";
  } else {
    s2 = "Panels are reinforced at the stress points and stitched with bonded thread throughout.";
  }

  // ── sentence 3: trade assurance ──
  const s3 = `Cut, stitched and finished in our ${city} workshop, with consistent sizing and finish across production runs.`;

  const prose = [s1, s2, s3].join(" ");

  const specParts = [
    String(doc.dimensions || "").trim(),
    material,
    Array.isArray(doc.colorVariants) && doc.colorVariants.length ? doc.colorVariants.join(", ") : "",
    `${city}, Pakistan`,
  ].filter(Boolean);

  const lines = [prose, `Specifications: ${specParts.join(" | ")}`];
  if (caps.length) lines.push(`Features: ${caps.join(" · ")}`);

  return lines.join("\n\n");
}

/** Rebuilds tags without supplier or foreign-origin terms. */
function buildTags(doc: any, newName: string, features: Record<string, string>): string[] {
  const descriptor = productDescriptor(doc.name, doc.productType, features);
  const city = workshopCity(doc.productType, doc.category);
  const material = normaliseMaterial(doc.materialUsed);

  const tags = [
    String(doc.category || ""),
    String(doc.productType || ""),
    descriptor,
    material,
    ...(Array.isArray(doc.colorVariants) ? doc.colorVariants : []),
    "Handcrafted",
    `Made in ${city}`,
    "Pakistan Leather",
  ];

  return [...new Set(tags.map((t) => String(t || "").trim()).filter(Boolean))]
    .filter((t) => !hasBanned(t))
    .map((t) => stripBanned(t))
    .filter(Boolean);
}

/** "Italian Leather" is an origin claim, not a material — restate it. */
export function normaliseMaterial(materialUsed: string): string {
  const m = String(materialUsed || "").trim();
  if (/^italian leather$/i.test(m)) return "Full Grain Leather";
  return m || "Full Grain Leather";
}

// ──────────────────────────────── run ────────────────────────────────

async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  if (!fs.existsSync(SOURCE_JSON)) {
    log.error(`Source data not found at ${SOURCE_JSON}`);
    process.exit(1);
  }
  const source: any[] = JSON.parse(fs.readFileSync(SOURCE_JSON, "utf8"));
  const featuresByName = new Map<string, Record<string, string>>();
  for (const p of source) {
    if (!featuresByName.has(p.name)) featuresByName.set(p.name, p.features || {});
  }
  const sourceNames = [...featuresByName.keys()];

  const { default: connectDB } = await import("../lib/config/db");
  const { default: FinishedProduct } = await import("../lib/models/FinishedProduct");
  const mongoose = (await import("mongoose")).default;

  await connectDB();

  const products = await FinishedProduct.find({ name: { $in: sourceNames } }).sort({ _id: 1 });
  const untouched = await FinishedProduct.countDocuments({ name: { $nin: sourceNames } });

  log.start(`Rewriting ${products.length} imported products${dryRun ? "  (DRY RUN)" : ""}`);
  log.start(`${untouched} other products in the collection — not touched`);

  // Seed uniqueness with every existing name so nothing collides.
  const taken = new Set<string>(
    (await FinishedProduct.find({}).select("name").lean()).map((d: any) => String(d.name).toLowerCase())
  );

  const stats = { processed: 0, updated: 0, failed: 0, flagged: 0, leakageBefore: 0 };
  const flagged: string[] = [];
  const totalBatches = Math.max(1, Math.ceil(products.length / BATCH_SIZE));
  let shown = 0;

  for (let b = 0; b < totalBatches; b++) {
    const slice = products.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    if (!slice.length) break;
    log.batch(`Processing batch ${b + 1}/${totalBatches} (products ${b * BATCH_SIZE + 1}-${b * BATCH_SIZE + slice.length})`);

    for (const doc of slice) {
      stats.processed++;
      const originalName = String(doc.name);
      log.product(originalName);

      try {
        const features = featuresByName.get(originalName) || {};
        if (hasBanned(String(doc.description || "")) || hasBanned(originalName)) stats.leakageBefore++;

        const nameRes = buildName(doc, features, taken);
        log.name(nameRes.name);
        if (nameRes.flagged) {
          stats.flagged++;
          flagged.push(`${originalName} → ${nameRes.name}`);
          log.review(`Ambiguous name: ${originalName}`);
        }

        // Normalise the material BEFORE the copy is written — otherwise a row
        // still carrying "Italian Leather" has that phrase baked into the prose
        // even though the stored field gets corrected.
        const material = normaliseMaterial(doc.materialUsed);
        const normalised = { ...doc.toObject(), materialUsed: material };
        const description = buildDescription(normalised, features, nameRes.name);
        const tags = buildTags(normalised, nameRes.name, features);

        log.desc(`Generated ${description.length} chars`);
        log.tags(JSON.stringify(tags));

        if (dryRun && shown < 5) {
          shown++;
          console.log(`\n[DRY RUN]  ── transformation ${shown}/5 ──`);
          console.log(`           NAME : ${originalName}`);
          console.log(`                → ${nameRes.name}`);
          console.log(`           OLD  : ${String(doc.description).slice(0, 110).replace(/\n/g, " ")}…`);
          console.log(`           NEW  :`);
          description.split("\n").filter(Boolean).forEach((l) => console.log(`                  ${l}`));
          console.log(`           MAT  : ${doc.materialUsed} → ${material}`);
          console.log(`           TAGS : ${JSON.stringify(tags)}\n`);
        }

        if (!dryRun) {
          await FinishedProduct.findByIdAndUpdate(doc._id, {
            $set: { name: nameRes.name, description, materialUsed: material, tags },
          });
          log.db(`Updated: ${nameRes.name}`);
        }

        stats.updated++;
      } catch (err: any) {
        stats.failed++;
        log.error(`Failed: ${originalName} — ${errText(err)}`);
      }
    }
  }

  if (dryRun) console.log("\n[DRY RUN]  No changes written to database");

  await mongoose.disconnect();

  const row = (label: string, value: string | number) =>
    `║ ${label.padEnd(28)}${String(value).padEnd(16)}║`;

  console.log(`
╔═════════════════════════════════════════════╗
║  PURE GRAIN — FINISHED PRODUCTS ${dryRun ? "DRY RUN" : "REWRITE"}   ║
╠═════════════════════════════════════════════╣
${row("Total processed:", stats.processed)}
${row(dryRun ? "Would update:" : "Successfully updated:", stats.updated)}
${row("Failed:", stats.failed)}
${row("Names flagged for review:", stats.flagged)}
${row("Had foreign-origin text:", stats.leakageBefore)}
╠═════════════════════════════════════════════╣
║ Rewritten:                                  ║
║   name · description · tags · materialUsed  ║
║ Untouched:                                  ║
║   price · images · dimensions · category    ║
║   colourVariants · moq · all flags          ║
╚═════════════════════════════════════════════╝`);

  if (flagged.length) {
    console.log(`\nNames flagged for manual review (${flagged.length}):`);
    flagged.forEach((f) => console.log(`  ${f}`));
  }

  process.exit(0);
}

run().catch((err) => {
  log.error(`Rewrite aborted: ${errText(err)}`);
  console.error(err);
  process.exit(1);
});
