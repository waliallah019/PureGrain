// scripts/segregateHidesByAnimal.ts
//
// Assigns each raw leather hide to an animal from its measured substance, so
// the catalogue can be browsed by Cowhide / Buffalo / Goatskin / Lambskin
// instead of everything sitting under one type.
//
// Usage:
//   npx tsx scripts/segregateHidesByAnimal.ts --dry-run
//   npx tsx scripts/segregateHidesByAnimal.ts
//
// The assignment is rule-based, never random. Substance is the primary signal
// because hide thickness tracks the animal directly:
//
//   < 0.95 mm        Lambskin  — garment and lining weight
//   0.95 – 1.15 mm   Goatskin  — light, tight-grained skins
//   1.15 – 2.25 mm   Cowhide   — the general bovine range
//   > 2.25 mm        Buffalo   — heavy substance, belting and hardware bags
//
// One refinement on top of substance: suede and nubuck at or below 1.30 mm are
// goat in normal trade practice — cow splits are not run that light for a nap
// finish — so those move to Goatskin.
//
// Name and description are regenerated to match, otherwise a reassigned hide
// would still read "cowhide" in its copy. Nothing else is modified.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(PROJECT_ROOT, ".env.local") });

const LEATHERWKS = "G:\\leatherwks-Data\\catalog.json";
const DISTRICT = "G:\\DistrictLeather Data\\all_products.json";
const BATCH_SIZE = 20;

// ── banding thresholds (mm, midpoint of the stated range) ──
const T_LAMB_MAX = 0.95;
const T_GOAT_MAX = 1.15;
const T_COW_MAX = 2.25;
/** Suede/nubuck at or under this substance is goat rather than cow. */
const T_NAP_GOAT_MAX = 1.3;

const log = {
  start: (m: string) => console.log(`[START]    ${m}`),
  batch: (m: string) => console.log(`\n[BATCH]    ${m}`),
  product: (m: string) => console.log(`[PRODUCT]  ${m}`),
  animal: (m: string) => console.log(`[ANIMAL]   → ${m}`),
  name: (m: string) => console.log(`[NAME]     → ${m}`),
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

function titleCase(s: string): string {
  return String(s || "").toLowerCase().split(/\s+/).filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function slugify(s: string): string {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function slugFromImages(images: string[] | undefined): string {
  const u = (images || [])[0] || "";
  const m = u.match(/raw-leather\/([^/]+)\//);
  return m ? m[1] : "";
}

/** Midpoint of "1.1-1.3mm" style values; null when nothing numeric is present. */
export function substanceMm(thickness: string): number | null {
  const nums = String(thickness || "").match(/[0-9]+(?:\.[0-9]+)?/g);
  if (!nums) return null;
  const v = nums.map(Number).filter((n) => Number.isFinite(n) && n > 0);
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

export function animalFor(thickness: string, leatherType: string): { animal: string; basis: string } | null {
  const mm = substanceMm(thickness);
  if (mm === null) return null; // no substance recorded — leave as-is

  const isNap = /suede|nubuck/i.test(String(leatherType || ""));
  if (isNap && mm <= T_NAP_GOAT_MAX) {
    return { animal: "Goat", basis: `${mm.toFixed(2)}mm nap finish` };
  }

  if (mm < T_LAMB_MAX) return { animal: "Sheep", basis: `${mm.toFixed(2)}mm` };
  if (mm < T_GOAT_MAX) return { animal: "Goat", basis: `${mm.toFixed(2)}mm` };
  if (mm <= T_COW_MAX) return { animal: "Cow", basis: `${mm.toFixed(2)}mm` };
  return { animal: "Buffalo", basis: `${mm.toFixed(2)}mm` };
}

/** How the hide is named in product copy. */
function hideNoun(animal: string): string {
  switch (animal) {
    case "Buffalo": return "buffalo hide";
    case "Goat": return "goatskin";
    case "Sheep": return "lambskin";
    case "Exotic": return "exotic skin";
    default: return "cowhide";
  }
}

/** How the hide reads inside a product name, nap finishes included. */
function hideLabel(animal: string, leatherType: string): string {
  const t = String(leatherType || "").toLowerCase();
  const nap = t.includes("suede") ? "Suede" : t.includes("nubuck") ? "Nubuck" : "";
  if (nap) {
    const prefix =
      animal === "Goat" ? "Goat" :
      animal === "Sheep" ? "Lamb" :
      animal === "Buffalo" ? "Buffalo" : "Cow";
    return `${prefix} ${nap}`;
  }
  switch (animal) {
    case "Buffalo": return "Buffalo Hide";
    case "Goat": return "Goatskin";
    case "Sheep": return "Lambskin";
    case "Exotic": return "Exotic";
    default: return "Cowhide";
  }
}

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

function finishWord(finish: string, leatherType: string): string {
  const f = String(finish || "").toLowerCase();
  const t = String(leatherType || "").toLowerCase();
  const isNap = /suede|nubuck/.test(t);
  // On a nap finish only a surface treatment is worth stating; "Nappa" or
  // "Aniline" alongside "Suede" just clutters the name.
  if (isNap) return f.includes("waxed") ? "Waxed" : f.includes("pull-up") ? "Pull-Up" : "";
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

function buildName(doc: any, animal: string, sourceText: string, taken: Set<string>): string {
  const colour = Array.isArray(doc.colors) && doc.colors.length ? titleCase(String(doc.colors[0])) : "";
  const texture = textureOf(`${sourceText} ${doc.leatherType || ""} ${doc.finish || ""}`);
  const finish = finishWord(doc.finish, doc.leatherType);
  const hide = hideLabel(animal, doc.leatherType);

  const base = [colour, texture, finish, hide].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  if (base && !taken.has(base.toLowerCase())) { taken.add(base.toLowerCase()); return base; }

  const thick = String(doc.thickness || "").replace(/\s+/g, "");
  if (thick && /\d/.test(thick)) {
    const c = `${base} ${thick}`;
    if (!taken.has(c.toLowerCase())) { taken.add(c.toLowerCase()); return c; }
  }
  for (let i = 2; i < 60; i++) {
    const c = `${base} ${String(i).padStart(2, "0")}`;
    if (!taken.has(c.toLowerCase())) { taken.add(c.toLowerCase()); return c; }
  }
  return base;
}

/** Swaps the hide noun inside already-generated copy. */
function retargetDescription(description: string, animal: string): string {
  const target = hideNoun(animal);
  return String(description || "").replace(
    /\b(cowhide|buffalo hide|goatskin|lambskin|exotic skin)\b/gi,
    target
  );
}

// ──────────────────────────────── run ────────────────────────────────

async function run() {
  const dryRun = process.argv.includes("--dry-run");

  // Source text keyed by cloudinary slug, for the texture word.
  const sourceBySlug = new Map<string, string>();
  if (fs.existsSync(LEATHERWKS)) {
    const cat = JSON.parse(fs.readFileSync(LEATHERWKS, "utf8"));
    for (const p of Object.values(cat).flat() as any[]) {
      const s = String(p.downloaded_images?.[0] || "").split(/[\\/]/).slice(-3)[0] || slugify(p.name);
      sourceBySlug.set(s, `${p.name} ${p.description}`);
    }
  }
  if (fs.existsSync(DISTRICT)) {
    const cat = JSON.parse(fs.readFileSync(DISTRICT, "utf8"));
    for (const p of Object.values(cat).flat() as any[]) {
      const s = String(p.url || "").split("/").filter(Boolean).pop() || slugify(p.name);
      sourceBySlug.set(s, `${p.name} ${String(p.description_html || "").replace(/<[^>]+>/g, " ")}`);
    }
  }

  const { default: connectDB } = await import("../lib/config/db");
  const { default: RawLeather } = await import("../lib/models/RawLeather");
  const mongoose = (await import("mongoose")).default;
  await connectDB();

  const docs = await RawLeather.find({}).sort({ _id: 1 });
  log.start(`Segregating ${docs.length} hides by animal${dryRun ? "  (DRY RUN)" : ""}`);

  const before: Record<string, number> = {};
  docs.forEach((d: any) => { before[d.animal] = (before[d.animal] || 0) + 1; });

  const after: Record<string, number> = {};
  const moves: Record<string, number> = {};
  const stats = { processed: 0, updated: 0, unchanged: 0, noSubstance: 0, failed: 0 };
  const taken = new Set<string>();
  const samples: string[] = [];

  const totalBatches = Math.ceil(docs.length / BATCH_SIZE);
  for (let b = 0; b < totalBatches; b++) {
    const slice = docs.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    if (!slice.length) break;
    log.batch(`Batch ${b + 1}/${totalBatches}`);

    for (const doc of slice) {
      stats.processed++;
      try {
        const decision = animalFor(String(doc.thickness), String(doc.leatherType));
        if (!decision) {
          stats.noSubstance++;
          after[doc.animal] = (after[doc.animal] || 0) + 1;
          taken.add(String(doc.name).toLowerCase());
          log.skip(`${doc.name} — no substance recorded (thickness "${doc.thickness}"), left as ${doc.animal}`);
          continue;
        }

        const newAnimal = decision.animal;
        const slug = slugFromImages(doc.images as any);

        // Only catalogue rows that came from an import get a regenerated name.
        // Rows without a Cloudinary slug are the user's own entries — their
        // animal is corrected, but their naming is left alone.
        let newName = String(doc.name);
        if (slug) {
          const sourceText = sourceBySlug.get(slug) || slug.replace(/-/g, " ");
          newName = buildName(doc, newAnimal, sourceText, taken);
        } else {
          taken.add(String(doc.name).toLowerCase());
        }

        const newDescription = retargetDescription(String(doc.description), newAnimal);

        after[newAnimal] = (after[newAnimal] || 0) + 1;
        if (newAnimal !== doc.animal) {
          const key = `${doc.animal} → ${newAnimal}`;
          moves[key] = (moves[key] || 0) + 1;
        }

        const changed = newAnimal !== doc.animal || newName !== doc.name || newDescription !== doc.description;
        if (!changed) { stats.unchanged++; continue; }

        log.product(String(doc.name));
        log.animal(`${doc.animal} → ${newAnimal}   (${decision.basis})`);
        log.name(newName);
        if (samples.length < 10 && newAnimal !== doc.animal) {
          samples.push(`${doc.thickness.padEnd(12)} ${doc.animal} → ${newAnimal.padEnd(8)} ${doc.name}  →  ${newName}`);
        }

        if (!dryRun) {
          await RawLeather.findByIdAndUpdate(doc._id, {
            $set: { animal: newAnimal, name: newName, description: newDescription },
          });
          log.db(`Updated: ${newName}`);
        }
        stats.updated++;
      } catch (err: any) {
        stats.failed++;
        log.error(`${doc.name} — ${errText(err)}`);
      }
    }
  }

  if (dryRun) console.log("\n[DRY RUN]  No changes written to database");
  await mongoose.disconnect();

  const row = (l: string, v: string | number) => `║ ${l.padEnd(28)}${String(v).padEnd(16)}║`;
  const order = ["Cow", "Buffalo", "Goat", "Sheep", "Exotic"];

  console.log(`
╔═════════════════════════════════════════════╗
║   PURE GRAIN — HIDE SEGREGATION ${dryRun ? "DRY RUN" : "APPLIED"}   ║
╠═════════════════════════════════════════════╣
${row("Hides processed:", stats.processed)}
${row("Updated:", stats.updated)}
${row("Already correct:", stats.unchanged)}
${row("No substance recorded:", stats.noSubstance)}
${row("Failed:", stats.failed)}
╠═════════════════════════════════════════════╣
║ Animal split — before → after               ║
${order
  .filter((a) => (before[a] || 0) + (after[a] || 0) > 0)
  .map((a) => row(`  ${a}:`, `${before[a] || 0} → ${after[a] || 0}`))
  .join("\n")}
╠═════════════════════════════════════════════╣
║ Banding rule (substance midpoint)           ║
║   Lambskin   < 0.95 mm                      ║
║   Goatskin   0.95 – 1.15 mm                 ║
║   Cowhide    1.15 – 2.25 mm                 ║
║   Buffalo    > 2.25 mm                      ║
║   Suede/nubuck ≤ 1.30 mm → Goatskin         ║
╚═════════════════════════════════════════════╝`);

  if (Object.keys(moves).length) {
    console.log("\nReassignments:");
    Object.entries(moves).sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`  ${k}: ${n}`));
  }
  if (samples.length) {
    console.log("\nSample reassignments:");
    samples.forEach((s) => console.log(`  ${s}`));
  }

  process.exit(0);
}

run().catch((err) => {
  log.error(`Aborted: ${errText(err)}`);
  console.error(err);
  process.exit(1);
});
