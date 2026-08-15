// scripts/refineCatalogNaming.ts
//
// Replaces the placeholder "house line" names (Ayubia, Cholistan, Bolan …) with
// names that actually describe the article, and re-bases finished-goods pricing
// and MOQ on Pakistani manufacturing economics rather than the scraped retail
// figures.
//
// Usage:
//   npx tsx scripts/refineCatalogNaming.ts --dry-run
//   npx tsx scripts/refineCatalogNaming.ts
//   npx tsx scripts/refineCatalogNaming.ts --only=raw|finished
//
// Products are matched back to their source record through the Cloudinary
// folder slug embedded in images[0], because the stored names have already been
// rewritten and no longer match the source files.
//
// RAW LEATHER   → name only.  "Coffee Geometric Embossed Cowhide"
// FINISHED GOODS→ name + pricePerUnit + moq.  "Black Calfskin 9-Slot Card Holder"
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(PROJECT_ROOT, ".env.local") });

const LEATHERWKS = "G:\\leatherwks-Data\\catalog.json";
const DISTRICT = "G:\\DistrictLeather Data\\all_products.json";
const FLORENCE = "G:\\florenceleathermarket_scraper\\products_full_data.json";
const BATCH_SIZE = 20;

const log = {
  start: (m: string) => console.log(`[START]    ${m}`),
  section: (m: string) => console.log(`\n[SECTION]  ══ ${m} ══`),
  batch: (m: string) => console.log(`\n[BATCH]    ${m}`),
  product: (m: string) => console.log(`[PRODUCT]  ${m}`),
  name: (m: string) => console.log(`[NAME]     → ${m}`),
  price: (m: string) => console.log(`[PRICE]    → ${m}`),
  moq: (m: string) => console.log(`[MOQ]      → ${m}`),
  db: (m: string) => console.log(`[DB]       ✓ ${m}`),
  skip: (m: string) => console.log(`[SKIP]     ⏭  ${m}`),
  review: (m: string) => console.log(`[REVIEW]   ⚑ ${m}`),
  error: (m: string) => console.log(`[ERROR]    ✗  ${m}`),
};

function errText(err: any): string {
  if (!err) return "unknown error";
  if (typeof err === "string") return err;
  if (err.message) return err.message;
  try { return JSON.stringify(err); } catch { return String(err); }
}

function titleCase(s: string): string {
  return String(s || "").toLowerCase().split(/\s+/).filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

/** Cloudinary folder slug carried in the stored image URL. */
function slugFromImages(images: string[] | undefined, folder: string): string {
  const u = (images || [])[0] || "";
  const m = u.match(new RegExp(`${folder}/([^/]+)/`));
  return m ? m[1] : "";
}

function slugify(s: string): string {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// ══════════════════════ RAW LEATHER NAMING ══════════════════════════

/** Surface texture, read from the supplier's original wording. */
function textureOf(sourceText: string): string {
  const s = sourceText.toLowerCase();
  if (/crocodile|croco|caiman|gator|alligator/.test(s)) return "Croco";
  if (/python|anaconda|\bsnake\b/.test(s)) return "Python";
  if (/ostrich/.test(s)) return "Ostrich";
  if (/lizard|teju/.test(s)) return "Lizard";
  if (/saffiano|criss ?cross/.test(s)) return "Saffiano";
  if (/floral|tooled|western tool/.test(s)) return "Tooled";
  if (/woven|basket/.test(s)) return "Woven";
  if (/turtle/.test(s)) return "Turtle";
  if (/caviar/.test(s)) return "Caviar";
  if (/pebble|milled/.test(s)) return "Pebble";
  if (/geometric/.test(s)) return "Geometric";
  if (/camouflage|camo/.test(s)) return "Camo";
  if (/metallic|foil/.test(s)) return "Metallic";
  return "";
}

/** The hide the article is cut from, stated plainly. */
function hideWord(animal: string, leatherType: string): string {
  const t = String(leatherType || "").toLowerCase();
  if (t.includes("suede")) return "Suede";
  if (t.includes("nubuck")) return "Nubuck";
  switch (animal) {
    case "Buffalo": return "Buffalo";
    case "Goat": return "Goatskin";
    case "Sheep": return "Lambskin";
    case "Exotic": return "Exotic";
    default: return "Cowhide";
  }
}

/** Finish word that reads naturally inside a product name. */
function finishWord(finish: string, leatherType: string): string {
  const f = String(finish || "").toLowerCase();
  const t = String(leatherType || "").toLowerCase();
  if (t.includes("veg tan")) return "Veg Tan";
  if (f.includes("embossed")) return "Embossed";
  if (f.includes("waxed")) return "Waxed";
  if (f.includes("pull-up")) return "Pull-Up";
  if (f.includes("nappa")) return "Nappa";
  if (f.includes("semi-aniline")) return "Semi-Aniline";
  if (f.includes("pigmented")) return "Pigmented";
  if (f.includes("crazy horse")) return "Crazy Horse";
  if (f.includes("aniline")) return "Aniline";
  return "";
}

export function buildRawName(doc: any, sourceText: string, taken: Set<string>): { name: string; flagged: boolean } {
  const colour = Array.isArray(doc.colors) && doc.colors.length ? titleCase(String(doc.colors[0])) : "";
  const texture = textureOf(`${sourceText} ${doc.leatherType || ""} ${doc.finish || ""}`);
  const finish = finishWord(doc.finish, doc.leatherType);
  const hide = hideWord(doc.animal, doc.leatherType);

  const base = [colour, texture, finish, hide].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  if (base && !taken.has(base.toLowerCase())) {
    taken.add(base.toLowerCase());
    return { name: base, flagged: false };
  }

  // Thickness is the natural next differentiator between otherwise identical hides.
  const thick = String(doc.thickness || "").replace(/\s+/g, "");
  const withThick = thick && /\d/.test(thick) ? `${base} ${thick}` : "";
  if (withThick && !taken.has(withThick.toLowerCase())) {
    taken.add(withThick.toLowerCase());
    return { name: withThick, flagged: false };
  }

  for (let i = 2; i < 40; i++) {
    const cand = `${base} ${String(i).padStart(2, "0")}`;
    if (!taken.has(cand.toLowerCase())) {
      taken.add(cand.toLowerCase());
      return { name: cand, flagged: false };
    }
  }
  return { name: `[REVIEW NAME] ${base}`, flagged: true };
}

// ═════════════════ FINISHED GOODS: NAME, COST, MOQ ══════════════════

/** Article type, from the supplier's original name and its feature table. */
function articleType(sourceName: string, productType: string, features: Record<string, string>): string {
  const n = String(sourceName || "").toLowerCase();
  const hasSlots = Boolean(features?.["Credit card slots"]);

  if (/passport/.test(n)) return "Passport Holder";
  if (/key\s*(case|holder|ring)/.test(n)) return "Key Case";
  if (/coin\s*(purse|pouch)/.test(n) || /\bpurse\b/.test(n)) return "Coin Purse";
  if (/belt/.test(n) || /belt/i.test(productType)) return "Belt";
  if (/document|folder|portfolio/.test(n)) return "Document Holder";
  if (/card\s*holder|credit card|cardholder/.test(n)) return "Card Holder";
  if (/travel/.test(n)) return "Travel Wallet";
  if (/zip/.test(n)) return "Zip Wallet";
  if (/trifold|tri-fold/.test(n)) return "Trifold Wallet";
  if (/bifold|bi-fold/.test(n)) return "Bifold Wallet";
  if (/wallet/.test(n)) return hasSlots ? "Bifold Wallet" : "Wallet";
  return productType || "Accessory";
}

/** Hide word for finished goods — belts are heavy bovine, small goods lighter. */
function goodsHide(materialUsed: string, article: string): string {
  const m = String(materialUsed || "").toLowerCase();
  if (m.includes("calfskin")) return "Calfskin";
  if (m.includes("goatskin")) return "Goatskin";
  if (m.includes("suede")) return "Suede";
  if (m.includes("vintage")) return "Vintage Cowhide";
  if (m.includes("nappa")) return "Nappa";
  if (m.includes("cowhide")) return "Cowhide";
  // Belts are cut from thick bovine; small goods from lighter grain.
  return /belt/i.test(article) ? "Full Grain Cowhide" : "Cowhide";
}

/**
 * Strap width in mm. A belt's stored dimension is sometimes its length, not its
 * width, so a parsed figure is only accepted inside the range real straps come
 * in (15-60 mm) — otherwise "90 cm" becomes a 900 mm strap and the costing
 * explodes.
 */
const BELT_WIDTH_MIN_MM = 15;
const BELT_WIDTH_MAX_MM = 60;
const BELT_WIDTH_DEFAULT_MM = 35;

function beltWidthMm(sourceName: string, dimensions: string): number {
  const inRange = (v: number) => v >= BELT_WIDTH_MIN_MM && v <= BELT_WIDTH_MAX_MM;

  const n = String(sourceName || "").match(/(\d{2})\s*mm/i);
  if (n) {
    const v = parseInt(n[1], 10);
    if (inRange(v)) return v;
  }
  const d = String(dimensions || "").match(/([\d.,]+)\s*cm/);
  if (d) {
    const v = Math.round(parseFloat(d[1].replace(",", ".")) * 10);
    if (inRange(v)) return v;
  }
  return BELT_WIDTH_DEFAULT_MM;
}

function cardSlots(features: Record<string, string>): number {
  const m = String(features?.["Credit card slots"] || "").match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

/** Panel dimensions in cm, from the stored "12 cm x 8 cm" string. */
function parseDims(dimensions: string): { l: number; w: number } | null {
  const parts = String(dimensions || "").match(/([\d.,]+)\s*cm\s*x\s*([\d.,]+)\s*cm/i);
  if (!parts) return null;
  const l = parseFloat(parts[1].replace(",", "."));
  const w = parseFloat(parts[2].replace(",", "."));
  if (!Number.isFinite(l) || !Number.isFinite(w)) return null;
  return { l, w };
}

/** Finished leather, delivered cost per square foot in Pakistan (USD). */
const LEATHER_USD_PER_SQFT: Record<string, number> = {
  "calfskin leather": 3.6,
  "nappa leather": 3.4,
  "full grain leather": 3.2,
  "vintage leather": 3.1,
  "top grain leather": 3.0,
  "cowhide leather": 2.9,
  "goatskin leather": 2.8,
  "genuine leather": 2.5,
  "suede leather": 2.4,
  suede: 2.4,
};

/** Cut-and-stitch labour per piece at 20–50 pc runs (USD). */
const LABOUR_BASE: Record<string, number> = {
  "Card Holder": 1.8,
  "Card Wallet": 2.4,
  "Bifold Wallet": 2.5,
  "Trifold Wallet": 2.9,
  "Zip Wallet": 3.2,
  "Travel Wallet": 3.2,
  Wallet: 2.6,
  "Coin Purse": 1.6,
  "Key Case": 1.4,
  "Passport Holder": 2.2,
  "Document Holder": 2.8,
  Belt: 1.9,
};

const SQCM_PER_SQFT = 929.03;
const OVERHEAD_RATE = 0.12; // wastage, rejects, factory overhead
const MARGIN_RATE = 0.45; // gross margin over landed cost

export interface Costing {
  article: string;
  areaSqFt: number;
  material: number;
  labour: number;
  hardware: number;
  overhead: number;
  cost: number;
  price: number;
  moq: number;
}

/**
 * Builds a per-piece cost from materials, labour and hardware as they price in
 * Pakistan, then applies margin. The scraped figures were Italian retail and
 * bear no relation to an export quotation.
 */
export function costFinished(doc: any, sourceName: string, features: Record<string, string>): Costing {
  const article = articleType(sourceName, doc.productType, features);
  const isBelt = article === "Belt";
  const material = String(doc.materialUsed || "Genuine Leather").toLowerCase();
  const perSqFt = LEATHER_USD_PER_SQFT[material] ?? 2.7;

  // ── leather area ──
  let areaSqCm: number;
  if (isBelt) {
    const widthCm = beltWidthMm(sourceName, doc.dimensions) / 10;
    // 120 cm strap, doubled and lined.
    areaSqCm = 120 * widthCm * 1.7;
  } else {
    const d = parseDims(doc.dimensions);
    // Panels, lining and card slots consume roughly 2.4x the closed footprint.
    if (d) areaSqCm = d.l * d.w * 2.4;
    else areaSqCm = article === "Coin Purse" || article === "Key Case" ? 150 : 320;
  }
  const areaSqFt = areaSqCm / SQCM_PER_SQFT;
  const materialCost = areaSqFt * perSqFt;

  // ── labour ──
  let labour = LABOUR_BASE[article] ?? 2.4;
  const slots = cardSlots(features);
  labour += slots * 0.1;
  if (features?.["Pocket for coins"]) labour += 0.35;
  if (features?.["Transparent window"]) labour += 0.2;
  const closure = String(features?.["Closure Type"] || "").toLowerCase();
  const zipped = /zip/.test(closure) || /zip/i.test(article);
  if (zipped) labour += 0.45;

  // ── hardware and consumables ──
  let hardware = 0.45 /* thread, edge paint, lining */ + 0.35 /* polybag + box */;
  if (isBelt) hardware += 1.9; // buckle
  if (zipped) hardware += 0.55;
  if (/snap|button|stud/.test(closure)) hardware += 0.25;
  if (features?.["Metallic pieces"]) hardware += 0.3;

  const subtotal = materialCost + labour + hardware;
  const overhead = subtotal * OVERHEAD_RATE;
  const cost = subtotal + overhead;

  // Quote to the nearest 0.25 — tidy for a price list.
  const raw = cost * (1 + MARGIN_RATE);
  const price = Math.round(raw * 4) / 4;

  // Cheaper, simpler articles carry larger minimums; complex ones smaller.
  const moq = price < 8 ? 50 : price < 12 ? 40 : price < 18 ? 30 : 20;

  return {
    article,
    areaSqFt: Math.round(areaSqFt * 1000) / 1000,
    material: Math.round(materialCost * 100) / 100,
    labour: Math.round(labour * 100) / 100,
    hardware: Math.round(hardware * 100) / 100,
    overhead: Math.round(overhead * 100) / 100,
    cost: Math.round(cost * 100) / 100,
    price,
    moq,
  };
}

export function buildGoodsName(
  doc: any,
  sourceName: string,
  features: Record<string, string>,
  article: string,
  taken: Set<string>
): { name: string; flagged: boolean } {
  const colour =
    Array.isArray(doc.colorVariants) && doc.colorVariants.length
      ? titleCase(String(doc.colorVariants[0]))
      : "";
  const hide = goodsHide(doc.materialUsed, article);
  const slots = cardSlots(features);

  // A capacity or width figure is the most useful differentiator to a buyer.
  let qualifier = "";
  if (article === "Belt") qualifier = `${beltWidthMm(sourceName, doc.dimensions)}mm`;
  else if (slots >= 2) qualifier = `${slots}-Slot`;

  const attempts = [
    [colour, hide, qualifier, article],
    [colour, hide, article],
    [hide, qualifier, article],
    [colour, qualifier, article],
  ];

  for (const parts of attempts) {
    const cand = parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    if (cand && !taken.has(cand.toLowerCase())) {
      taken.add(cand.toLowerCase());
      return { name: cand, flagged: false };
    }
  }

  const base = [colour, hide, qualifier, article].filter(Boolean).join(" ");
  for (let i = 2; i < 60; i++) {
    const cand = `${base} ${String(i).padStart(2, "0")}`;
    if (!taken.has(cand.toLowerCase())) {
      taken.add(cand.toLowerCase());
      return { name: cand, flagged: false };
    }
  }
  return { name: `[REVIEW NAME] ${base}`, flagged: true };
}

// ──────────────────────────────── run ────────────────────────────────

async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const onlyArg = args.find((a) => a.startsWith("--only="));
  const only = onlyArg ? onlyArg.split("=")[1] : "";

  // ── source lookups keyed by cloudinary slug ──
  const rawSource = new Map<string, string>(); // slug -> original text blob
  if (fs.existsSync(LEATHERWKS)) {
    const cat = JSON.parse(fs.readFileSync(LEATHERWKS, "utf8"));
    for (const p of Object.values(cat).flat() as any[]) {
      const folderSlug = String(p.downloaded_images?.[0] || "").split(/[\\/]/).slice(-3)[0] || slugify(p.name);
      rawSource.set(folderSlug, `${p.name} ${p.description} ${JSON.stringify(p.attributes || {})}`);
    }
  }
  if (fs.existsSync(DISTRICT)) {
    const cat = JSON.parse(fs.readFileSync(DISTRICT, "utf8"));
    for (const p of Object.values(cat).flat() as any[]) {
      const s = String(p.url || "").split("/").filter(Boolean).pop() || slugify(p.name);
      rawSource.set(s, `${p.name} ${String(p.description_html || "").replace(/<[^>]+>/g, " ")}`);
    }
  }

  const goodsSource = new Map<string, { name: string; features: Record<string, string> }>();
  if (fs.existsSync(FLORENCE)) {
    const arr = JSON.parse(fs.readFileSync(FLORENCE, "utf8"));
    for (const p of arr) {
      const s = slugify(p.name);
      if (!goodsSource.has(s)) goodsSource.set(s, { name: p.name, features: p.features || {} });
    }
  }

  const { default: connectDB } = await import("../lib/config/db");
  const { default: RawLeather } = await import("../lib/models/RawLeather");
  const { default: FinishedProduct } = await import("../lib/models/FinishedProduct");
  const mongoose = (await import("mongoose")).default;
  await connectDB();

  const stats = {
    rawProcessed: 0, rawUpdated: 0,
    goodsProcessed: 0, goodsUpdated: 0,
    failed: 0, flagged: 0, skipped: 0,
  };
  const moqCounts: Record<number, number> = { 20: 0, 30: 0, 40: 0, 50: 0 };
  let priceLow = Infinity, priceHigh = -Infinity, priceSum = 0, priced = 0;
  const samples: string[] = [];

  // ══════════ RAW LEATHER ══════════
  if (only !== "finished") {
    log.section("RAW LEATHER — descriptive names");
    const docs = await RawLeather.find({}).sort({ _id: 1 });
    const taken = new Set<string>();

    const total = Math.ceil(docs.length / BATCH_SIZE);
    for (let b = 0; b < total; b++) {
      const slice = docs.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
      if (!slice.length) break;
      log.batch(`Raw batch ${b + 1}/${total}`);

      for (const doc of slice) {
        stats.rawProcessed++;
        try {
          const slug = slugFromImages(doc.images as any, "raw-leather");
          if (!slug) {
            log.skip(`${doc.name} — no image slug, leaving name unchanged`);
            taken.add(String(doc.name).toLowerCase());
            stats.skipped++;
            continue;
          }
          const sourceText = rawSource.get(slug) || slug.replace(/-/g, " ");
          const res = buildRawName(doc, sourceText, taken);
          if (res.flagged) { stats.flagged++; log.review(`${doc.name}`); }

          log.product(String(doc.name));
          log.name(res.name);
          if (samples.length < 6) samples.push(`RAW  ${doc.name}  →  ${res.name}`);

          if (!dryRun) await RawLeather.findByIdAndUpdate(doc._id, { $set: { name: res.name } });
          stats.rawUpdated++;
        } catch (err: any) {
          stats.failed++;
          log.error(`${doc.name} — ${errText(err)}`);
        }
      }
    }
  }

  // ══════════ FINISHED GOODS ══════════
  if (only !== "raw") {
    log.section("FINISHED GOODS — names, per-piece price, MOQ");
    const docs = await FinishedProduct.find({}).sort({ _id: 1 });
    const taken = new Set<string>();

    const total = Math.ceil(docs.length / BATCH_SIZE);
    for (let b = 0; b < total; b++) {
      const slice = docs.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
      if (!slice.length) break;
      log.batch(`Goods batch ${b + 1}/${total}`);

      for (const doc of slice) {
        stats.goodsProcessed++;
        try {
          const slug = slugFromImages(doc.images as any, "finished-products");
          const src = slug ? goodsSource.get(slug) : undefined;
          if (!src) {
            log.skip(`${doc.name} — not from the import, leaving unchanged`);
            taken.add(String(doc.name).toLowerCase());
            stats.skipped++;
            continue;
          }

          const costing = costFinished(doc, src.name, src.features);
          const res = buildGoodsName(doc, src.name, src.features, costing.article, taken);
          if (res.flagged) { stats.flagged++; log.review(`${doc.name}`); }

          log.product(String(doc.name));
          log.name(res.name);
          log.price(
            `$${doc.pricePerUnit} → $${costing.price.toFixed(2)}  ` +
              `(mat $${costing.material} + lab $${costing.labour} + hw $${costing.hardware} + oh $${costing.overhead} = cost $${costing.cost}, +${MARGIN_RATE * 100}%)`
          );
          log.moq(`${doc.moq} → ${costing.moq} pcs`);

          moqCounts[costing.moq]++;
          priceLow = Math.min(priceLow, costing.price);
          priceHigh = Math.max(priceHigh, costing.price);
          priceSum += costing.price;
          priced++;
          if (samples.length < 12)
            samples.push(`GOOD ${doc.name}  →  ${res.name}   $${doc.pricePerUnit}→$${costing.price.toFixed(2)}  moq ${costing.moq}`);

          if (!dryRun) {
            await FinishedProduct.findByIdAndUpdate(doc._id, {
              $set: { name: res.name, pricePerUnit: costing.price, moq: costing.moq },
            });
          }
          stats.goodsUpdated++;
        } catch (err: any) {
          stats.failed++;
          log.error(`${doc.name} — ${errText(err)}`);
        }
      }
    }
  }

  if (dryRun) console.log("\n[DRY RUN]  No changes written to database");
  await mongoose.disconnect();

  const row = (l: string, v: string | number) => `║ ${l.padEnd(28)}${String(v).padEnd(16)}║`;
  console.log(`
╔═════════════════════════════════════════════╗
║  PURE GRAIN — CATALOGUE NAMING ${dryRun ? "DRY RUN" : "UPDATE "}    ║
╠═════════════════════════════════════════════╣
${row("Raw leather renamed:", stats.rawUpdated)}
${row("Finished goods updated:", stats.goodsUpdated)}
${row("Skipped (not imported):", stats.skipped)}
${row("Failed:", stats.failed)}
${row("Flagged for review:", stats.flagged)}
╠═════════════════════════════════════════════╣
║ Finished goods pricing (USD / piece)        ║
${row("  Lowest:", priced ? `$${priceLow.toFixed(2)}` : "-")}
${row("  Highest:", priced ? `$${priceHigh.toFixed(2)}` : "-")}
${row("  Average:", priced ? `$${(priceSum / priced).toFixed(2)}` : "-")}
╠═════════════════════════════════════════════╣
║ MOQ distribution (pieces)                   ║
${[20, 30, 40, 50].map((v) => row(`  ${v} pcs:`, moqCounts[v])).join("\n")}
╚═════════════════════════════════════════════╝`);

  console.log("\nSample transformations:");
  samples.forEach((s) => console.log(`  ${s}`));

  process.exit(0);
}

run().catch((err) => {
  log.error(`Aborted: ${errText(err)}`);
  console.error(err);
  process.exit(1);
});
