// scripts/revertHideNamesFixBeltMm.ts
//
// Two corrections:
//
// 1. RAW LEATHER — restores the house-line hide names ("Coffee Bolan Embossed
//    Grain") that refineCatalogNaming.ts replaced. Only the descriptive rename
//    is undone; the animal segregation, descriptions, pricing and MOQ set
//    afterwards all stay as they are.
//    Hides whose leatherType is "Embossed" are left alone — those names are
//    already correct.
//
// 2. FINISHED PRODUCTS — the belt figure in a name is a substance in mm, not a
//    strap width, so "35mm Belt" is restated as "3.5mm Belt" (the source value
//    "3,5 cm" was being multiplied by ten).
//
// Usage:
//   npx tsx scripts/revertHideNamesFixBeltMm.ts --dry-run
//   npx tsx scripts/revertHideNamesFixBeltMm.ts
//   npx tsx scripts/revertHideNamesFixBeltMm.ts --only=hides|belts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// The original naming logic is reused rather than re-implemented, so the
// restored names match byte for byte what the earlier run produced.
import { transformName } from "./makeRawLeatherLive";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(PROJECT_ROOT, ".env.local") });

const LEATHERWKS = "G:\\leatherwks-Data\\catalog.json";
const DISTRICT = "G:\\DistrictLeather Data\\all_products.json";
const BATCH_SIZE = 20;

const log = {
  start: (m: string) => console.log(`[START]    ${m}`),
  section: (m: string) => console.log(`\n[SECTION]  ══ ${m} ══`),
  batch: (m: string) => console.log(`\n[BATCH]    ${m}`),
  product: (m: string) => console.log(`[PRODUCT]  ${m}`),
  name: (m: string) => console.log(`[NAME]     → ${m}`),
  keep: (m: string) => console.log(`[KEEP]     ⏸  ${m}`),
  skip: (m: string) => console.log(`[SKIP]     ⏭  ${m}`),
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

function slugify(s: string): string {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function slugFromImages(images: string[] | undefined): string {
  const u = (images || [])[0] || "";
  const m = u.match(/raw-leather\/([^/]+)\//);
  return m ? m[1] : "";
}

/**
 * "35mm" → "3.5mm", "40mm" → "4.0mm", "28mm" → "2.8mm".
 * The scraped figure ("3,5 cm") is the leather substance; multiplying it by ten
 * turned a 3.5 mm belt into a "35mm" one.
 */
export function fixMmToken(name: string): string {
  return String(name || "").replace(/\b(\d{2,3})mm\b/gi, (_m, digits: string) => {
    const v = parseInt(digits, 10) / 10;
    return `${v.toFixed(1)}mm`;
  });
}

async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const onlyArg = args.find((a) => a.startsWith("--only="));
  const only = onlyArg ? onlyArg.split("=")[1] : "";

  const { default: connectDB } = await import("../lib/config/db");
  const { default: RawLeather } = await import("../lib/models/RawLeather");
  const { default: FinishedProduct } = await import("../lib/models/FinishedProduct");
  const mongoose = (await import("mongoose")).default;
  await connectDB();

  const stats = {
    hidesReverted: 0, hidesKeptEmbossed: 0, hidesNoSource: 0, hidesUnchanged: 0,
    beltsFixed: 0, beltsUnchanged: 0, failed: 0,
  };
  const samples: string[] = [];

  // ══════════════════ 1. RAW LEATHER — restore hide names ═════════════
  if (only !== "belts") {
    log.section("RAW LEATHER — restoring house-line names (Embossed left as-is)");

    // Original scraped record, keyed by the Cloudinary folder slug.
    const srcBySlug = new Map<string, { name: string; description: string }>();
    if (fs.existsSync(LEATHERWKS)) {
      const cat = JSON.parse(fs.readFileSync(LEATHERWKS, "utf8"));
      for (const p of Object.values(cat).flat() as any[]) {
        const s = String(p.downloaded_images?.[0] || "").split(/[\\/]/).slice(-3)[0] || slugify(p.name);
        srcBySlug.set(s, { name: String(p.name || ""), description: String(p.description || "") });
      }
    }
    if (fs.existsSync(DISTRICT)) {
      const cat = JSON.parse(fs.readFileSync(DISTRICT, "utf8"));
      for (const p of Object.values(cat).flat() as any[]) {
        const s = String(p.url || "").split("/").filter(Boolean).pop() || slugify(p.name);
        srcBySlug.set(s, {
          name: String(p.name || ""),
          description: String(p.description_html || "").replace(/<[^>]+>/g, " "),
        });
      }
    }

    const docs = await RawLeather.find({}).sort({ _id: 1 });
    log.start(`${docs.length} hides in collection`);

    // Embossed names are being kept, so they must reserve their slots first or
    // a restored name could collide with one.
    const taken = new Set<string>();
    docs.forEach((d: any) => {
      if (String(d.leatherType) === "Embossed") taken.add(String(d.name).toLowerCase());
    });

    const totalBatches = Math.ceil(docs.length / BATCH_SIZE);
    for (let b = 0; b < totalBatches; b++) {
      const slice = docs.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
      if (!slice.length) break;
      log.batch(`Hides batch ${b + 1}/${totalBatches}`);

      for (const doc of slice) {
        try {
          if (String(doc.leatherType) === "Embossed") {
            stats.hidesKeptEmbossed++;
            continue; // names already correct
          }

          const slug = slugFromImages(doc.images as any);
          const src = slug ? srcBySlug.get(slug) : undefined;
          if (!src) {
            stats.hidesNoSource++;
            taken.add(String(doc.name).toLowerCase());
            log.skip(`${doc.name} — no source record, name left unchanged`);
            continue;
          }

          // transformName reads name/description off the document for its
          // texture cues, so it is handed the ORIGINAL scraped values — the
          // stored ones have since been rewritten.
          const asImported = {
            ...doc.toObject(),
            name: src.name,
            description: src.description,
          };
          const res = transformName(src.name, asImported, taken);

          if (res.name === doc.name) {
            stats.hidesUnchanged++;
            continue;
          }

          log.product(String(doc.name));
          log.name(res.name);
          if (samples.length < 8) samples.push(`HIDE  ${doc.name}  →  ${res.name}`);

          if (!dryRun) {
            await RawLeather.findByIdAndUpdate(doc._id, { $set: { name: res.name } });
            log.db(`Restored: ${res.name}`);
          }
          stats.hidesReverted++;
        } catch (err: any) {
          stats.failed++;
          log.error(`${doc.name} — ${errText(err)}`);
        }
      }
    }
  }

  // ══════════════════ 2. FINISHED PRODUCTS — belt mm ══════════════════
  if (only !== "hides") {
    log.section("FINISHED PRODUCTS — restating belt substance in mm");

    const docs = await FinishedProduct.find({ name: /\d{2,3}mm/i }).sort({ _id: 1 });
    log.start(`${docs.length} products carry an mm figure in the name`);

    const totalBatches = Math.max(1, Math.ceil(docs.length / BATCH_SIZE));
    for (let b = 0; b < totalBatches; b++) {
      const slice = docs.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
      if (!slice.length) break;
      log.batch(`Belts batch ${b + 1}/${totalBatches}`);

      for (const doc of slice) {
        try {
          const fixed = fixMmToken(String(doc.name));
          if (fixed === doc.name) { stats.beltsUnchanged++; continue; }

          log.product(String(doc.name));
          log.name(fixed);
          if (samples.length < 16) samples.push(`BELT  ${doc.name}  →  ${fixed}`);

          if (!dryRun) {
            await FinishedProduct.findByIdAndUpdate(doc._id, { $set: { name: fixed } });
            log.db(`Updated: ${fixed}`);
          }
          stats.beltsFixed++;
        } catch (err: any) {
          stats.failed++;
          log.error(`${doc.name} — ${errText(err)}`);
        }
      }
    }
  }

  if (dryRun) console.log("\n[DRY RUN]  No changes written to database");
  await mongoose.disconnect();

  const row = (l: string, v: string | number) => `║ ${l.padEnd(30)}${String(v).padEnd(14)}║`;
  console.log(`
╔══════════════════════════════════════════════╗
║   PURE GRAIN — NAME CORRECTIONS ${dryRun ? "DRY RUN" : "APPLIED"}     ║
╠══════════════════════════════════════════════╣
║ Raw leather (hides)                          ║
${row("  Names restored:", stats.hidesReverted)}
${row("  Embossed left as-is:", stats.hidesKeptEmbossed)}
${row("  Already correct:", stats.hidesUnchanged)}
${row("  No source record:", stats.hidesNoSource)}
╠══════════════════════════════════════════════╣
║ Finished products (belts)                    ║
${row("  mm figures corrected:", stats.beltsFixed)}
${row("  Already correct:", stats.beltsUnchanged)}
╠══════════════════════════════════════════════╣
${row("Failed:", stats.failed)}
╚══════════════════════════════════════════════╝`);

  if (samples.length) {
    console.log("\nSample changes:");
    samples.forEach((s) => console.log(`  ${s}`));
  }

  process.exit(0);
}

run().catch((err) => {
  log.error(`Aborted: ${errText(err)}`);
  console.error(err);
  process.exit(1);
});
