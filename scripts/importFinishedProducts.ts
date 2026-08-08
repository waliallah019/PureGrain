// scripts/importFinishedProducts.ts
//
// Bulk-imports scraped Florence Leather Market products into the
// FinishedProduct collection, uploading every product photo to Cloudinary.
//
// Usage:
//   npx tsx scripts/importFinishedProducts.ts --dry-run
//   npx tsx scripts/importFinishedProducts.ts
//   npx tsx scripts/importFinishedProducts.ts "G:\florenceleathermarket_scraper"
//
// Prices are quoted in EUR at source and converted with a rate fetched live at
// run time — never hardcoded. If both rate APIs fail the run aborts.
//
// Re-run safe: products are de-duplicated by `name`, and images upload with
// `overwrite: false` so an interrupted run can simply be restarted.
//
// Every imported product is written with `isArchived: true` — nothing reaches
// the live site until it is reviewed and un-archived in the admin panel.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Load env before importing anything that reads process.env at module scope
// (lib/config/db.ts throws on a missing MONGO_URI, lib/config/cloudinary.ts
// configures the SDK on import), hence the dynamic imports inside run().
dotenv.config({ path: path.join(PROJECT_ROOT, ".env.local") });

const DEFAULT_ROOT = "G:\\florenceleathermarket_scraper";

// ─────────────────────────────── types ───────────────────────────────

interface ScrapedProduct {
  url: string;
  name: string;
  price: string;
  currency: string;
  image_urls?: string[];
  local_images: string[];
  features?: Record<string, string>;
  description: string;
  category: string;
}

interface MappedProduct {
  name: string;
  productType: string;
  materialUsed: string;
  dimensions: string;
  moq: number;
  colorVariants: string[];
  description: string;
  images: string[];
  isFeatured: boolean;
  sampleAvailable: boolean;
  pricePerUnit: number;
  priceUnit: string;
  currency: string;
  availability: "In Stock" | "Made to Order" | "Limited Stock";
  stockCount: number;
  category: string;
  tags: string[];
  isActive: boolean;
  isArchived: boolean;
}

// ────────────────────────────── logging ──────────────────────────────

const log = {
  rate: (m: string) => console.log(`[RATE]     ${m}`),
  start: (m: string) => console.log(`[START]    ${m}`),
  category: (m: string) => console.log(`\n[CATEGORY] ── ${m} ──`),
  product: (m: string) => console.log(`[PRODUCT]  ${m}`),
  map: (m: string) => console.log(`[MAP]      ${m}`),
  image: (m: string) => console.log(`[IMAGE]    ${m}`),
  db: (m: string) => console.log(`[DB]       ${m}`),
  skip: (m: string) => console.log(`[SKIP]     ⏭  ${m}`),
  warn: (m: string) => console.log(`[WARN]     ⚠  ${m}`),
  error: (m: string) => console.log(`[ERROR]    ✗  ${m}`),
  dry: (m: string) => console.log(`[DRY-RUN]  ${m}`),
};

/**
 * The Cloudinary SDK rejects with a bare `{ error: { message, http_code } }`
 * object that has no `.message` of its own, which stringifies to
 * "[object Object]". Dig the real text out.
 */
function errText(err: any): string {
  if (!err) return "unknown error";
  if (typeof err === "string") return err;
  if (err.error?.message) {
    const code = err.error.http_code ? ` (http ${err.error.http_code})` : "";
    return `${err.error.message}${code}`;
  }
  if (err.message) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

// ───────────────────────── exchange rate ─────────────────────────────

/** Fetches EUR→USD live. Never falls back to a hardcoded rate. */
async function fetchUsdRate(): Promise<{ rate: number; source: string; fetchedAt: string }> {
  const endpoints = [
    { url: "https://api.exchangerate-api.com/v4/latest/EUR", pick: (j: any) => j?.rates?.USD },
    { url: "https://open.er-api.com/v6/latest/EUR", pick: (j: any) => j?.rates?.USD },
  ];

  const failures: string[] = [];
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const json: any = await res.json();
      const rate = Number(ep.pick(json));
      if (!Number.isFinite(rate) || rate <= 0) throw new Error("rates.USD missing or not a positive number");
      return { rate, source: ep.url, fetchedAt: new Date().toISOString() };
    } catch (err: any) {
      failures.push(`${ep.url} — ${errText(err)}`);
    }
  }

  throw new Error(`Both exchange-rate APIs failed:\n           ${failures.join("\n           ")}`);
}

// ───────────────────────────── mapping ───────────────────────────────

/** productType — derived from the scraped category slug. */
function mapProductType(category: string): string {
  const c = (category || "").toLowerCase();

  // Longest/most specific first: the data ships mens_belts / womens_belts
  // rather than a bare "belts", and a plain first-word capitalisation would
  // yield "Mens" — not a product type.
  if (c.includes("wallet")) return "Wallet";
  if (c.includes("belt")) return "Belt";
  if (c.includes("cardholder") || c.includes("card_holder")) return "Card Holder";
  if (c.includes("handbag")) return "Bag";
  if (c.includes("backpack")) return "Backpack";
  if (c.includes("briefcase")) return "Briefcase";
  if (c.includes("clutch")) return "Clutch";
  if (c.includes("purse")) return "Purse";
  if (c.includes("bag")) return "Bag";
  if (c.includes("accessor")) return "Accessory";

  const first = c.split("_")[0] || "Product";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/**
 * materialUsed — the name is scanned in full before the description, so a
 * product literally called "... in cow leather" maps to Cowhide even when the
 * body copy also mentions calfskin. Within each pass the rule order decides.
 */
function mapMaterial(name: string, description: string): string {
  const rules: Array<[string, string]> = [
    ["calfskin", "Calfskin Leather"],
    ["cow leather", "Cowhide Leather"],
    ["vintage leather", "Vintage Leather"],
    ["full grain", "Full Grain Leather"],
    ["top grain", "Top Grain Leather"],
    ["genuine leather", "Genuine Leather"],
    ["goatskin", "Goatskin Leather"],
    ["suede", "Suede Leather"],
    ["nappa", "Nappa Leather"],
    ["cowhide", "Cowhide Leather"],
    ["italian leather", "Italian Leather"],
    ["leather", "Genuine Leather"],
  ];

  for (const haystack of [String(name || "").toLowerCase(), String(description || "").toLowerCase()]) {
    for (const [needle, value] of rules) {
      if (haystack.includes(needle)) return value;
    }
  }
  return "Italian Leather";
}

/**
 * "12 cm 4.7 in" → "12 cm". Some entries carry the unit with no number at all
 * ("cm in"), which would otherwise render as "12 cm x cm", so a value without
 * a digit is treated as absent.
 */
function cmPart(raw: string | undefined): string {
  const v = String(raw || "").trim();
  if (!v || !/\d/.test(v)) return "";
  const m = v.match(/^([\d.,]+)\s*(cm|mm|m)\b/i);
  if (m) return `${m[1]} ${m[2].toLowerCase()}`;
  // No recognised unit — fall back to the leading number.
  const n = v.match(/^[\d.,]+/);
  return n ? n[0] : "";
}

/** dimensions — Length x Width, else Length x Height, else Length, else text. */
function mapDimensions(features: Record<string, string> | undefined): string {
  const f = features || {};
  const length = cmPart(f["Length"]);
  const width = cmPart(f["Width"]);
  const height = cmPart(f["Height"]);

  if (length && width) return `${length} x ${width}`;
  if (length && height) return `${length} x ${height}`;
  if (length) return length;
  // Length is absent but another axis is present — better than nothing.
  if (width && height) return `${width} x ${height}`;
  if (width) return width;
  if (height) return height;
  return "See description";
}

const COLOR_KEYWORDS = [
  // Compound names first so "Dark Brown" is not captured as plain "Brown".
  "Dark Brown", "Light Brown", "Burgundy", "Cognac", "Natural", "Honey",
  "Black", "Brown", "Tan", "Navy", "Blue", "Red", "Green", "Grey", "Gray",
  "White", "Cream", "Beige", "Wine", "Camel",
];

/** colorVariants — scanned from description and name, de-duplicated. */
function mapColors(name: string, description: string): string[] {
  const haystack = `${name} ${description}`;
  const found: string[] = [];
  let remaining = haystack;

  for (const color of COLOR_KEYWORDS) {
    const re = new RegExp(`\\b${color.replace(/\s+/g, "\\s+")}\\b`, "i");
    if (re.test(remaining)) {
      found.push(color);
      // Consume the match so "Dark Brown" does not also register "Brown".
      remaining = remaining.replace(new RegExp(`\\b${color.replace(/\s+/g, "\\s+")}\\b`, "gi"), " ");
    }
  }

  return [...new Set(found)];
}

/** category — "mens_wallets" → "Mens Wallets". */
function mapCategory(category: string): string {
  const known: Record<string, string> = {
    mens_wallets: "Mens Wallets",
    womens_wallets: "Womens Wallets",
    bags: "Bags",
    handbags: "Handbags",
    belts: "Belts",
    purses: "Purses",
    backpacks: "Backpacks",
    briefcases: "Briefcases",
    cardholders: "Card Holders",
    clutches: "Clutches",
    accessories: "Accessories",
  };
  const c = (category || "").toLowerCase();
  if (known[c]) return known[c];

  return c
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** tags — category, type, material, origin, colours and content flags. */
function mapTags(
  cleanCategory: string,
  productType: string,
  materialUsed: string,
  colorVariants: string[],
  description: string
): string[] {
  const d = (description || "").toLowerCase();
  const tags = [
    cleanCategory,
    productType,
    materialUsed,
    "Italian Leather",
    ...colorVariants,
  ];

  if (d.includes("handmade") || d.includes("handcrafted")) tags.push("Handmade");
  if (d.includes("florence")) tags.push("Florence");

  // Validator rejects empty tag strings.
  return [...new Set(tags.map((t) => String(t || "").trim()).filter(Boolean))];
}

/** Cloudinary-safe slug from the product name. */
function slugify(name: string): string {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";
}

function mapProduct(p: ScrapedProduct, images: string[], usdRate: number): MappedProduct {
  const description = String(p.description || "");
  const productType = mapProductType(p.category);
  const materialUsed = mapMaterial(p.name, description);
  const colorVariants = mapColors(p.name, description);
  const cleanCategory = mapCategory(p.category);

  const eur = parseFloat(String(p.price));
  const pricePerUnit = Math.round((eur * usdRate + Number.EPSILON) * 100) / 100;

  return {
    name: p.name,
    productType,
    materialUsed,
    dimensions: mapDimensions(p.features),
    moq: 1,
    colorVariants,
    description: `[REVIEW BEFORE PUBLISHING] ${description}`,
    images,
    isFeatured: false,
    sampleAvailable: false,
    pricePerUnit,
    priceUnit: "unit",
    currency: "USD",
    availability: "Made to Order",
    stockCount: 0,
    category: cleanCategory,
    tags: mapTags(cleanCategory, productType, materialUsed, colorVariants, description),
    isActive: true,
    isArchived: true, // non-negotiable: nothing goes live without manual review
  };
}

// ────────────────────────── upload plumbing ──────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Uploads are latency-bound rather than bandwidth-bound, so a small pool is
 * used per product. Results are written back by index, which keeps the stored
 * image order identical to `local_images`.
 */
const UPLOAD_CONCURRENCY = 6;

/** Cloudinary times out sporadically under concurrency; these retries clear it. */
const UPLOAD_ATTEMPTS = 4;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
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

async function uploadWithRetry(
  cloudinary: any,
  localPath: string,
  options: Record<string, unknown>,
  onRetry: (attempt: number, msg: string) => void
): Promise<any> {
  let lastErr: any;
  for (let attempt = 1; attempt <= UPLOAD_ATTEMPTS; attempt++) {
    try {
      return await cloudinary.uploader.upload(localPath, options);
    } catch (err: any) {
      lastErr = err;
      const msg = errText(err);
      if (/already exists/i.test(msg)) throw err;
      if (attempt < UPLOAD_ATTEMPTS) {
        onRetry(attempt, msg);
        await sleep(1000 * 2 ** (attempt - 1)); // 1s, 2s, 4s
      }
    }
  }
  throw lastErr;
}

// ──────────────────────────────── run ────────────────────────────────

async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const root = args.find((a) => !a.startsWith("--")) || DEFAULT_ROOT;

  const dataPath = path.join(root, "products_full_data.json");
  if (!fs.existsSync(dataPath)) {
    log.error(`products_full_data.json not found at ${dataPath}`);
    process.exit(1);
  }

  // ── live EUR→USD rate, before anything else ──
  let usdRate: number;
  try {
    const r = await fetchUsdRate();
    usdRate = r.rate;
    log.rate(`1 EUR = $${usdRate} USD (fetched ${r.fetchedAt})`);
    log.rate(`source: ${r.source}`);
  } catch (err: any) {
    log.error(errText(err));
    log.error("No hardcoded fallback — aborting. Re-run when a rate API is reachable.");
    process.exit(1);
    return;
  }

  const products: ScrapedProduct[] = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  log.start(
    `${products.length} products found in products_full_data.json${dryRun ? "  (DRY RUN — no uploads, no writes)" : ""}`
  );

  // Deferred so dotenv has already populated process.env.
  const { default: connectDB } = await import("../lib/config/db");
  const { default: cloudinary } = await import("../lib/config/cloudinary");
  const { default: FinishedProduct } = await import("../lib/models/FinishedProduct");
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!dryRun) {
    await connectDB();
  }

  const stats = {
    found: products.length,
    inserted: 0,
    duplicates: 0,
    failed: 0,
    imagesUploaded: 0,
    imagesFailed: 0,
  };
  const perCategory: Record<string, number> = {};

  let detailShown = 0;
  let currentCategory = "";

  for (const p of products) {
    if (p.category !== currentCategory) {
      currentCategory = p.category;
      const count = products.filter((x) => x.category === currentCategory).length;
      log.category(`${mapCategory(currentCategory)} (${count} products)`);
    }

    log.product(p.name);

    try {
      // ── duplicate check ──
      if (!dryRun) {
        const exists = await FinishedProduct.findOne({ name: p.name });
        if (exists) {
          log.skip(`Duplicate: ${p.name}`);
          stats.duplicates++;
          continue;
        }
      }

      const slug = slugify(p.name);
      const folder = `pure-grain-exports/finished-products/${slug}`;
      const sources = Array.isArray(p.local_images) ? p.local_images : [];

      // ── images ──
      const slots = await mapWithConcurrency(
        sources,
        UPLOAD_CONCURRENCY,
        async (rel, i): Promise<string | null> => {
          const idx = String(i + 1).padStart(2, "0");
          const filename = String(rel).split(/[\\/]/).pop() || "";
          const localPath = path.join(root, String(rel).replace(/\\/g, "/"));

          if (!fs.existsSync(localPath)) {
            log.warn(`Image not found: ${localPath}`);
            stats.imagesFailed++;
            return null;
          }

          const publicId = `${idx}-${filename.replace(/\.[^.]+$/, "")}`;

          if (dryRun) {
            log.image(`Would upload ${i + 1}/${sources.length}: ${filename} → ${folder}/${publicId}`);
            stats.imagesUploaded++;
            return `https://res.cloudinary.com/${cloudName}/image/upload/${folder}/${publicId}`;
          }

          log.image(`Uploading ${i + 1}/${sources.length}: ${filename}`);
          try {
            const res: any = await uploadWithRetry(
              cloudinary,
              localPath,
              {
                folder,
                public_id: publicId,
                use_filename: false,
                overwrite: false,
                resource_type: "image",
                quality: "auto",
                fetch_format: "auto",
              },
              (attempt, msg) =>
                log.image(`↻ Retry ${attempt}/${UPLOAD_ATTEMPTS - 1}: ${filename} — ${msg}`)
            );

            stats.imagesUploaded++;
            if (res.existing) {
              log.image(`⏭ Already exists: ${filename} → ${res.secure_url}`);
            } else {
              log.image(`✓ ${i + 1}/${sources.length} → ${res.secure_url}`);
            }
            return res.secure_url as string;
          } catch (err: any) {
            const msg = errText(err);
            if (/already exists/i.test(msg)) {
              const url = `https://res.cloudinary.com/${cloudName}/image/upload/${folder}/${publicId}`;
              stats.imagesUploaded++;
              log.image(`⏭ Already exists: ${filename} → ${url}`);
              return url;
            }
            log.image(`✗ Failed: ${filename} — ${msg}`);
            stats.imagesFailed++;
            return null;
          }
        }
      );

      const successfulUrls = slots.filter((u): u is string => Boolean(u));
      if (successfulUrls.length === 0) {
        log.warn(`No images for: ${p.name}`);
      }

      // ── map ──
      const mapped = mapProduct(p, successfulUrls, usdRate);
      const eur = parseFloat(String(p.price));

      log.map(
        `type=${mapped.productType} material=${mapped.materialUsed} dims=${mapped.dimensions}`
      );
      log.map(`€${eur.toFixed(2)} → $${mapped.pricePerUnit.toFixed(2)} USD (rate: ${usdRate})`);
      log.map(
        `colors=${JSON.stringify(mapped.colorVariants)} tags=${JSON.stringify(mapped.tags)}`
      );

      if (dryRun && detailShown < 3) {
        detailShown++;
        log.dry(`Full mapping #${detailShown} for "${p.name}":`);
        console.log(
          JSON.stringify(
            { ...mapped, description: `${mapped.description.slice(0, 120)}…` },
            null,
            2
          )
            .split("\n")
            .map((l) => `           ${l}`)
            .join("\n")
        );
      }

      // ── insert ──
      if (dryRun) {
        log.dry(
          `Would insert: ${mapped.name} ($${mapped.pricePerUnit.toFixed(2)} | ${successfulUrls.length} images, isArchived=true)`
        );
        stats.inserted++;
        perCategory[mapped.category] = (perCategory[mapped.category] || 0) + 1;
      } else {
        // Atomic insert-if-absent. The findOne above is a fast path but races
        // with any concurrent run; $setOnInsert + upsert decides server-side.
        const res = await FinishedProduct.updateOne(
          { name: mapped.name },
          { $setOnInsert: mapped },
          { upsert: true }
        );

        if (res.upsertedCount > 0) {
          log.db(
            `✓ Inserted: ${mapped.name} ($${mapped.pricePerUnit.toFixed(2)} | ${successfulUrls.length} images)`
          );
          stats.inserted++;
          perCategory[mapped.category] = (perCategory[mapped.category] || 0) + 1;
        } else {
          log.skip(`Duplicate: ${mapped.name} — inserted by a concurrent run`);
          stats.duplicates++;
        }
      }
    } catch (err: any) {
      log.error(`Failed: ${p.name} — ${errText(err)}`);
      stats.failed++;
    }
  }

  if (!dryRun) {
    const mongoose = (await import("mongoose")).default;
    await mongoose.disconnect();
  }

  const row = (label: string, value: string | number) =>
    `║ ${label.padEnd(24)}${String(value).padEnd(17)}║`;

  console.log(`
╔══════════════════════════════════════════╗
║  PURE GRAIN EXPORTS — FINISHED ${dryRun ? "DRY RUN" : "IMPORT "}  ║
╠══════════════════════════════════════════╣
${row("EUR → USD rate:", usdRate)}
${row("Total products found:", stats.found)}
${row(dryRun ? "Would insert:" : "Successfully inserted:", stats.inserted)}
${row("Skipped (duplicates):", stats.duplicates)}
${row("Failed:", stats.failed)}
${row(dryRun ? "Images to upload:" : "Images uploaded:", stats.imagesUploaded)}
${row("Images skipped/failed:", stats.imagesFailed)}
╠══════════════════════════════════════════╣
║ Inserted per category                    ║
${Object.entries(perCategory)
  .sort((a, b) => b[1] - a[1])
  .map(([c, n]) => row(`  ${c}:`, n))
  .join("\n") || row("  (none)", 0)}
╠══════════════════════════════════════════╣
║ All products: isArchived = true          ║
║ Review in admin panel before publishing  ║
╚══════════════════════════════════════════╝`);

  process.exit(0);
}

run().catch((err) => {
  log.error(`Import aborted: ${errText(err)}`);
  console.error(err);
  process.exit(1);
});
