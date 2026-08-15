// scripts/makeFinishedProductsLive.ts
//
// Takes archived FinishedProduct documents live.
//
// Usage:
//   npx tsx scripts/makeFinishedProductsLive.ts --dry-run
//   npx tsx scripts/makeFinishedProductsLive.ts
//   npx tsx scripts/makeFinishedProductsLive.ts --keep-review-prefix
//
// Sets isArchived:false and isActive:true, and by default removes the
// "[REVIEW BEFORE PUBLISHING] " marker the import added — that text is
// customer-facing once a product is live. Pass --keep-review-prefix to leave it.
//
// Only documents with isArchived:true are touched; anything already live is
// left exactly as it is. Nothing else on the document is modified.
//
// Note on the admin form: a product saved with isActive:true AND
// isArchived:true put ProductForm's two checkboxes into a state where each
// disabled the other, so neither could be changed. Clearing isArchived here
// resolves that for every processed product.
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(PROJECT_ROOT, ".env.local") });

const BATCH_SIZE = 20;
const REVIEW_PREFIX = /^\[REVIEW BEFORE PUBLISHING\]\s*/;

const log = {
  start: (m: string) => console.log(`[START]    ${m}`),
  batch: (m: string) => console.log(`\n[BATCH]    ${m}`),
  product: (m: string) => console.log(`[PRODUCT]  ${m}`),
  desc: (m: string) => console.log(`[DESC]     → ${m}`),
  flags: (m: string) => console.log(`[FLAGS]    → ${m}`),
  db: (m: string) => console.log(`[DB]       ✓ ${m}`),
  skip: (m: string) => console.log(`[SKIP]     ⏭  ${m}`),
  error: (m: string) => console.log(`[ERROR]    ✗  ${m}`),
  dry: (m: string) => console.log(`[DRY RUN]  ${m}`),
};

function errText(err: any): string {
  if (!err) return "unknown error";
  if (typeof err === "string") return err;
  if (err.message) return err.message;
  try { return JSON.stringify(err); } catch { return String(err); }
}

async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const keepPrefix = args.includes("--keep-review-prefix");

  const { default: connectDB } = await import("../lib/config/db");
  const { default: FinishedProduct } = await import("../lib/models/FinishedProduct");
  const mongoose = (await import("mongoose")).default;

  await connectDB();

  const products = await FinishedProduct.find({ isArchived: true }).sort({ _id: 1 });
  const alreadyLive = await FinishedProduct.countDocuments({ isArchived: { $ne: true } });

  log.start(`Processing ${products.length} archived FinishedProduct documents${dryRun ? "  (DRY RUN)" : ""}`);
  log.start(`${alreadyLive} products already live — these are not touched`);
  log.start(keepPrefix ? `Keeping the [REVIEW BEFORE PUBLISHING] prefix` : `Removing the [REVIEW BEFORE PUBLISHING] prefix`);

  const stats = { processed: 0, updated: 0, failed: 0, prefixStripped: 0 };
  const perCategory: Record<string, number> = {};

  const totalBatches = Math.max(1, Math.ceil(products.length / BATCH_SIZE));

  for (let b = 0; b < totalBatches; b++) {
    const slice = products.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    if (!slice.length) break;
    log.batch(
      `Processing batch ${b + 1}/${totalBatches} (products ${b * BATCH_SIZE + 1}-${b * BATCH_SIZE + slice.length})`
    );

    for (const doc of slice) {
      stats.processed++;
      log.product(String(doc.name));

      try {
        const update: Record<string, unknown> = { isArchived: false, isActive: true };

        const current = String(doc.description || "");
        if (!keepPrefix && REVIEW_PREFIX.test(current)) {
          update.description = current.replace(REVIEW_PREFIX, "").trim();
          stats.prefixStripped++;
          log.desc(`Removed review marker (${String(update.description).length} chars remain)`);
        }

        log.flags(`isArchived:false | isActive:true`);

        if (!dryRun) {
          await FinishedProduct.findByIdAndUpdate(doc._id, { $set: update });
          log.db(`Live: ${doc.name}`);
        }

        const cat = String(doc.category || "Uncategorised");
        perCategory[cat] = (perCategory[cat] || 0) + 1;
        stats.updated++;
      } catch (err: any) {
        stats.failed++;
        log.error(`Failed: ${doc.name} — ${errText(err)}`);
      }
    }
  }

  if (dryRun) console.log("\n[DRY RUN]  No changes written to database");

  await mongoose.disconnect();

  const row = (label: string, value: string | number) =>
    `║ ${label.padEnd(28)}${String(value).padEnd(16)}║`;

  console.log(`
╔═════════════════════════════════════════════╗
║  PURE GRAIN — FINISHED PRODUCTS ${dryRun ? "DRY RUN" : "LIVE   "}    ║
╠═════════════════════════════════════════════╣
${row("Total processed:", stats.processed)}
${row(dryRun ? "Would update:" : "Successfully updated:", stats.updated)}
${row("Failed:", stats.failed)}
${row("Review markers removed:", stats.prefixStripped)}
╠═════════════════════════════════════════════╣
║ Live per category                           ║
${Object.entries(perCategory)
  .sort((a, b) => b[1] - a[1])
  .map(([c, n]) => row(`  ${c}:`, n))
  .join("\n") || row("  (none)", 0)}
╠═════════════════════════════════════════════╣
║ All processed products now:                 ║
║   isArchived: false ✓                       ║
║   isActive:   true  ✓                       ║
╚═════════════════════════════════════════════╝`);

  process.exit(0);
}

run().catch((err) => {
  log.error(`Update aborted: ${errText(err)}`);
  console.error(err);
  process.exit(1);
});
