// scripts/importSurgexa.ts
//
// Imports scraped outerwear and leather goods into the FinishedProduct
// collection, uploading product photography to Cloudinary.
//
// Usage:
//   npx tsx scripts/importSurgexa.ts --dry-run
//   npx tsx scripts/importSurgexa.ts
//
// Products go live on insert (isArchived: false, sampleAvailable: true).
// Re-run safe: duplicates are skipped by cleaned name and images upload with
// overwrite:false so an interrupted run can simply be restarted.
//
// NOTE ON MATERIAL: the source `material` field marks a large share of this
// range as Cordura / polyester / mesh textile rather than leather. The mapping
// below follows the segregation rules as specified, which files those under
// leather product types. That was a deliberate instruction — revisit
// materialUsed before quoting if that changes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(PROJECT_ROOT, ".env.local") });

const DATA_ROOT = "G:\\surgexa_scraper\\surgexa_data";
const DATA_FILE = path.join(DATA_ROOT, "all_data.json");
const MOQ_VALUES = [20, 30];
const UPLOAD_CONCURRENCY = 6;
const UPLOAD_ATTEMPTS = 4;

/** Source brand must never surface in a Pure Grain listing. */
const BRAND = /surgexa(\s+llc)?/gi;

// ────────────────────────────── logging ──────────────────────────────

const log = {
  start: (m: string) => console.log(`[START]    ${m}`),
  product: (m: string) => console.log(`[PRODUCT]  ${m}`),
  type: (m: string) => console.log(`[TYPE]     → ${m}`),
  map: (m: string) => console.log(`[MAP]      ${m}`),
  price: (m: string) => console.log(`[PRICE]    ${m}`),
  image: (m: string) => console.log(`[IMAGE]    ${m}`),
  svg: (m: string) => console.log(`[SKIP]     ⏩ SVG skipped: ${m}`),
  db: (m: string) => console.log(`[DB]       ✓ ${m}`),
  skip: (m: string) => console.log(`[SKIP]     ⏭  ${m}`),
  warn: (m: string) => console.log(`[WARN]     ⚠  ${m}`),
  error: (m: string) => console.log(`[ERROR]    ✗  ${m}`),
  dry: (m: string) => console.log(`[DRY RUN]  ${m}`),
};

function errText(err: any): string {
  if (!err) return "unknown error";
  if (typeof err === "string") return err;
  if (err.error?.message) {
    const c = err.error.http_code ? ` (http ${err.error.http_code})` : "";
    return `${err.error.message}${c}`;
  }
  if (err.message) return err.message;
  try { return JSON.stringify(err); } catch { return String(err); }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function titleCase(s: string): string {
  return String(s || "").toLowerCase().split(/\s+/).filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// ───────────────────────────── mapping ───────────────────────────────

/**
 * Strips the source brand and the marketing tagline that follows a dash.
 * 161 of 168 scraped names lead with the supplier's brand, so that is removed
 * before the tagline, otherwise "Surgexa ARC JACKET" keeps its prefix.
 */
export function cleanName(raw: string): string {
  let s = String(raw || "").replace(/\u2019/g, "'").trim();

  s = s.replace(BRAND, " ").replace(/\s+/g, " ").trim();

  // Drop a trailing "– tagline" / "- tagline" marketing clause.
  const dashed = s.split(/\s+[–—-]\s+/);
  if (dashed.length > 1) {
    const head = dashed[0].trim();
    if (head.length >= 5) s = head;
  }

  s = s.replace(/^[–—\-|,\s]+|[–—\-|,\s]+$/g, "").replace(/\s+/g, " ").trim();

  // Scraped names are frequently shouted; normalise anything fully uppercase.
  if (s && s === s.toUpperCase() && /[A-Z]{4,}/.test(s)) s = titleCase(s);

  return s;
}

export interface TypeResult { productType: string; category: string; reason: string }

/** productType and category, decided from categories → name → tags. */
export function segregate(p: any): TypeResult {
  const name = String(p.name || "").toLowerCase();
  const cats = (p.categories || []).join(" ").toLowerCase();
  const tags = (p.tags || []).join(" ").toLowerCase();
  const all = `${cats} ${name} ${tags}`;

  const moto = /biker|moto|motorcycle|cafe racer|cruiser|racing/;
  if (moto.test(name) || moto.test(cats) || moto.test(tags)) {
    return { productType: "Biker Jacket", category: "Biker Jackets", reason: "motorcycle/biker signal" };
  }
  if (/leather backpack|backpack/.test(cats) || /backpack/.test(name)) {
    return { productType: "Backpack", category: "Backpacks", reason: "backpack signal" };
  }
  if (/leather vest/.test(cats) || /vest/.test(name)) {
    return { productType: "Leather Vest", category: "Leather Vests", reason: "vest signal" };
  }
  if (/leather pant/.test(cats) || /\bpant|trouser/.test(name)) {
    return { productType: "Leather Pants", category: "Leather Pants", reason: "pants signal" };
  }
  if (/leather coat/.test(cats) || /\bcoat|trench/.test(name)) {
    return { productType: "Leather Coat", category: "Leather Coats", reason: "coat signal" };
  }
  if (/leather shoe|footwear/.test(cats) || /\bshoe|\bboot|sneaker/.test(name)) {
    return { productType: "Leather Footwear", category: "Leather Footwear", reason: "footwear signal" };
  }
  if (/leather gloves/.test(cats) || /glove/.test(name)) {
    return { productType: "Leather Gloves", category: "Leather Gloves", reason: "gloves signal" };
  }
  if ((/leather bag|handbag|luggage/.test(cats) || /\bbag|tote|satchel|briefcase|duffle/.test(name)) && !/backpack/.test(name)) {
    return { productType: "Leather Bag", category: "Leather Bags", reason: "bag signal" };
  }
  if (/leather jacket|men leather jacket|women leather jacket/.test(cats)) {
    return { productType: "Leather Jacket", category: "Leather Jackets", reason: "leather jacket category" };
  }
  void all;
  return { productType: "Leather Garment", category: "Leather Garments", reason: "no specific match" };
}

/** materialUsed — attributes, then tags, then name. */
export function mapMaterial(p: any): string {
  const attrs = p.attributes || {};
  const material = String(attrs["Material"] || "");
  const fabric = String(attrs["Fabric Type"] || "");
  const tags = (p.tags || []).join(" ").toLowerCase();
  const name = String(p.name || "").toLowerCase();

  const rules: Array<[RegExp, string]> = [
    [/full grain/, "Full Grain Leather"],
    [/lambskin/, "Lambskin Leather"],
    [/cowhide/, "Cowhide Leather"],
    [/buffalo/, "Buffalo Leather"],
    [/suede/, "Suede Leather"],
    [/nappa/, "Nappa Leather"],
    [/genuine leather/, "Genuine Leather"],
  ];

  // "Available in required Material" means made-to-spec — no signal.
  if (material && !/available in required/i.test(material)) {
    for (const [re, val] of rules) if (re.test(material.toLowerCase())) return val;
  }
  for (const [re, val] of rules) if (re.test(tags)) return val;
  for (const [re, val] of rules) if (re.test(name)) return val;
  if (/leather/i.test(fabric)) return "Genuine Leather";

  return "Genuine Leather";
}

/** Size range out of "Choose an option 2XL 3XL 4XL 5XL 6XL L M S". */
function sizeRange(attrs: Record<string, string>): string {
  const raw = String(attrs?.["Size"] || "");
  if (!raw) return "";
  const order = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"];
  const found = order.filter((s) => new RegExp(`(^|\\s)${s}(\\s|$)`, "i").test(raw));
  if (!found.length) return "";
  return found.length === 1 ? found[0] : `${found[0]} to ${found[found.length - 1]}`;
}

export function mapDimensions(p: any, productType: string): string {
  const attrs = p.attributes || {};
  if (["Leather Jacket", "Biker Jacket", "Leather Coat", "Leather Vest"].includes(productType)) {
    const r = sizeRange(attrs);
    return r ? `Available sizes: ${r}` : "Standard sizing — S to 4XL";
  }
  if (productType === "Backpack" || productType === "Leather Bag") return "See product description";
  if (productType === "Leather Footwear") return "Standard sizing available";
  return "Custom sizing available";
}

const COLOUR_NOISE = /^(choose an option|clear|custom|select|option)$/i;

export function mapColors(p: any): string[] {
  const raw = String(p.attributes?.["Color"] || "");
  if (!raw) return [];

  // The option picker renders as one run-on string: strip its chrome, then
  // split the remaining colour words.
  const cleaned = raw.replace(/choose an option/gi, " ").replace(/\bclear\b/gi, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  const found = cleaned
    .split(/\s*(?:,|\/|\|)\s*|\s{2,}/)
    .flatMap((chunk) => {
      // "Black Custom Made" → ["Black", "Custom Made"]
      const m = chunk.match(/custom made/i);
      if (m) return [chunk.replace(/custom made/i, "").trim(), "Custom Made"];
      return [chunk];
    })
    .map((c) => titleCase(String(c || "").trim()))
    .filter((c) => c && !COLOUR_NOISE.test(c) && c.length > 1);

  const uniq = [...new Set(found)];
  if (!uniq.length) return [];
  if (uniq.length === 1 && /^custom made$/i.test(uniq[0])) return [];
  return uniq;
}

export function mapAvailability(p: any): { availability: "In Stock" | "Made to Order" | "Limited Stock"; stockCount: number } {
  const raw = String(p.availability ?? "").trim();
  if (!raw) return { availability: "Made to Order", stockCount: 0 };
  const lower = raw.toLowerCase();
  const num = raw.match(/(\d+)/);
  const stockCount = num ? parseInt(num[1], 10) : 0;

  if (/out of stock/.test(lower)) return { availability: "Limited Stock", stockCount: 0 };
  if (/in stock/.test(lower) || stockCount > 0) return { availability: "In Stock", stockCount };
  return { availability: "Made to Order", stockCount: 0 };
}

// ───────────────────────────── pricing ───────────────────────────────

/**
 * Wholesale band per product type, in USD per unit. The scrape carries a flat
 * $135 on every product, so a percentage discount would price the whole range
 * identically; these bands vary by what the article actually is.
 */
const PRICE_BANDS: Record<string, [number, number]> = {
  "Leather Coat": [112, 120],
  "Biker Jacket": [108, 118],
  "Leather Jacket": [104, 114],
  "Leather Pants": [100, 110],
  "Leather Vest": [96, 106],
  Backpack: [96, 106],
  "Leather Bag": [94, 104],
  "Leather Garment": [94, 104],
  "Leather Footwear": [92, 102],
  "Leather Gloves": [90, 98],
};

function seedFrom(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic price inside the type's band, so re-runs are stable. */
export function priceFor(productType: string, name: string): { price: number; band: [number, number] } {
  const band = PRICE_BANDS[productType] || [94, 104];
  const [lo, hi] = band;
  const steps = Math.round((hi - lo) * 2); // half-dollar granularity
  const pick = steps > 0 ? seedFrom(name) % (steps + 1) : 0;
  const price = Math.round((lo + pick / 2) * 100) / 100;
  return { price, band };
}

// ──────────────────────── description writing ────────────────────────

function featureBits(p: any, cleaned: string): string[] {
  const blob = `${cleaned} ${(p.tags || []).join(" ")} ${p.short_description || ""}`.toLowerCase();
  const bits: string[] = [];
  if (/waterproof/.test(blob)) bits.push("waterproof shell");
  if (/armor|armour|ce /.test(blob)) bits.push("CE armour pockets");
  if (/mesh|air-?flow|breathab/.test(blob)) bits.push("ventilated panels");
  if (/reflect/.test(blob)) bits.push("reflective detailing");
  if (/handcraft|handmade/.test(blob)) bits.push("hand-finished construction");
  if (/laptop/.test(blob)) bits.push("padded laptop sleeve");
  if (/vintage/.test(blob)) bits.push("vintage-finish surface");
  if (/touring|adventure/.test(blob)) bits.push("touring-weight build");
  return bits;
}

function applicationsFor(productType: string): string[] {
  switch (productType) {
    case "Biker Jacket": return ["Motorcycle Retail", "Rider Outfitting", "Club and Team Orders"];
    case "Leather Jacket": return ["Fashion Retail", "Private Label", "Corporate Gifting"];
    case "Leather Coat": return ["Outerwear Retail", "Private Label", "Seasonal Collections"];
    case "Leather Vest": return ["Rider Outfitting", "Fashion Retail", "Uniform Programmes"];
    case "Leather Pants": return ["Rider Outfitting", "Performance Apparel", "Private Label"];
    case "Backpack": return ["Business Travel Retail", "Corporate Gifting", "Campus and Lifestyle"];
    case "Leather Bag": return ["Travel Retail", "Corporate Gifting", "Boutique Stockists"];
    case "Leather Footwear": return ["Footwear Retail", "Uniform Programmes", "Private Label"];
    case "Leather Gloves": return ["Rider Outfitting", "Workwear Supply", "Retail Accessories"];
    default: return ["Wholesale Retail", "Private Label", "Corporate Gifting"];
  }
}

/** Original B2B copy — nothing is carried over from the scraped text. */
export function buildDescription(p: any, cleaned: string, t: TypeResult, material: string, dims: string): string {
  const attrs = p.attributes || {};
  const feats = featureBits(p, cleaned);
  const customisable = /any design as per requirement/i.test(String(attrs["Design"] || "")) ||
    /customi[sz]e/i.test(String(attrs["LOGO"] || ""));

  const article = t.productType.toLowerCase();
  const s1 = `The ${cleaned} is a ${article} built in ${material.toLowerCase()} for wholesale and private-label programmes.`;

  const s2 = feats.length
    ? `It carries ${feats.slice(0, 3).join(", ")}, specified for repeat production rather than one-off sampling.`
    : `Construction is specified for repeat production, with consistent sizing and finish across a run.`;

  const s3 = customisable
    ? `Design, colourway and branding are open to customisation, and orders are quoted per unit against your own tech pack.`
    : `Orders are quoted per unit, with bulk pricing available against confirmed quantities.`;

  const size = /Available sizes: (.+)$/.exec(dims)?.[1] || "";
  const specParts = [material, size ? `Sizes ${size}` : "", feats[0] ? titleCase(feats[0]) : "", "Made in Pakistan"]
    .map((x) => String(x || "").trim())
    .filter(Boolean);

  const lines = [
    [s1, s2, s3].join(" "),
    `Specifications: ${specParts.join(" | ")}`,
    `Applications: ${applicationsFor(t.productType).join(" · ")}`,
  ];
  return lines.join("\n\n").replace(BRAND, "").replace(/\s{2,}/g, " ").trim();
}

export function buildTags(p: any, t: TypeResult, material: string, cleaned: string): string[] {
  const attrs = p.attributes || {};
  const src = (p.tags || []).map((x: any) => String(x));
  const name = cleaned.toLowerCase();
  const tagBlob = src.join(" ").toLowerCase();

  const out = [...src, t.productType, t.category, material];
  if (/any design as per requirement/i.test(String(attrs["Design"] || "")) || /customi[sz]e/i.test(String(attrs["LOGO"] || ""))) out.push("Customizable");
  if (/handcrafted|handmade/.test(`${name} ${tagBlob}`)) out.push("Handcrafted");
  if (/waterproof/.test(name)) out.push("Waterproof");
  if (/armor|armour/.test(name)) out.push("Armored");
  if (/full grain leather/.test(tagBlob)) out.push("Full Grain");

  return [...new Set(
    out
      .map((x) => String(x || "").replace(BRAND, "").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .map((x) => titleCase(x))
  )].filter(Boolean);
}

export function slugify(name: string): string {
  return String(name || "")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2019/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";
}

// ──────────────────────── upload plumbing ────────────────────────────

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

async function uploadWithRetry(cloudinary: any, localPath: string, options: Record<string, unknown>, onRetry: (a: number, m: string) => void) {
  let lastErr: any;
  for (let attempt = 1; attempt <= UPLOAD_ATTEMPTS; attempt++) {
    try {
      return await cloudinary.uploader.upload(localPath, options);
    } catch (err: any) {
      lastErr = err;
      const msg = errText(err);
      if (/already exists/i.test(msg)) throw err;
      if (attempt < UPLOAD_ATTEMPTS) { onRetry(attempt, msg); await sleep(1000 * 2 ** (attempt - 1)); }
    }
  }
  throw lastErr;
}

// ──────────────────────────────── run ────────────────────────────────

async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  if (!fs.existsSync(DATA_FILE)) {
    log.error(`all_data.json not found at ${DATA_FILE}`);
    process.exit(1);
  }

  log.start(`Reading: ${DATA_FILE}`);
  const raw: any[] = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  log.start(`Total products: ${raw.length}${dryRun ? "  (DRY RUN)" : ""}`);

  const { default: connectDB } = await import("../lib/config/db");
  const { default: cloudinary } = await import("../lib/config/cloudinary");
  const { default: FinishedProduct } = await import("../lib/models/FinishedProduct");
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!dryRun) await connectDB();

  const stats = { found: raw.length, inserted: 0, duplicates: 0, failed: 0, images: 0, svgSkipped: 0, imagesFailed: 0, noName: 0 };
  const byType: Record<string, number> = {};
  const moqCounts: Record<number, number> = { 20: 0, 30: 0 };
  const seen = new Set<string>();
  let shown = 0;

  for (const p of raw) {
    if (!p?.name) {
      stats.noName++;
      log.skip(`Record with no name (scraper error) — ${String(p?.url || "unknown url")}`);
      continue;
    }

    const cleaned = cleanName(p.name);
    log.product(`${p.name}`);

    try {
      if (!cleaned || cleaned.length < 3) {
        stats.failed++;
        log.error(`Failed: ${p.name} — name cleaned to nothing usable`);
        continue;
      }

      if (seen.has(cleaned.toLowerCase())) {
        stats.duplicates++;
        log.skip(`Duplicate: ${cleaned}`);
        continue;
      }
      if (!dryRun) {
        const exists = await FinishedProduct.findOne({ name: cleaned });
        if (exists) {
          seen.add(cleaned.toLowerCase());
          stats.duplicates++;
          log.skip(`Duplicate: ${cleaned}`);
          continue;
        }
      }
      seen.add(cleaned.toLowerCase());

      const t = segregate(p);
      const material = mapMaterial(p);
      const dims = mapDimensions(p, t.productType);
      const colors = mapColors(p);
      const moq = MOQ_VALUES[Math.floor(Math.random() * MOQ_VALUES.length)];
      const { availability, stockCount } = mapAvailability(p);
      const { price, band } = priceFor(t.productType, cleaned);
      const retail = p?.price?.current_price;

      log.type(`productType: "${t.productType}" | category: "${t.category}"  (${t.reason})`);
      log.map(`material=${material} | dims=${dims}`);
      log.map(`colors=${JSON.stringify(colors)} | moq=${moq} | availability=${availability} (${stockCount})`);
      log.price(
        `${retail ? `$${Number(retail).toFixed(2)} retail → ` : ""}$${price.toFixed(2)} wholesale (${t.productType} band $${band[0]}–$${band[1]})`
      );

      // ── images: drop SVGs, then number the survivors from 01 ──
      const sources: string[] = Array.isArray(p.downloaded_images) ? p.downloaded_images : [];
      const raster = sources.filter((rel) => {
        if (/\.svg$/i.test(rel)) {
          stats.svgSkipped++;
          log.svg(String(rel).split("/").pop() || String(rel));
          return false;
        }
        return /\.(jpe?g|png|webp)$/i.test(rel);
      });

      const slug = slugify(cleaned);
      const folder = `pure-grain-exports/finished-products/${slug}`;

      const slots = await mapWithConcurrency(raster, UPLOAD_CONCURRENCY, async (rel, i): Promise<string | null> => {
        const idx = String(i + 1).padStart(2, "0");
        const filename = String(rel).split("/").pop() || "";
        const localPath = path.join(DATA_ROOT, String(rel).replace(/\//g, path.sep));

        if (!fs.existsSync(localPath)) {
          log.warn(`Image not found: ${localPath}`);
          stats.imagesFailed++;
          return null;
        }

        const publicId = `${idx}-${filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-")}`;

        if (dryRun) {
          log.image(`Would upload ${i + 1}/${raster.length}: ${filename} → ${folder}/${publicId}`);
          stats.images++;
          return `https://res.cloudinary.com/${cloudName}/image/upload/${folder}/${publicId}`;
        }

        log.image(`Uploading ${i + 1}/${raster.length}: ${filename}`);
        try {
          const res: any = await uploadWithRetry(
            cloudinary,
            localPath,
            { folder, public_id: publicId, use_filename: false, overwrite: false, resource_type: "image", quality: "auto", fetch_format: "auto" },
            (a, m) => log.image(`↻ Retry ${a}/${UPLOAD_ATTEMPTS - 1}: ${filename} — ${m}`)
          );
          stats.images++;
          if (res.existing) log.image(`⏭ Already exists: ${filename} → ${res.secure_url}`);
          else log.image(`✓ ${i + 1}/${raster.length} → ${res.secure_url}`);
          return res.secure_url as string;
        } catch (err: any) {
          const msg = errText(err);
          if (/already exists/i.test(msg)) {
            const url = `https://res.cloudinary.com/${cloudName}/image/upload/${folder}/${publicId}`;
            stats.images++;
            log.image(`⏭ Already exists: ${filename} → ${url}`);
            return url;
          }
          log.image(`✗ Failed: ${filename} — ${msg}`);
          stats.imagesFailed++;
          return null;
        }
      });

      const images = slots.filter((u): u is string => Boolean(u));
      if (!images.length) log.warn(`No images for: ${cleaned}`);

      const description = buildDescription(p, cleaned, t, material, dims);
      const tags = buildTags(p, t, material, cleaned);

      const doc = {
        name: cleaned,
        productType: t.productType,
        materialUsed: material,
        dimensions: dims,
        moq,
        colorVariants: colors,
        description,
        images,
        isFeatured: false,
        sampleAvailable: true,
        pricePerUnit: price,
        priceUnit: "unit",
        currency: "USD",
        availability,
        stockCount,
        category: t.category,
        tags,
        isActive: true,
        isArchived: false,
      };

      if (dryRun && shown < 5) {
        shown++;
        console.log(`\n[DRY RUN]  ── transformation ${shown}/5 ──`);
        console.log(`           ORIGINAL : ${p.name}`);
        console.log(`           CLEANED  : ${cleaned}`);
        console.log(`           TYPE     : ${t.productType} / ${t.category}   (${t.reason})`);
        console.log(`           MATERIAL : ${material}`);
        console.log(`           DIMS     : ${dims}`);
        console.log(`           COLORS   : ${JSON.stringify(colors)}   MOQ: ${moq}`);
        console.log(`           PRICE    : $${price.toFixed(2)}  band $${band[0]}–$${band[1]}`);
        console.log(`           IMAGES   : ${images.length} (SVGs excluded)`);
        console.log(`           TAGS     : ${JSON.stringify(tags)}`);
        console.log(`           DESCRIPTION:`);
        description.split("\n").filter(Boolean).forEach((l) => console.log(`                      ${l}`));
        console.log("");
      }

      if (!dryRun) {
        const res = await FinishedProduct.updateOne({ name: cleaned }, { $setOnInsert: doc }, { upsert: true });
        if (res.upsertedCount > 0) {
          log.db(`Inserted: ${cleaned} ($${price.toFixed(2)} | ${images.length} images | ${t.productType})`);
        } else {
          stats.duplicates++;
          log.skip(`Duplicate: ${cleaned} — inserted by a concurrent run`);
          continue;
        }
      }

      byType[t.productType] = (byType[t.productType] || 0) + 1;
      moqCounts[moq]++;
      stats.inserted++;
    } catch (err: any) {
      stats.failed++;
      log.error(`Failed: ${p.name} — ${errText(err)}`);
    }
  }

  if (dryRun) console.log("\n[DRY RUN] No changes written");
  if (!dryRun) {
    const mongoose = (await import("mongoose")).default;
    await mongoose.disconnect();
  }

  const row = (l: string, v: string | number) => `║ ${l.padEnd(28)}${String(v).padEnd(21)}║`;
  const TYPES = ["Leather Jacket", "Biker Jacket", "Backpack", "Leather Vest", "Leather Coat", "Leather Pants", "Leather Bag", "Leather Footwear", "Leather Gloves", "Leather Garment"];

  console.log(`
╔══════════════════════════════════════════════════╗
║    PURE GRAIN EXPORTS — SURGEXA IMPORT ${dryRun ? "DRY RUN" : "DONE   "}  ║
╠══════════════════════════════════════════════════╣
${row("Total products found:", stats.found)}
${row(dryRun ? "Would insert:" : "Successfully inserted:", stats.inserted)}
${row("Skipped (duplicates):", stats.duplicates)}
${row("Skipped (no name):", stats.noName)}
${row("Failed:", stats.failed)}
${row("Images uploaded:", stats.images)}
${row("SVG files skipped:", stats.svgSkipped)}
${row("Images failed/missing:", stats.imagesFailed)}
╠══════════════════════════════════════════════════╣
║ By product type:                                 ║
${TYPES.map((t) => row(`  ${t}:`, byType[t] || 0)).join("\n")}
╠══════════════════════════════════════════════════╣
║ MOQ distribution:                                ║
${row("  20 assigned:", moqCounts[20])}
${row("  30 assigned:", moqCounts[30])}
╠══════════════════════════════════════════════════╣
║ All products:                                    ║
║   isArchived:      false ✓ (live immediately)    ║
║   sampleAvailable: true  ✓                       ║
║   isActive:        true  ✓                       ║
╚══════════════════════════════════════════════════╝`);

  process.exit(0);
}

run().catch((err) => {
  log.error(`Import aborted: ${errText(err)}`);
  console.error(err);
  process.exit(1);
});
