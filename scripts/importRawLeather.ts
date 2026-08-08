// scripts/importRawLeather.ts
//
// Bulk-imports scraped leatherwks product data into the RawLeather collection,
// uploading every local product photo to Cloudinary first.
//
// Usage:
//   npx tsx scripts/importRawLeather.ts "G:\leatherwks-Data" --dry-run
//   npx tsx scripts/importRawLeather.ts "G:\leatherwks-Data"
//
// The script is re-run safe: products are de-duplicated by `name`, and images
// are uploaded with `overwrite: false` so an interrupted run can simply be
// restarted.
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

// ─────────────────────────────── types ───────────────────────────────

interface ScrapedAttributes {
  hide_shape?: string;
  hide_size?: string;
  hide_thickness_weight?: string;
  crust_dyed_through?: string;
  top_finish?: string;
  species?: string;
  temper?: string;
  tannage?: string;
  application?: string;
  shipping_weight?: string;
}

interface ScrapedProduct {
  category: string;
  url: string;
  name: string;
  price: string;
  colors: string[] | null;
  image_urls?: string[];
  attributes: ScrapedAttributes;
  description: string;
  downloaded_images: string[];
  /** District Leather only: derived during normalisation. */
  _sqft?: number;
  _animal?: string;
  _slug?: string;
}

interface MappedProduct {
  name: string;
  leatherType: string;
  animal: string;
  finish: string;
  thickness: string;
  size: string;
  colors: string[];
  minOrderQuantity: number;
  sampleAvailable: boolean;
  images: string[];
  description: string;
  isFeatured: boolean;
  isArchived: boolean;
  pricePerSqFt: number;
  currency: string;
  priceTier: Array<{ minQty: number; price: number }>;
  priceUnit: string;
  discountAvailable: boolean;
  negotiable: boolean;
}

// ────────────────────────────── logging ──────────────────────────────

const log = {
  start: (m: string) => console.log(`[START]    ${m}`),
  catalog: (m: string) => console.log(`[CATALOG]  ${m}`),
  category: (m: string) => console.log(`\n[CATEGORY] ── ${m} ──`),
  product: (m: string) => console.log(`[PRODUCT]  Processing: ${m}`),
  map: (m: string) => console.log(`[MAP]      ${m}`),
  image: (m: string) => console.log(`[IMAGE]    ${m}`),
  db: (m: string) => console.log(`[DB]       ${m}`),
  skip: (m: string) => console.log(`[SKIP]     ⏭  ${m}`),
  warn: (m: string) => console.log(`[WARN]     ⚠  ${m}`),
  error: (m: string) => console.log(`[ERROR]    ✗  ${m}`),
  dry: (m: string) => console.log(`[DRY-RUN]  ${m}`),
};

// ───────────────────────────── mapping ───────────────────────────────

/**
 * leatherType — must match a name in the `rawleathertypes` collection, because
 * the admin edit form rejects any value that is not in that managed list
 * (RawLeatherForm.tsx: "Invalid Leather Type selected").
 *
 * The scraped `species` field cannot drive this: all 97 products report
 * "top grain", so keying off it collapsed everything into one bucket. The
 * scraper's `category` is the real surface classification, with `species`
 * used only to pick out the handful of nubuck/suede hides that sit inside
 * another category.
 */
function mapLeatherType(category: string, species: string | undefined): string {
  const s = (species || "").toLowerCase();

  // Species wins when it names a specific surface — e.g. the two "buffed
  // nubuck" hides filed under Embossed and Smooth.
  if (s.includes("nubuck")) return "Nubuck";
  if (s.includes("suede")) return "Suede";

  switch (category) {
    case "Suede":
      return "Suede";
    case "Embossed":
      return "Embossed";
    case "Pebble":
      return "Pebble";
    case "Smooth":
      return "Smooth";
    case "VegTan":
      return "Veg Tan";
    default:
      return category || "Smooth";
  }
}

/** animal — must match the schema enum exactly. */
function mapAnimal(species: string | undefined): string {
  const s = (species || "").toLowerCase();
  if (s.includes("cowhide") || s.includes("bovine") || s.includes("cow")) return "Cow";
  if (s.includes("buffalo")) return "Buffalo";
  if (s.includes("goat")) return "Goat";
  if (s.includes("sheep") || s.includes("lamb")) return "Sheep";
  if (s.includes("exotic") || s.includes("croc") || s.includes("ostrich")) return "Exotic";
  return "Cow";
}

/** finish — category wins first, then the scraped top_finish text. */
function mapFinish(category: string, topFinish: string | undefined, embossKeyword = false): string {
  if (category === "Embossed") return "Embossed";
  if (category === "Suede") return "Nappa";

  const f = (topFinish || "").toLowerCase();
  // District Leather names the finish directly ("Alligator embossed"), so the
  // keyword is authoritative there. Not applied to leatherwks, where the
  // category already decides embossing and most finish strings mention it in
  // passing ("aniline top finished, embossed pebble/milled natural look").
  if (embossKeyword && f.includes("emboss")) return "Embossed";
  if (f.includes("semi-aniline") || f.includes("semi aniline")) return "Semi-Aniline";
  if (f.includes("crazy horse")) return "Crazy Horse";
  if (f.includes("pull-up") || f.includes("pull up")) return "Pull-up";
  if (f.includes("pigmented")) return "Pigmented";
  if (f.includes("wax")) return "Waxed";
  if (f.includes("nappa")) return "Nappa";
  if (f.includes("aniline")) return "Aniline";
  return "Aniline";
}

/**
 * thickness — "1.1/1.3mm (2.5-3.0 oz)" → "1.1-1.3mm".
 * The scraped data carries 23 spacing/format variants, so everything before the
 * parenthetical weight is normalised down to a compact `…mm` string.
 */
function mapThickness(raw: string | undefined): string {
  let t = (raw || "").split("(")[0];
  if (!/\d/.test(t)) return "Not specified";

  t = t.replace(/\//g, "-");
  t = t.replace(/\s+/g, " ").trim();
  t = t.replace(/\s*mm/gi, "mm");
  t = t.replace(/,\s*/g, ", ").replace(/,$/, "").trim();
  if (!/mm$/i.test(t)) t = `${t}mm`;
  return t;
}

/**
 * Numeric value of a price string, for both "$26.95 USD" and "Rs.3,700.00".
 *
 * Note the naive `replace(/[^0-9.]/g, "")` cannot be used here: on
 * "Rs.3,700.00" it leaves ".3700.00", and parseFloat of that is 0.37 — a
 * 10,000x error. Matching the first digit-led group avoids the stray dot.
 */
function priceValue(raw: string | undefined): number {
  const m = String(raw || "").match(/[\d,]+(?:\.\d+)?/);
  if (!m) return 0;
  const n = parseFloat(m[0].replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** pricePerSqFt for leatherwks — "$26.95 USD" → 26.95, already per sq ft. */
function mapPrice(raw: string | undefined): number {
  return priceValue(raw);
}

// ─────────────── District Leather Supply specifics ───────────────────

/** Rate supplied for this import. Prices are quoted in PKR at source. */
const PKR_PER_USD = 277.56;

/**
 * Hide identification for District Leather products. The dataset has no
 * species field at all, so the animal is inferred from the product name and
 * description, and the sq ft figure uses the averages those same descriptions
 * quote ("Full sides average about 18 sqft", "Sides average around 23 sqft",
 * lamb "Small: 4-5 / Medium: 5-6 / Large: 6-7 sqft", "JUMBO skins Full skin:
 * 19-21-ish sqft").
 *
 * `animal` is constrained to the schema enum; `sqft` is tracked separately so
 * calf (Cow, but a smaller side) is not sized like a full steer hide.
 */
/**
 * Below this PKR price a listing is a cut panel rather than a whole hide.
 * The source prices are per-variant and never say which variant, but the split
 * is unambiguous in the data: 97 listings sit at Rs.1,600-3,700 while 12 sit at
 * Rs.6,400-68,300, with the same tannery and article appearing in both bands
 * (e.g. La Perla Azzurra at Rs.3,700 and Rs.38,700).
 */
const DL_PANEL_PRICE_CEILING_PKR = 6000;

/**
 * Effective area of a cut panel. Calibrated from the one listing that states
 * both a size and a price consistent with it — Opera Safari jumbo skin,
 * Rs.33,400 over ~20 sqft = $6.02/sqft. Holding that rate, a Rs.3,700 panel
 * works out at ~2.2 sqft.
 */
const DL_PANEL_SQFT = 2.2;

function detectHide(name: string, text: string): { animal: string; sqft: number; note: string } {
  const s = `${name} ${text}`.toLowerCase();

  // Explicit sq ft in the copy always wins over any average.
  const explicit: number[] = [];
  const re = /(\d+(?:\.\d+)?)\s*(?:-|–|to)?\s*(\d+(?:\.\d+)?)?\s*-?ish\s*sq\s*\.?\s*ft|(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*sq\s*\.?\s*ft|(\d+(?:\.\d+)?)\s*sq\s*\.?\s*ft/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const nums = [m[1], m[2], m[3], m[4], m[5]].filter(Boolean).map(Number);
    if (nums.length) explicit.push(nums.reduce((a, b) => a + b, 0) / nums.length);
  }

  // "Cowhide embossed" in an alligator-embossed product must read as Cow, so
  // the bovine check runs before the exotic one.
  let animal = "Cow";
  let sqft = 23; // cow side
  let note = "avg cow side";

  if (/\bcalf|calfskin\b/.test(s)) {
    animal = "Cow"; sqft = 18; note = "avg calf side";
  } else if (/\bcowhide\b|\bcow\b|\bsteer\b|\bbull\b|\bvacchetta\b/.test(s)) {
    animal = "Cow"; sqft = 23; note = "avg cow side";
  } else if (/\bbuffalo\b/.test(s)) {
    animal = "Buffalo"; sqft = 25; note = "avg buffalo hide";
  } else if (/\blamb|lambskin|\bsheep\b|shearling/.test(s)) {
    animal = "Sheep"; sqft = 5.5; note = "avg lamb skin";
  } else if (/\bgoat|goatskin\b|\bkid\b/.test(s)) {
    animal = "Goat"; sqft = 6; note = "avg goat skin";
  } else if (/\bostrich\b|\bpython\b|\bstingray\b/.test(s)) {
    animal = "Exotic"; sqft = 20; note = "avg exotic skin";
  }

  if (explicit.length) {
    sqft = Math.max(...explicit);
    note = "stated in description";
  }

  return { animal, sqft, note };
}

/** PKR per piece → USD per sq ft, using the hide's sq ft. */
function districtPricePerSqFt(rawPrice: string | undefined, sqft: number): number {
  const pkr = priceValue(rawPrice);
  if (!pkr || !sqft) return 0;
  const usd = pkr / PKR_PER_USD;
  return Math.round((usd / sqft) * 100) / 100;
}

/** oz weight → mm thickness. Prefers an mm figure already present in the copy. */
function thicknessFromWeight(weight: string): string {
  if (!weight) return "Not specified";
  const mm = weight.match(/(\d+(?:\.\d+)?)\s*(?:-|–|to)?\s*(\d+(?:\.\d+)?)?\s*mm/i);
  if (mm) {
    const a = parseFloat(mm[1]);
    const b = mm[2] ? parseFloat(mm[2]) : null;
    return b ? `${a}-${b}mm` : `${a}mm`;
  }
  const oz = weight.match(/(\d+(?:\.\d+)?)\s*(?:-|–|to)?\s*(\d+(?:\.\d+)?)?\s*oz/i);
  if (oz) {
    const OZ_TO_MM = 0.396875; // 1 oz = 1/64 inch
    const a = parseFloat(oz[1]);
    const b = oz[2] ? parseFloat(oz[2]) : null;
    const r = (v: number) => Math.round(v * OZ_TO_MM * 10) / 10;
    return b ? `${r(a)}-${r(b)}mm` : `${r(a)}mm`;
  }
  return "Not specified";
}

/** Strips tags/entities from the scraped HTML description. */
function htmlToText(html: string): string {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Pulls a "Label: value" line out of the flattened description text. */
function labelValue(text: string, label: string): string {
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = text.match(new RegExp(`^\\s*${esc}\\s*[:–-]\\s*(.+)$`, "im"));
  return m ? m[1].trim() : "";
}

function mapProduct(p: ScrapedProduct, images: string[], kind: SourceKind): MappedProduct {
  const isDL = kind === "districtleather";

  return {
    name: p.name,
    leatherType: mapLeatherType(p.category, p.attributes?.species),
    // District Leather has no species field; the animal is inferred during
    // normalisation from the name/description instead.
    animal: isDL ? p._animal || "Cow" : mapAnimal(p.attributes?.species),
    finish: mapFinish(p.category, p.attributes?.top_finish, isDL),
    thickness: isDL
      ? thicknessFromWeight(p.attributes?.hide_thickness_weight || "")
      : mapThickness(p.attributes?.hide_thickness_weight),
    size: p.attributes?.hide_size?.trim() || "Not specified",
    colors: Array.isArray(p.colors) ? p.colors : [],
    minOrderQuantity: 1,
    sampleAvailable: false,
    images,
    description: `[REVIEW BEFORE PUBLISHING] ${p.description}`,
    isFeatured: false,
    isArchived: true, // non-negotiable: nothing goes live without manual review
    // District Leather quotes PKR per piece, so convert to USD and divide by
    // the hide's sq ft to reach the per-sq-ft figure this schema stores.
    pricePerSqFt: isDL ? districtPricePerSqFt(p.price, p._sqft || 23) : mapPrice(p.price),
    currency: "USD",
    priceTier: [],
    priceUnit: "sq ft",
    discountAvailable: false,
    negotiable: true,
  };
}

// ─────────────────────────── source loading ─────────────────────────

type SourceKind = "leatherwks" | "districtleather";

/**
 * The two scrapes have different shapes, so each is normalised into
 * ScrapedProduct here rather than special-casing the mapping code:
 *
 *   leatherwks       catalog.json      structured `attributes`, absolute image paths
 *   districtleather  all_products.json prose HTML only, relative image paths
 */
function loadSource(root: string): { kind: SourceKind; catalog: Record<string, ScrapedProduct[]> } {
  const lw = path.join(root, "catalog.json");
  if (fs.existsSync(lw)) {
    return { kind: "leatherwks", catalog: JSON.parse(fs.readFileSync(lw, "utf8")) };
  }

  const dl = path.join(root, "all_products.json");
  if (!fs.existsSync(dl)) {
    throw new Error(`Neither catalog.json nor all_products.json found in ${root}`);
  }

  const raw: Record<string, any[]> = JSON.parse(fs.readFileSync(dl, "utf8"));
  const catalog: Record<string, ScrapedProduct[]> = {};

  for (const [category, entries] of Object.entries(raw)) {
    catalog[category] = entries.map((e) => {
      const text = htmlToText(e.description_html);
      const hide = detectHide(e.name || "", text);
      const animal = hide.animal;

      // Price tier decides the unit. A cheap listing is a cut panel even when
      // the copy quotes a full-side size, because that size describes a
      // different (more expensive) variant of the same article — the Italian
      // Pebble Grain Calf line lists Rs.3,200 and Rs.6,400 against identical
      // "Full sides average about 18 sqft" text.
      const pkr = priceValue(e.price);
      const isPanel = pkr > 0 && pkr < DL_PANEL_PRICE_CEILING_PKR;
      const sqft = isPanel ? DL_PANEL_SQFT : hide.sqft;
      const note = isPanel ? "panel, est." : hide.note;

      // image_files are relative and already begin with the data folder name,
      // e.g. "DistrictLeather Data\\VegTan\\...", so they resolve against the
      // drive root rather than against `root` itself.
      const images: string[] = (e.image_files || []).map((f: string) =>
        path.join(path.parse(root).root || "G:/", String(f).replace(/\\/g, "/"))
      );

      return {
        category,
        url: e.url || "",
        name: e.name || "",
        price: e.price || "",
        colors: [],
        attributes: {
          hide_size: `~${sqft} SQFT (${note})`,
          hide_thickness_weight: labelValue(text, "Weight"),
          top_finish: labelValue(text, "Finish"),
          // mapLeatherType reads `species` for nubuck/suede hints. This source
          // has no species field, and the surface is usually only stated in the
          // product name ("BLACK NUBUCK"), so the name is folded in. The animal
          // itself is carried separately on _animal.
          species: `${animal} ${e.name || ""} ${labelValue(text, "Finish")}`,
          tannage: labelValue(text, "Tanning"),
          application: labelValue(text, "Recommended Uses"),
        },
        description: text,
        downloaded_images: images,
        _sqft: sqft,
        _animal: animal,
        // The on-disk folder is "VegTan - PRODUCT NAME, COLOUR" — spaces and
        // commas make a poor Cloudinary path, so the URL slug is used instead.
        _slug: String(e.url || "")
          .split("/")
          .filter(Boolean)
          .pop() || String(e.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      } as ScrapedProduct;
    });
  }

  return { kind: "districtleather", catalog };
}

// ─────────────────────────── path helpers ────────────────────────────

/**
 * Product slug used for the Cloudinary folder. Taken from the on-disk scraper
 * folder rather than the product URL: 21 of the scraped URLs are stale Shopify
 * duplicates ("bs-safari-moonface-copy" for the product "BS Safari Thunder"),
 * whereas the folder name always matches the real product.
 */
function productSlug(p: ScrapedProduct): string {
  if (p._slug) return p._slug;

  const first = p.downloaded_images?.[0];
  if (first) {
    const parts = first.split(/[\\/]/).filter(Boolean);
    // …/<category>/<slug>/images/<file>
    if (parts.length >= 3) return parts[parts.length - 3];
  }
  return p.url.split("/").filter(Boolean).pop() || p.name.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Resolves a `downloaded_images` entry to a real file. Falls back to rebuilding
 * the path from the root argument when the absolute Windows path recorded by
 * the scraper no longer resolves (e.g. the data folder was moved).
 */
function resolveImagePath(recorded: string, root: string, p: ScrapedProduct): string | null {
  if (fs.existsSync(recorded)) return recorded;

  const filename = recorded.split(/[\\/]/).pop() || "";
  const fallback = path.join(root, p.category, productSlug(p), "images", filename);
  if (fs.existsSync(fallback)) return fallback;

  return null;
}

/** Strips any scraper-applied "NN-" ordering prefix so it is not doubled up. */
function baseNameForPublicId(filePath: string): string {
  const file = filePath.split(/[\\/]/).pop() || "image";
  const withoutExt = file.replace(/\.[^.]+$/, "");
  return withoutExt.replace(/^\d{1,3}-/, "");
}

/**
 * Uploads are latency-bound rather than bandwidth-bound (measured: ~12s per
 * image sequentially vs ~1.3s effective at 5 concurrent), so a small pool is
 * used per product. Results are written back by index, which keeps the stored
 * image order identical to `downloaded_images`.
 */
const UPLOAD_CONCURRENCY = 6;

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

/** Cloudinary times out sporadically under concurrency; these retries clear it. */
const UPLOAD_ATTEMPTS = 4;

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
      // A genuine duplicate is not retryable — let the caller handle it.
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
  const root = args.find((a) => !a.startsWith("--")) || "G:\\leatherwks-Data";

  log.start(`Starting import from: ${root}${dryRun ? "  (DRY RUN — no uploads, no writes)" : ""}`);

  let loaded: { kind: SourceKind; catalog: Record<string, ScrapedProduct[]> };
  try {
    loaded = loadSource(root);
  } catch (err: any) {
    log.error(errText(err));
    process.exit(1);
    return;
  }
  const { kind, catalog } = loaded;
  log.catalog(`Source format: ${kind}`);

  const categories = Object.keys(catalog);
  const totalProducts = Object.values(catalog).reduce((s, v) => s + v.length, 0);
  log.catalog(`Found ${categories.length} categories, ${totalProducts} products total`);

  // Deferred so dotenv has already populated process.env.
  const { default: connectDB } = await import("../lib/config/db");
  const { default: cloudinary } = await import("../lib/config/cloudinary");
  const { default: RawLeather } = await import("../lib/models/RawLeather");
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!dryRun) {
    await connectDB();
  }

  const stats = {
    categories: categories.length,
    found: totalProducts,
    inserted: 0,
    duplicates: 0,
    failed: 0,
    imagesUploaded: 0,
    imagesFailed: 0,
    repaired: 0,
  };

  let detailShown = 0;

  /**
   * Uploads every photo for a product and returns the resulting URLs in the
   * original `downloaded_images` order. Failed uploads drop out; the surviving
   * URLs keep their relative order, so images[0] is still the first photo.
   */
  const uploadProductImages = async (
    p: ScrapedProduct,
    folder: string,
    sources: string[]
  ): Promise<string[]> => {
    const slots = await mapWithConcurrency(
      sources,
      UPLOAD_CONCURRENCY,
      async (recorded, i): Promise<string | null> => {
        const idx = String(i + 1).padStart(2, "0");
        const filename = recorded.split(/[\\/]/).pop() || "";
        const localPath = resolveImagePath(recorded, root, p);

        if (!localPath) {
          log.warn(`Image not found: ${recorded} — skipping`);
          stats.imagesFailed++;
          return null;
        }

        const publicId = `${idx}-${baseNameForPublicId(localPath)}`;

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
          // overwrite:false normally returns the existing asset, but a
          // concurrent/partial upload can surface as an error instead.
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

    return slots.filter((u): u is string => Boolean(u));
  };

  for (const category of categories) {
    const products = catalog[category];
    log.category(`${category} (${products.length} products)`);

    for (const entry of products) {
      // leatherwks ships a per-product product.json that is preferred over the
      // catalog entry. District Leather has no such file — its entries are
      // already normalised in loadSource — so this is skipped there.
      let p: ScrapedProduct = entry;
      if (kind === "leatherwks") {
        const pjPath = path.join(root, entry.category, productSlug(entry), "product.json");
        if (fs.existsSync(pjPath)) {
          try {
            p = JSON.parse(fs.readFileSync(pjPath, "utf8")) as ScrapedProduct;
          } catch {
            log.warn(`Unreadable product.json for ${entry.name} — using catalog entry`);
          }
        }
      }

      log.product(p.name);

      try {
        const slug = productSlug(p);
        const folder = `pure-grain-exports/raw-leather/${slug}`;
        const sources = Array.isArray(p.downloaded_images) ? p.downloaded_images : [];

        // ── duplicate check ──
        if (!dryRun) {
          const exists = await RawLeather.findOne({ name: p.name });
          if (exists) {
            // A product left with fewer images than the source has (an earlier
            // run interrupted, or transient upload failures) would otherwise
            // stay incomplete forever, since re-runs skip it. Top it up.
            if (exists.images.length < sources.length) {
              log.warn(
                `Incomplete: ${p.name} has ${exists.images.length}/${sources.length} images — repairing`
              );
              const repairedUrls = await uploadProductImages(p, folder, sources);
              exists.images = repairedUrls;
              await exists.save();
              log.db(`✓ Repaired: ${p.name} (${repairedUrls.length}/${sources.length} images)`);
              stats.repaired++;
              continue;
            }

            log.skip(`Duplicate: ${p.name} — skipping`);
            stats.duplicates++;
            continue;
          }
        }

        // ── images ──
        const successfulUrls = await uploadProductImages(p, folder, sources);

        if (successfulUrls.length === 0) {
          log.warn(`No images for: ${p.name}`);
        }

        // ── map ──
        const mapped = mapProduct(p, successfulUrls, kind);
        log.map(
          `animal=${mapped.animal} finish=${mapped.finish} leatherType=${mapped.leatherType} ` +
            `thickness=${mapped.thickness} size=${mapped.size} price=${mapped.pricePerSqFt}`
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
          log.dry(`Would insert: ${mapped.name} (${successfulUrls.length} images, isArchived=true)`);
          stats.inserted++;
        } else {
          // Atomic insert-if-absent. The findOne check above is a fast path,
          // but on its own it races: two overlapping runs can both pass it and
          // each create a document. $setOnInsert + upsert makes the decision in
          // a single server-side operation, so a concurrent run is reported as
          // a duplicate rather than producing a second copy.
          const res = await RawLeather.updateOne(
            { name: mapped.name },
            { $setOnInsert: mapped },
            { upsert: true }
          );

          if (res.upsertedCount > 0) {
            log.db(`✓ Inserted: ${mapped.name} (${successfulUrls.length} images)`);
            stats.inserted++;
          } else {
            log.skip(`Duplicate: ${mapped.name} — inserted by a concurrent run, skipping`);
            stats.duplicates++;
          }
        }
      } catch (err: any) {
        log.error(`Failed: ${p.name} — ${errText(err)}`);
        stats.failed++;
      }
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
║     PURE GRAIN EXPORTS — IMPORT ${dryRun ? "DRY RUN" : "DONE  "}  ║
╠══════════════════════════════════════════╣
${row("Categories processed:", stats.categories)}
${row("Total products found:", stats.found)}
${row(dryRun ? "Would insert:" : "Successfully inserted:", stats.inserted)}
${row("Repaired (images):", stats.repaired)}
${row("Skipped (duplicates):", stats.duplicates)}
${row("Failed:", stats.failed)}
${row(dryRun ? "Images to upload:" : "Images uploaded:", stats.imagesUploaded)}
${row("Images skipped/failed:", stats.imagesFailed)}
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
